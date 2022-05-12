from distutils.util import strtobool
from typing import Any, Dict, Iterable, Tuple, TypedDict, Union

import json
import awsgi
import os
import boto3
from flask_cors import CORS
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException, BadRequest, NotFound

import models
from validation import ExpenseValidator

from pynamodb.transactions import TransactWrite
from pynamodb.connection import Connection
from pynamodb.exceptions import DoesNotExist
import pynamodb_encoder.encoder as encoder

cognito = boto3.client('cognito-idp')

app = Flask(__name__)
CORS(app)

BASE_ROUTE = '/expenses'
USER_POOL_ID = os.environ.get('AUTH_SPLITR2AC25091_USERPOOLID')

ClientExpenseValidator = ExpenseValidator()
Encoder = encoder.Encoder()

connection = Connection(region=os.environ.get('REGION'))

@app.errorhandler(HTTPException)
def handle_exception(e: HTTPException):
    """Return JSON instead of HTML for HTTP errors."""
    # start with the correct headers and status code from the error
    response = e.get_response()
    # replace the body with JSON
    response.data = json.dumps({
        "code": e.code,
        "name": e.name,
        "description": e.description,
    })
    response.content_type = "application/json"
    return response

def get_user_details():
    return request.environ['awsgi.event']['requestContext']['authorizer']['claims']

class UserInfo(TypedDict):
    firstName: str
    lastName: str
    wage: float

def resolve_user_infos(user_ids: Iterable[str]) -> Dict[str, UserInfo]:
    """
    Given user IDs, populates a client-facing mapping of user IDs to user info.
    @users: An iterable of user IDs
    """
    result = {}
    for user_id in user_ids:
        # Lookup user with cognito
        # See docs: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cognito-idp.html#CognitoIdentityProvider.Client.admin_get_user
        user_attrs = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=user_id
        )['UserAttributes']

        user_info: UserInfo = {}

        for attr in user_attrs:
            if attr['Name'] == 'given_name':
                user_info['firstName'] = attr['Value']
            elif attr['Name'] == 'family_name':
                user_info['lastName'] = attr['Value']
            elif attr['Name'] == 'custom:hourlyWage':
                user_info['wage'] = float(attr['Value'])
        
        result[user_id] = user_info

    return result

def resolve_expense_total(expense: Dict[str, Any]) -> float:
    """
    Calculates the total value of an expense.
    @expense: The encoded, un-transformed expense object.
    @returns: A tuple whose first element is `user_id`'s contribution and second is the total value of the expense.
    """
    if expense['expenseType'] == 'single':
        return expense['amount']
    elif expense['expenseType'] == 'multiple':
        def resolve_percentage_amount(current_value: float, percentage_amount) -> float:
            if percentage_amount['value'] is None: return current_value
            if percentage_amount['type'] == 'percentage':
                return current_value * (1 + percentage_amount['value'] / 100)
            elif percentage_amount['type'] == 'amount':
                return current_value + percentage_amount['value']
            else: raise Exception(f'Invalid percentage amount type: {percentage_amount["type"]}')
        total = sum(item['price'] * item['quantity'] for item in expense['items'])
        total = resolve_percentage_amount(total, expense['tax'])
        total = resolve_percentage_amount(total, expense['tip'])
        return total
    else: raise Exception(f'Invalid expense type: {expense["expenseType"]}')

def resolve_expense_contribution(expense: Dict[str, Any], total: float, user_id: str) -> float:
    """
    Calculates the contribution of a user towards an expense.
    @expense: The encoded, un-transformed expense object
    @total: The total value of the expense, as returned by `resolve_expense_total`
    @user_id: The id of the user whose contribution towards this expense will be found.
        Must match a user inside `expense['users']` or equal `expense['owner']`
    @users: A mapping of user ids to info about those users.
        Must map `user_id` and all users inside `expense['users']`
    """
    if expense['split'] == 'individually': return total
    elif expense['split'] == 'equally': return total / len(expense['users'])
    elif expense['split'] == 'proportionally':
        my_wage = next(user['wage'] for user in expense['users'] if user['user'] == user_id)
        total_wages = sum(user['wage'] for user in expense['users'])
        return (my_wage / total_wages) * total
    else: raise Exception(f'Invalid expense split method: {expense["split"]}')

def transform_expense(expense: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """
    Transforms an encoded expense model before it is returned to the client.
    @expense: The encoded expense object. **Will** be modified.
    """
    # Add total and contribution fields
    expense['total'] = resolve_expense_total(expense)
    expense['contribution'] = resolve_expense_contribution(expense, expense['total'], user_id)

    # Remap 'expenseType' to 'type', and remove 'type'
    expense['type'] = expense.pop('expenseType')

    # Rename expense id to remove 'Expense#' prefix and remove sk
    expense['id'] = expense['id'].split('#')[1]
    del expense['sk']

    return expense

def parse_bool(value: Union[str, bool]) -> bool:
    if isinstance(value, bool): return value
    return strtobool(value)

@app.route(BASE_ROUTE, methods=['POST'])
def create_expense():
    data = request.get_json()
    if not ClientExpenseValidator.validate(data):
        raise BadRequest(ClientExpenseValidator.errors)
    data = ClientExpenseValidator.document

    user_info = get_user_details()
    user_id = user_info['cognito:username']

    # Validation succeeded, create ExpenseModel from client input
    expense = models.ExpenseModel.new()
    expense.name = data['name']
    expense.owner = user_id
    expense.date = data['date']
    expense.split = data['split']
    expense.expenseType = data['type']
    
    # Seperate fields are defined for either single or multiple item expenses
    if expense.expenseType == 'single':
        expense.amount = data['amount']
    else:
        expense.items = [models.Item.new(
            name=item['name'],
            quantity=item['quantity'],
            price=item['price'])
            for item in data['items']]
        expense.tax = models.PercentageAmount(**data['tax'])
        expense.tip = models.PercentageAmount(**data['tip'])

    # Get all users who are a part of this transaction to add into DynamoDB
    # Currently, this means everyone (except for individual expenses, in which case it is only the owning user)
    if expense.split == 'individually':
        user_ids = [user_id]
        expense.users = [models.UserStatus(user=user_id, paid=True, wage=user_info['custom:hourlyWage'])]
    else:
        # See docs: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cognito-idp.html#CognitoIdentityProvider.Client.list_users
        cognito_users = cognito.list_users(UserPoolId=USER_POOL_ID)
        user_ids = (user['Username'] for user in cognito_users['Users'])
        expense.users = [models.UserStatus(
            user=user['Username'],
            paid=user['Username'] == user_id,
            wage=float(next(attr['Value'] for attr in user['Attributes'] if attr['Name'] == 'custom:hourlyWage'))
        ) for user in cognito_users['Users']]

    users = [models.ExpenseUserModel.new(expense, id, id == user_id) for id in user_ids]

    # When we write an expense to the database, we must write associated users as entries to the table as well
    # We will use a transaction to do this to ensure that all writes occur atomically
    with TransactWrite(connection=connection) as transaction:
        transaction.save(expense)
        for user in users:
            transaction.save(user)

    return jsonify(transform_expense(Encoder.encode(expense), user_id))

@app.route(BASE_ROUTE, methods=['GET'])
def get_expenses():
    # Amplify front-end GET requests use query params, NOT a JSON body... weird
    own = parse_bool(request.args.get('own', True))
    past = parse_bool(request.args.get('past', False))
    user_info = get_user_details()
    user_id = user_info['cognito:username']

    group = "Past" if past else ("Owner" if own else "Payer")
    partition = f'{group}#{user_id}'
    query = models.ExpenseUserModel.tag_date_index.query(partition)
    batch = models.ExpenseModel.batch_get((item.id, item.id) for item in query)
    expenses = [Encoder.encode(item) for item in batch]

    # Sort items in reverse chronological order
    expenses.sort(key=lambda item: item['date'], reverse=True)

    # Get ids of all associated users
    user_ids = set(user_info['user'] for item in expenses for user_info in item['users'])
    user_ids.update(item['owner'] for item in expenses)
    users = resolve_user_infos(user_ids)

    # Transform each expense in place, adding info like contribution and total cost
    for i in range(len(expenses)): transform_expense(expenses[i], user_id)

    return jsonify(expenses=expenses, users=users)

@app.route(f'{BASE_ROUTE}/<expense_id>', methods=['GET'])
def get_expense(expense_id):
    try:
        pk = f'Expense#{expense_id}'
        model = models.ExpenseModel.get(pk, pk)
        encoded = Encoder.encode(model)
        return jsonify(transform_expense(encoded))
    except DoesNotExist:
        raise NotFound()

    
def handler(event, context):
    return awsgi.response(app, event, context)
