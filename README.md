# Basic Need Chartity
This is a charity is a virtual charity from WEB701.

## Purpose
This repository contains API prototype for Basic Needs Charity website.

## Content
**This is the structure of the repository**
```
WEB701/
├── charity_api/
│   ├── node_modules/ # Installed dependencies (auto-generated)
│   ├── routes/
│   │   ├── accountRoutes.js
│   │   ├── itemRoutes.js
│   │   └── tokenRoutes.js
│   ├── package.json
│   ├── package-locak.json
│   └── server.js
└── README.md
```

**Run the server**
```Bash
Node server.js
```

**Test the API with Postman**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | http://localhost:3000/api/accounts  | Create new account |
| GET    | http://localhost:3000/api/accounts/1 | Retrieve the account with AccountID |
| PUT    | http://localhost:3000/api/accounts/1 | Update account by AccountID |
| DELETE | http://localhost:3000/api/accounts/1 | Delete account by AccountID |
| POST   | http://localhost:3000/api/items  | Create new item |
| GET    | http://localhost:3000/api/items/1 | Retrieve the item with ItemID |
| PUT    | http://localhost:3000/api/items/1 | Update item by ItemID |
| DELETE | http://localhost:3000/api/items/1 | Delete item by ItemID |
| POST   | http://localhost:3000/api/tokens  | Create new token |
| GET    | http://localhost:3000/api/tokens/1 | Retrieve the token with TokenID |
| PUT    | http://localhost:3000/api/tokens/1 | Update token by TokenID |
