from datetime import date
from dateutil import parser
from cerberus import Validator
import cgi

DATE_FORMAT = '%Y-%m-%d'

def _coerce_no_future(value: str):
    parsed = parser.isoparse(value).date()
    if parsed > date.today():
        raise Exception("Date cannot be in the future")
    return parsed.strftime(DATE_FORMAT)

_PercentageAmountSchema = {
    'type': {
        'type': 'string',
        'allowed': ['percentage', 'amount']
    },
    'value': {
        'type': 'float',
        'nullable': True,
        'anyof': [
            {
                'dependencies': {
                    'type': 'percentage'
                },
                'min': 0,
                'max': 100
            },
            {
                'dependencies': {
                    'type': 'amount'
                },
                'min': 0
            },
            {
                'nullable': True,
                'allowed': [None]
            }
        ]
    }
}

_ItemSchema = {
    'name': {
        'type': 'string',
        'empty': False
    },
    'quantity': {
        'type': 'integer',
        'min': 1
    },
    'price': {
        'type': 'float',
        'noneof': [{'max': 0}],  # positive
    }
}

_ExpenseSchemaBase = {
    'name': {
        'type': 'string',
        'empty': False
    },
    'date': {
        'type': 'string',
        'coerce': _coerce_no_future,
        'empty': False
    },
    'split': {
        'type': 'string',
        'allowed': ['proportionally', 'equally', 'individually']
    },
    'splitWith': {
        'type': 'list',
        'schema': {
            'type': 'string'
        }
    },
    'type': {
        'type': 'string',
        'allowed': ['single', 'multiple']
    },
    'notes': {
        'type': 'string',
        'nullable': True
    },
    'images': {
        'type': 'list',
        'schema': {
            'type': 'string'
        },
        'nullable': True
    }
}
"""
Schema common to all expenses
"""

_ExpenseSchemaSingle = {
    'amount': {
        'type': 'float',
        'noneof': [{'max': 0}],  # positive
    },
}
"""
Schema common to expenses containing a single payment
"""

_ExpenseSchemaMultiple = {
    'items': {
        'type': 'list',
        'minlength': 1,
        'schema': {
            'type': 'dict',
            'schema': _ItemSchema
        }
    },
    'tax': {
        'type': 'dict',
        'schema': _PercentageAmountSchema
    },
    'tip': {
        'type': 'dict',
        'schema': _PercentageAmountSchema
    }
}
"""
Schema common to expenses containing multiple items (payments)
"""

def _create_validator(schema) -> Validator:
    v = Validator(schema)
    v.purge_unknown = True
    v.require_all = True
    return v

class ExpenseValidator:
    _BaseValidator = _create_validator(_ExpenseSchemaBase)
    _PolymorphicValidators = {
        'single': _create_validator(_ExpenseSchemaSingle),
        'multiple': _create_validator(_ExpenseSchemaMultiple)
    }

    def __init__(self):
        self._errors = {}

    def validate(self, data):
        if not self._BaseValidator.validate(data):
            self._errors = self._BaseValidator.errors
            return False

        specialized = self._PolymorphicValidators[data['type']]
        if not specialized.validate(data):
            self._errors = specialized.errors
            return False

        return True

    @property
    def errors(self):
        return self._errors

    @property
    def document(self):
        """
        Returns the normalized document passed in to `validate`.

        Preconditions: Last call to `validate` returned `True`
        """
        doc = {}
        doc.update(self._BaseValidator.document)
        doc.update(self._PolymorphicValidators[doc['type']].document)
        return doc
        
