# 🏦 SmartBank - Bank Management System

A full-stack banking management web application designed to streamline core banking operations across multiple roles: **Customer**, **Cashier**, **Manager**, and **System Administrator**.

---

## 🌟 Key Features

- **🔐 Multi-Role Authentication & Access Control**
  - Role-based authorization with JSON Web Tokens (JWT) & bcrypt password hashing.
  - Distinct dashboards tailored to Customers, Cashiers, Branch Managers, and Admins.

- **👤 Customer Portal**
  - Real-time balance and profile overview.
  - Interactive passbook & transaction history with filters.
  - Funds transfer and statement downloads in PDF format.
  - QR Code integration for seamless payments.

- **💵 Cashier Operations**
  - Instant deposits and cash withdrawals.
  - Real-time account verification and slip logging.

- **👔 Manager Oversight**
  - Customer account review and approvals.
  - Financial analytics and branch transaction charts with Recharts.

- **⚙️ Admin Console**
  - Complete user management, role assignments, and audit logging.
  - System health monitoring.

---

## 🛠️ Tech Stack

- **Frontend:**
  - React 18
  - Vite
  - React Router DOM
  - Lucide React (Icons)
  - Recharts (Analytics & Charts)
  - jsPDF & html2canvas (e-Statements)
- **Backend:**
  - Node.js & Express.js
  - MongoDB & Mongoose
  - JSON Web Tokens (JWT) & BcryptJS
  - CORS & Dotenv

---

## 📁 Repository Structure

```text
bank-management-system/
├── client/                     # Frontend Vite + React application
│   ├── src/                    # Components, pages, hooks, services
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend Node.js + Express REST API
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route controllers
│   ├── middleware/             # Auth & role-check middleware
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express API routes
│   ├── services/               # Seed & business logic
│   ├── .env.example            # Sample environment variables
│   ├── package.json
│   └── server.js
├── .gitignore                  # Git ignore rules (node_modules, .env, dist)
├── dev.js                      # Dual-server concurrent runner script
├── package.json                # Root package configuration
├── start.bat                   # 1-click Windows launcher
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or MongoDB Atlas URI)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/bank-management-system.git
cd bank-management-system
```

### 2. Install Dependencies

You can install dependencies for both the frontend and backend:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Return to root directory
cd ..
```

### 3. Environment Configuration

Create a `.env` file inside the `server/` folder (or copy from `.env.example`):

```bash
cp server/.env.example server/.env
```

Ensure the variables are set correctly:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartbank_db
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 4. Running the Application

You can start both backend and frontend servers simultaneously from the root directory:

```bash
npm run dev
```

Alternatively on Windows, simply double-click `start.bat`.

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Accounts

For local demonstration and evaluation, default seed credentials are provided:

| Role | Email | Password |
|---|---|---|
| **Customer** | `customer@smartbank.com` | `customer123` |
| **Cashier** | `cashier@smartbank.com` | `cashier123` |
| **Manager** | `manager@smartbank.com` | `manager123` |
| **Admin** | `admin@smartbank.com` | `admin123` |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
