import json
import awsgi
import os
import boto3
from flask_cors import CORS
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException, BadRequest

import models
from validation import ExpenseValidator

from pynamodb.transactions import TransactWrite
from pynamodb.connection import Connection
import pynamodb_encoder.encoder as encoder

cognito = boto3.client('cognito-idp')

app = Flask(__name__)
CORS(app)

BASE_ROUTE = '/expenses'

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
    if expense.split == 'individually': user_ids = {user_id}
    else:
        cognito_users = cognito.list_users(UserPoolId=os.environ.get('AUTH_SPLITR2AC25091_USERPOOLID'))
        user_ids = {user['Username'] for user in cognito_users['Users']}
    users = [models.ExpenseUserModel.new(expense, id, id == user_id) for id in user_ids]

    # Add payment status information to expense model
    expense.users = [models.UserStatus(user=id) for id in user_ids if id != user_id]

    # When we write an expense to the database, we must write associated users as entries to the table as well
    # We will use a transaction to do this to ensure that all writes occur atomically
    with TransactWrite(connection=connection) as transaction:
        transaction.save(expense)
        for user in users:
            transaction.save(user)

    return jsonify(Encoder.encode(expense))

@app.route(BASE_ROUTE, methods=['GET'])
def get_expenses():
    # Amplify front-end GET requests use query params, NOT a JSON body... weird
    own = request.args.get('own', False)
    user_info = get_user_details()

    partition = f'{"Owner" if own else "Payer"}#{user_info["cognito:username"]}'
    query = models.ExpenseUserModel.tag_date_index.query(partition)
    items = models.ExpenseModel.batch_get([(item.id, item.id) for item in query])
    return jsonify([Encoder.encode(item) for item in items])
    
def handler(event, context):
    return awsgi.response(app, event, context)
