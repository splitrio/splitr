from typing import Any, Optional
from datetime import date, datetime
from uuid import uuid4
import os

from pynamodb.models import Model
from pynamodb.attributes import Attribute, UnicodeAttribute, DiscriminatorAttribute, MapAttribute, NumberAttribute, ListAttribute
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
        region = os.environ.get('REGION')
        write_capacity_units = 5
        read_capacity_units = 5

    id = UnicodeAttribute(hash_key=True)
    sk = UnicodeAttribute(range_key=True)
    type = DiscriminatorAttribute()

class PercentageAmount(MapAttribute):
    """
    Represents either a percentage or an amount
    """
    type = UnicodeAttribute(default='Percentage')
    value = NumberAttribute(null=True)

class DateAttribute(Attribute[date]):
    """
    Represents a date in time
    """
    attr_type = STRING

    def serialize(self, value: date) -> str:
        return value.strftime(DATE_FORMAT)

    def deserialize(self, value: str) -> date:
        return datetime.strptime(value, DATE_FORMAT).date()

class Item(MapAttribute):
    """
    Represents a single item associated with an expense
    """
    id = UnicodeAttribute()
    name = UnicodeAttribute()
    quantity = NumberAttribute()
    price = NumberAttribute()

    @classmethod
    def new(cls, id: Optional[str]=None, **attr: Any) -> 'Item':
        if id is None: id = _id()
        return cls(id=id, **attr)

class ExpenseModel(BaseModel, discriminator='Expense'):
    """
    Models metadata about an expense
    """
    name = UnicodeAttribute()
    date = DateAttribute()
    owner = UnicodeAttribute()
    split = UnicodeAttribute()
    expenseType = UnicodeAttribute()
    amount = NumberAttribute(null=True)
    items = ListAttribute(of=Item, null=True)
    tax = PercentageAmount(null=True)
    tip = PercentageAmount(null=True)

    @classmethod
    def new(cls, id: Optional[str]=None, **attr: Any) -> 'ExpenseModel':
        if id is None: id = _id()
        return cls(id, 'Expense', **attr)