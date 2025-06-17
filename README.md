# ⚙️ Boss Restaurant – Server

This is the **server-side application** for the [Boss Restaurant](https://boss-restaurant-61c7e.web.app/) web app.  
It handles API routes, database operations, JWT-based authentication, payment integration, and admin logic.

---

## 🌐 Live Server URL

🟢 Hosted on: [ Vercel ](#) (boss-server-weld.vercel.app)  
Example API Endpoint: `/menu`, `/users`, `/orders`

---

## 🚀 Features

- 🧾 RESTful API using **Express.js**
- 🔐 JWT Authentication & Role-based Access
- 🧑 Admin route protection (middleware)
- 🍔 Menu and Cart management APIs
- 💳 Stripe Payment Integration
- 🌐 CORS-enabled for frontend requests
- 🛡️ Environment variables and security middleware

---

## 🛠️ Tech Stack

| Technology     | Use                                 |
|----------------|--------------------------------------|
| Node.js        | Runtime environment                  |
| Express.js     | Server framework                     |
| MongoDB        | Database (CRUD operations)           |
| Mongoose       | ODM for MongoDB                      |
| JSON Web Token | Authentication & Authorization       |
| Stripe         | Payment processing                   |
| dotenv         | Manage environment variables         |
| cors, helmet   | Middleware for security              |

---

## 📁 Folder Structure


---

## ⚙️ How to Run Locally

```bash
# 1. Clone the server repository
git clone https://github.com/Emon-ED/Boss-Restaurant-Server-.git

# 2. Go to the server folder
cd Boss-Restaurant-Server-

# 3. Install dependencies
npm install

# 4. Create a `.env` file and add the required environment variables:
Example:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=your_stripe_key
CLIENT_URL=https://boss-restaurant-61c7e.web.app
# 5. Start the server
npm run start

