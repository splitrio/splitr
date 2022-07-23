# Notes

Throughout this documentation, the following conventions apply to request/response schemas. For a variable `var`, the following syntaxes mean:

* `var` Either an object of `var`'s type or `null`
* `var?` Either an object of `var`'s type or `undefined` (but not `null`)
* `var!` An object of `var`'s type (not `null` or `undefined`)

# Get User <kbd>GET</kbd>
Gets information about a single user.
* **URL:**  `/users/:userId`
* **Requires Auth?** :white_check_mark:
* **Parameters:**  
&emsp; *Required*
    * `userId` The id of the user in question. Must refer to an existing user.
* **Request Body:** `{}`
* **Response Body:**
    ```ts
    {
        user!: string,
        firstName!: string,
        lastName!: string,
        wage!: number,
        venmo?: string
    }
    ```
    * `user` The unique identifier of the user. Same as `userId`.
    * `firstName` The user's first name.
    * `lastName` The user's last name.
    * `wage` The user's hourly salary in USD.
    * `venmo` The user's Venmo username without the leading `@`. Not present if the user hasn't linked a Venmo account.

# Get Users <kbd>GET</kbd>
Gets information about all users.
* **URL:**  `/users`
* **Requires Auth?** :white_check_mark:
* **Parameters:** None
* **Request Body:** `{}`
* **Response Body:**
    ```ts
    [
        {
            user!: string,
            firstName!: string,
            lastName!: string,
            wage!: number,
            venmo?: string
        }
    ]
    ```
    * `user` The unique identifier of the user.
    * `firstName` The user's first name.
    * `lastName` The user's last name.
    * `wage` The user's hourly salary in USD.
    * `venmo` The user's Venmo username without the leading `@`. Not present if the user hasn't linked a Venmo account.

# Create Expense <kbd>POST</kbd>
Creates a new expense.
* **URL:** `/expenses`
* **Required Auth?** :white_check_mark:
* **Parameters:** None
* **Request Body:**
    ```ts
    {
        name!: string,
        date!: string,
        split!: 
            'proportionally'
            | 'equally'
            | 'individually'
            | 'custom',
        users!: [
            {
                "user": string,
                "weight": number?
            }
        ],
        type!: 'single' | 'multiple',
        notes?: string,
        amount?: number
    }
    ```
    * `name` Non-empty. The name of this expense.
    * `date` The date this expense should be dated. E.g. `2022-10-05`


