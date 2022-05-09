import json
import awsgi
from flask_cors import CORS
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException, BadRequest

import models
from validation import ExpenseValidator

app = Flask(__name__)
CORS(app)

BASE_ROUTE = '/expenses'

ClientExpenseValidator = ExpenseValidator()

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

@app.route(BASE_ROUTE, methods=['POST'])
def create_expense():
    return jsonify({k:v for k, v in request.headers.items()})
    data = request.get_json()
    if not ClientExpenseValidator.validate(data):
        raise BadRequest(ClientExpenseValidator.errors)
    data = ClientExpenseValidator.document

    # Validation succeeded, add to DynamoDB
    expense = models.ExpenseModel.new()
    expense.name = data['name']
    expense.date = data['date']
    expense.split = data['split']
    expense.expenseType = data['type']
    
    # Seperate fields defined for either single or multiple item expenses
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
    expense.save()
    return expense.serialize()
    
def handler(event, context):
    return awsgi.response(app, event, context)
