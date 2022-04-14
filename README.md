# app
An app for splitting bills among friends

# Purpose
We're a bunch of roommates and we need to manage costs. Some ppl are buying groceries for dishes that we're all eating, and we need a way to figure out who owes who and tracking how much money we're spending.

# Components
## A way to scan grocery receipts.
Stores all the items, quantities, prices, and tax per receipt.
Also keep track of who actually paid for the groceries so we know who to pay back (and who pays them back).

## A way to track other incidental expenditures
For stuff like eating out, movies, hiking/camping equipment...really anything else.
Same idea, store what it was, cost, who paid, etc.

## Things to keep in mind
You tag each transaction/set of transactions with common features like:
> (automatic default, manual entry) date
> (manual entry) tag/type of transaction
> (automatic default, manual entry) intended to be split to group / individual purchase

## Flow
This will be hosted on a web app, where you can scan receipts and enter other transaction data. Here's how it works:
1. John A'Bierto-Lin goes out one fine evening and buys some groceries for the seattlelites.
2. John A'Bierto-Lin obviously isn't going to pay for everyone's meals since he a broke college student, so he need other people to pay him back.
3. John A'Bierto-Lin pulls up Roomoney on his phone.
4. John A'Bierto-Lin clicks the receipt option.
5. John A'Bierto-Lin tags the data push, saying it's for groceries (could've said something else as well!).
6. John A'Bierto-Lin inputs whether this is for the GROUP or his PERSONAL tracking.
7. John A'Bierto-Lin scans the receipt.
8. Roomoney sends the receipt to the server on the cloud.
9. The server sends the receipt to the computer that will be running the Python code.
10. The computer accepts the receipt, feed it into the python code, magic happens, and the python function returns a dataframe with the requisite columns.
11. This dataframe is pushed to the respective GROUP or PERSONAL firebase database.
12. The user's flow is completed. John A'Bierto-Lin is asked whether he wants to scan another receipt.
13. If he does, then start from step 5 with default fields. If he doesn't, take him back to main menu – step 3.
