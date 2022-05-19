from datetime import datetime
from distutils.util import strtobool
from pydoc import resolve
from typing import Any, Dict, Iterable, Optional, Tuple, TypedDict, Union

import json
import awsgi
import os
import boto3
from flask_cors import CORS
from flask import Flask, Response, jsonify, request
from werkzeug.exceptions import HTTPException, BadRequest, NotFound, Unauthorized

import models
from validation import ExpenseValidator

from pynamodb.transactions import TransactWrite, TransactGet
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
            if 'value' not in percentage_amount or percentage_amount['value'] is None: return current_value
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

class TransformExpenseArgs(TypedDict):
    total: float
    """The total amount of this expense (if precomputed)"""
    contribution: float
    """This user's contribution towards this expense (if precomputed)"""

def transform_expense(expense: Dict[str, Any], user_id: str, **kwargs: TransformExpenseArgs) -> Dict[str, Any]:
    """
    Transforms an encoded expense model before it is returned to the client.
    @expense: The encoded expense object. **Will** be modified.
    """
    # Add total and contribution fields
    expense['total'] = kwargs.get('total', resolve_expense_total(expense))
    expense['contribution'] = kwargs.get('contribution', resolve_expense_contribution(expense, expense['total'], user_id))

    # Remap 'expenseType' to 'type', and remove 'type'
    expense['type'] = expense.pop('expenseType')

    # Rename expense id to remove 'Expense#' prefix and remove sk
    expense['id'] = expense['id'].split('#')[1]
    del expense['sk']

    # Remove expense version
    del expense['version']

    return expense

def parse_bool(value: Union[str, bool]) -> bool:
    if isinstance(value, bool): return value
    return strtobool(value)

def update_and_write_expense(expense: models.ExpenseModel, data: Dict[str, Any]):
    """
    Validates client sent data, modifies the given expense, and writes it to the database.
    Returns the encoded, transformed version of the expense.
    @expense: An existing or newly created expense model.
    @data: Data sent from the client which will be validated.
        If validation fails, `BadRequest` is raised.
    """
    if not ClientExpenseValidator.validate(data):
        raise BadRequest(ClientExpenseValidator.errors)
    data = ClientExpenseValidator.document

    user_info = get_user_details()
    user_id = user_info['cognito:username']

    # Validation succeeded, create ExpenseModel from client input
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
        expense.users = [models.UserStatus(user=user_id, paid=True, wage=float(user_info['custom:hourlyWage']))]
    else:
        # See docs: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/cognito-idp.html#CognitoIdentityProvider.Client.list_users
        cognito_users = cognito.list_users(UserPoolId=USER_POOL_ID)
        user_ids = (user['Username'] for user in cognito_users['Users'])
        expense.users = [models.UserStatus(
            user=user['Username'],
            paid=user['Username'] == user_id,
            wage=next(float(attr['Value']) for attr in user['Attributes'] if attr['Name'] == 'custom:hourlyWage')
        ) for user in cognito_users['Users']]

    users = [models.ExpenseUserModel.new(expense, id) for id in user_ids]

    # When we write an expense to the database, we must write associated users as entries to the table as well
    # We will use a transaction to do this to ensure that all writes occur atomically
    with TransactWrite(connection=connection) as transaction:
        transaction.save(expense)
        for user in users:
            transaction.save(user)

    return transform_expense(Encoder.encode(expense), user_id)

def verify_expense_modification(expense: models.ExpenseModel, user_id: str):
    # Only the owner of an expense can delete
    if expense.owner != user_id:
        raise Unauthorized()
    
    # Expenses can't be deleted if another user has paid
    if any(user.paid for user in expense.users if user.user != user_id):
        raise BadRequest("Can't delete/modify an expense with confirmed users.")

@app.route(BASE_ROUTE, methods=['POST'])
def create_expense():
    expense = models.ExpenseModel.new()
    data = request.get_json()
    transformed = update_and_write_expense(expense, data)
    return jsonify(transformed), 201

@app.route(BASE_ROUTE, methods=['GET'])
def get_expenses():
    # Amplify front-end GET requests use query params, NOT a JSON body... weird
    own = parse_bool(request.args.get('own', True))
    past = parse_bool(request.args.get('past', False))
    group_expenses = parse_bool(request.args.get('group', False))
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

    # If group is true, group expenses by users and add in user info
    if group_expenses:
        groups = {}
        for expense in expenses:
            owner = expense['owner']
            if owner not in groups:
                groups[owner] = {}
                groups[owner]['expenses'] = []
            groups[owner]['expenses'].append(expense)
        
        users = resolve_user_infos(groups.keys())
        for owner, group in groups.items():
            group['owner'] = users[owner]

        return jsonify(groups)

    return jsonify(expenses)

@app.route(f'{BASE_ROUTE}/<expense_id>', methods=['GET'])
def get_expense(expense_id):
    try:
        pk = f'Expense#{expense_id}'
        model = models.ExpenseModel.get(pk, pk)
        
        # Users can only see expenses they are a part of
        user_info = get_user_details()
        user_id = user_info['cognito:username']
        if user_id not in (user.user for user in model.users):
            raise NotFound()

        encoded = Encoder.encode(model)

        # Populate result's user field with information about all associated users
        total = resolve_expense_total(encoded)
        contribution = resolve_expense_contribution(encoded, total, user_id)    # This user's contribution
        user_infos = resolve_user_infos(user['user'] for user in encoded['users'])
        for user in encoded['users']:
            # Populate fields such as first name, last name, wage, etc.
            user.update(user_infos[user['user']])

            # Add contribution. This check prevents computing this user's contribution twice
            if user['user'] == user_id:
                user['contribution'] = contribution
            else: user['contribution'] = resolve_expense_contribution(encoded, total, user['user'])

            # Add proportional contribution
            user['proportion'] = user['contribution'] / total

        return jsonify(transform_expense(encoded, user_id, total=total, contribution=contribution))
    except DoesNotExist:
        raise NotFound()

@app.route(f'{BASE_ROUTE}/<expense_id>', methods=['PUT'])
def put_expense(expense_id):
    pk = f'Expense#{expense_id}'
    try: expense = models.ExpenseModel.get(pk, pk)
    except DoesNotExist: raise NotFound("No expense with that id found")

    user_info = get_user_details()
    user_id = user_info['cognito:username']

    # Only users can update their own expenses
    verify_expense_modification(expense, user_id)

    data = request.get_json()
    transformed = update_and_write_expense(expense, data)
    return jsonify(transformed)

def confirm_or_rescind_expenses(confirm: bool, expense_ids: Iterable[str]) -> Response:
    user_info = get_user_details()
    user_id = user_info['cognito:username']

    with TransactWrite(connection=connection) as write_transaction:
        for expense_id in expense_ids:
            # Get expense model and corresponding user model
            # If this fails, either:
            #   1) The expense doesn't exist
            #   2) This user is not a part of this expense
            #   3) The transaction failed due to concurrency
            # @todo: find a way to distinguish between these states and communicate this to the client
            pk = f'Expense#{expense_id}'
            with TransactGet(connection=connection) as transaction:
                expense_future = transaction.get(models.ExpenseModel, pk, pk)
                user_future = transaction.get(models.ExpenseUserModel, pk, f'User#{user_id}')
            
            expense: models.ExpenseModel = expense_future.get()
            expense_user: models.ExpenseUserModel = user_future.get()

            # Owners cannot confirm/rescind their own expenses
            if expense.owner == user_id:
                raise BadRequest(f'Cannot {"confirm" if confirm else "rescind"} own request')

            # Update expense users to indicate that this user has or hasn't paid
            all_were_paid = all(user.paid for user in expense.users)
            for user in expense.users:
                if user.user == user_id and user.paid != confirm:
                    user.paid = confirm
                    break
            else: raise BadRequest(f'Expense already {"confirmed" if confirm else "rescinded"}')
            all_paid = all(user.paid for user in expense.users)

            # If this confirmation/rescission will ultimately change whether or not all the users had confirmed,
            # this will necessitate writing to the owner's own row
            owner_needs_update = all_paid != all_were_paid
            owner_expense_user: Optional[models.ExpenseUserModel] = None
            if owner_needs_update:
                with TransactGet(connection=connection) as transaction:
                    owner_user_future = transaction.get(models.ExpenseUserModel, pk, f'User#{expense.owner}')
                owner_expense_user = owner_user_future.get()
            
            user_index = next(i for i in range(len(expense.users)) if expense.users[i].user == user_id)

            # Update expense model
            write_transaction.update(
                expense,
                actions=[
                    models.ExpenseModel.users[user_index].paid.set(confirm),
                    models.ExpenseModel.users[user_index].paid_time.set(datetime.now() if confirm else None)
                ]
            )

            # Update user's tag
            expense_user.update_from_expense(expense, user_id)
            write_transaction.update(
                expense_user,
                actions=[models.ExpenseUserModel.tag.set(expense_user.tag)]
            )

            # Update owner's tag if necessary
            if owner_needs_update:
                owner_expense_user.update_from_expense(expense, expense.owner)
                write_transaction.update(
                    owner_expense_user,
                    actions=[models.ExpenseUserModel.tag.set(owner_expense_user.tag)]
                )

    return jsonify("Success")

@app.route(f'{BASE_ROUTE}/<expense_id>/confirm', methods=['POST'])
def confirm_expense(expense_id):
    return confirm_or_rescind_expenses(True, [expense_id])

@app.route(f'{BASE_ROUTE}/<expense_id>/rescind', methods=['POST'])
def rescind_expense(expense_id):
    return confirm_or_rescind_expenses(False, [expense_id])

@app.route(f'{BASE_ROUTE}/confirm', methods=['POST'])
def confirm_all():
    expense_ids = request.get_json()
    return confirm_or_rescind_expenses(True, expense_ids)

@app.route(f'{BASE_ROUTE}/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    pk = f'Expense#{expense_id}'
    try:
        expense = models.ExpenseModel.get(pk,pk)
    except DoesNotExist:
        return jsonify('Success')

    user_info = get_user_details()
    user_id = user_info['cognito:username']

    # Verify that the user has permission to modify this expense
    verify_expense_modification(expense, user_id)

    # OK to delete, delete all items with the primary key from the database
    with TransactWrite(connection=connection) as transaction:
        for model in models.BaseModel.query(pk):
            transaction.delete(model)
    
    return jsonify('Success')
    
def handler(event, context):
    return awsgi.response(app, event, context)
