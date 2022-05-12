from typing import Any, Optional
from datetime import date, datetime
from uuid import uuid4
import os

from pynamodb.models import Model
from pynamodb.indexes import GlobalSecondaryIndex, KeysOnlyProjection
from pynamodb.attributes import Attribute, UnicodeAttribute, DiscriminatorAttribute, MapAttribute, NumberAttribute, ListAttribute, BooleanAttribute
from pynamodb.constants import STRING

def _id() -> str:
    """
    Randomly generates and returns a unique id.
    """
    return str(uuid4())

class PercentageAmount(MapAttribute):
    """
    Represents either a percentage or an amount
    """
    type = UnicodeAttribute(default='Percentage')
    value = NumberAttribute(null=True)

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

class Item(MapAttribute):
    """
    Represents a single item associated with an expense
    """
    id = UnicodeAttribute()
    name = UnicodeAttribute()
    quantity = NumberAttribute()
    price = NumberAttribute()

    @classmethod
    def new(cls, **attr: Any) -> 'Item':
        return cls(id=_id(), **attr)

class UserStatus(MapAttribute):
    """
    Represents information about whether or not a user has payed for an expense.
    """
    user = UnicodeAttribute()
    paid = BooleanAttribute()
    wage = NumberAttribute()

class ExpenseModel(BaseModel, discriminator='Expense'):
    """
    Models metadata about an expense.

    PK/SK: Expense#<EXPENSE_ID>
    """
    name = UnicodeAttribute()
    owner = UnicodeAttribute()
    date = UnicodeAttribute()
    users = ListAttribute(of=UserStatus)
    split = UnicodeAttribute()
    expenseType = UnicodeAttribute()
    amount = NumberAttribute(null=True)
    items = ListAttribute(of=Item, null=True)
    tax = PercentageAmount(null=True)
    tip = PercentageAmount(null=True)

    @classmethod
    def new(cls, **attr: Any) -> 'ExpenseModel':
        pk = f'Expense#{_id()}'
        return cls(pk, pk, **attr)

class TagDateIndex(GlobalSecondaryIndex):
    """
    Represents an inverted index whose partition key is the expense user tag (tag)
    and whose sort key is the date (date) of the entry.

    This is used for querying each user's own and outstanding expenses, with the option
    to delineate between completed and incomplete expenses.
    """
    class Meta:
        index_name = 'tag-date-index'
        read_capacity_units = 5
        write_capacity_units = 5
        projection = KeysOnlyProjection()

    tag = UnicodeAttribute(hash_key=True)
    date = UnicodeAttribute(range_key=True)

class ExpenseUserModel(BaseModel, discriminator='ExpenseUser'):
    """
    Models metadata about a user who is associated with an expense

    PK:     Expense#<EXPENSE_ID>
    SK:     User#<USER_ID>
    tag:    {Owner|Payer|Past}#<USER_ID>

    Active expenses will have a tag prefixed with "Owner" or "Payer" if the user in question
    created or owes money towards the expense, respectively.

    Expenses that have been completed (i.e. all users have paid) will have the tag prefix "Past".
    This allows easy paging through all passed expenses.
    To determine if a user created a past expense, one can look at the corresponding ExpenseModel's 'owner' field. 
    """
    tag = UnicodeAttribute()
    date = UnicodeAttribute()
    tag_date_index = TagDateIndex()

    @classmethod
    def new(cls, expense: ExpenseModel, user_id: str, is_owner: bool):
        """
        Creates a new `ExpenseUserModel`.
        @expense: The associated `ExpenseModel`.
        @user_id: The id of the user associated with this object
        @is_owner: Whether or not the user denoted by `user_id` is the owner of this expense, i.e. the one who created it.
        """
        return cls(
            expense.id,
            f'User#{user_id}',
            tag=f'{"Owner" if is_owner else "Payer"}#{user_id}',
            date=expense.date
        )