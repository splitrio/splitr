# <kbd>GET</kbd> Get User
* **URL:**  `/users/:userId`
* **Method:** `GET`
* **URL Parameters:**  
&emsp; *Required*
    * `userId` The id of the user in question.
* **Body Parameters:** None
* **Requires Auth?** :white_check_mark:
* **Response:**
    ```json
    {
        "user": string,
        "firstName": string,
        "lastName": string,
        "wage": number,
        "venmo": string?
    }
    ```
    * `user` The unique identifier of the user. Same as `userId`.
    * `firstName` The user's first name.
    * `lastName` The user's last name.
    * `wage` The user's hourly salary in USD.
    * `venmo` The user's Venmo username without the leading `@`. Not present if the user hasn't linked a Venmo account.
* **Remarks:**
    * Request will fail if `userId` is not an ID for an existing user.
