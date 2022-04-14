[![Netlify Status](https://api.netlify.com/api/v1/badges/2a33471e-4df3-45f0-9e3e-4254adcc6773/deploy-status)](https://app.netlify.com/sites/gimmemoney/deploys)

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
– (automatic default, manual entry) date
– (manual entry) tag/type of transaction
– (automatic default, manual entry) intended to be split to group / individual purchase

## User Flow
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

## Who-pays-who flow
This only concerns the GROUP database. Populates a list of transactions of who pay who to even everything out. This is an example for a single receipt.
1. John A'Bierto-Lin paid $110 on Monday, Shoujandro Baca paid $80 on Wednesday, Jacael Nath paid $20 on Thursday, and Michob Barahona paid $10 on Friday.
2. Take the mean = $55. This means that we each had $55 worth of food, but some of us paid more, while some of us paid less.
3. For everyone, take what they paid – mean to calculate what they are owed / what they owe. For example, John A'Bierto-Lin has a delta of $110 – $55 = $55. He is owed $55 by the people who didn't pay their share. Whereas, Michob Barahona has a delta of $10 – $55 = -$45. He owes $45 to the people who overpaid their share.
4. In the end (unless everyone paid *exactly* the same amount), there will be different deltas and all of them will add to $0. In simpler terms, some people owe money to others to even out contributions.

5. The algorithm would move sequentially.
6. Consider who is owed the most money. John A'Bierto-Lin needs $55. Doesn't care who(s) he gets it from just needs the money.
7. Consider who owes the most money. Michob Barahona owes $45. Michob will pay John.
8. Calculate fulfillment = delta_John + delta_Michob = $10 := delta_John.

*** If fullfillment is $0. We got lucky and one dude paid another dude back completely, no overflow
*** If fulfillment is <$0. The payer doesn't need to pay back whatever he owes to this payee. The payer will give his money to the next payee in need.
*** If fulfillment is >$0. The payer was able to pay back some of what he owes to this payee. The next payer will give his money to this payee in need.
*** > No matter fulfillment, add to transaction database accordingly. Also, update deltas of people accordingly.

9. Add this transaction to TRANSACTION database. This means Michob was able to pay most of what John needs. John still needs $10. Update deltas (including Michob's).

*** Are all deltas == 0? If so, we're done re-allocating. If not, we're not done re-allocating. (in this case we're done now).

10. Michob has contributed his fair share now, we can't extract any more out of him. Jacael Nath owes $10.
11. Fulfillment = delta_John (we're still on him) – delta_Jacael = -$25 := delta_John.
12. Add this transaction to TRANSACTION databse. This means Jacael had more than enough money to pay whatever John was was still owed. Now, Jacael only owes $25 to whoever is left.
13. John A'Bierto-Lin has received all the money he needs to balance things out.

14. Consider who is owed the (next) most money. Shoujandro Baca needs $25.
15. Consider who owes the most money. Jacael Nath owes $25. Jacael will pay Shoujandro.
16. Calculat fulfillment = delta_Shoujandro + delta_Jacael = $0 := delta_Shoujandro.
17. Add this transaction to the TRANSACTIon databse. This means that Jacael had exactly enough money to pay whatever Shoujandro was owed. Update deltas (including Jacael's).

*** Are all deltas == 0? If so, we're done re-allocating. If not, we're not done re-allocating. (in this case we're done now).
