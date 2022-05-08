import json
import awsgi
from flask_cors import CORS
from flask import Flask, jsonify, make_response, request
from validation import ExpenseValidator
from werkzeug.exceptions import HTTPException, BadRequest

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
    client_expense = request.get_json()
    if not ClientExpenseValidator.validate(client_expense):
        raise BadRequest(ClientExpenseValidator.errors)
    return jsonify("Request successful!")
    
def handler(event, context):
    return awsgi.response(app, event, context)
