from typing import Optional
from datetime import date, datetime
from uuid import uuid4
import os

from pynamodb.models import Model
from pynamodb.attributes import Attribute, UnicodeAttribute, DiscriminatorAttribute, MapAttribute, NumberAttribute
from pynamodb.constants import STRING

DATE_FORMAT = '%Y-%m-%d'

def _id() -> str:
    return str(uuid4())

class BaseModel(Model):
    """
    Base model for all table entries
    """
    class Meta:
        table_name = os.environ.get('STORAGE_SPLITR_NAME')

    id = UnicodeAttribute(hash_key=True)
    sk = UnicodeAttribute(sort_key=True)
    type = DiscriminatorAttribute()

class PercentageAmount(MapAttribute):
    type = UnicodeAttribute(default='Percentage')
    value = NumberAttribute(null=True)

class DateAttribute(Attribute[date]):
    """
    An attribute for storing a UTC Date
    """
    attr_type = STRING

    def serialize(self, value: date) -> str:
        return value.strftime(DATE_FORMAT)

    def deserialize(self, value: str) -> date:
        return datetime.strptime(value, DATE_FORMAT).date()


class ExpenseModel(BaseModel, discriminator='Expense'):
    """
    Models metadata about an expense
    """
    name = UnicodeAttribute()
    date = DateAttribute()
    split = UnicodeAttribute()
    expenseType = UnicodeAttribute()
    amount = NumberAttribute(null=True)
    tax = PercentageAmount(null=True)
    tip = PercentageAmount(null=True)

    @classmethod
    def new(cls, id: Optional[str]) -> 'ExpenseModel':
        if id is None: id = _id()
        return cls(id, 'Expense')
    

class ItemModel(BaseModel, DiscriminatorAttribute='Item'):
    """
    Models a single item associated with an expense
    """
    name = UnicodeAttribute()
    quantity = NumberAttribute()
    price = NumberAttribute()

    @classmethod
    def new(cls, expenseId: str, itemId: Optional[str]) -> 'ItemModel':
        if itemId is None: itemId = _id()
        return cls(expenseId, f'Item#{itemId}')