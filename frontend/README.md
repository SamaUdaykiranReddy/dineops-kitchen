# DineOps AI — Smart Restaurant Management System

A full-stack, AI-powered restaurant POS system built with React, Node.js, MongoDB, and Docker. Deployed on AWS EC2.

🔴 **Live Demo:** http://3.91.216.209

## Features

- 🤖 **AI Assistant** — Real-time restaurant insights powered by Groq (LLaMA)
- 📊 **Dashboard** — Live revenue charts, active orders, inventory alerts
- 🍽️ **Orders** — Full lifecycle management (pending → preparing → ready → completed)
- 👨‍🍳 **Kitchen Display** — Live timers, urgency alerts, order tracking
- 🪑 **Tables** — Floor plan management, real-time status
- 📅 **Reservations** — Booking management with auto no-show cancellation
- 📋 **Menu** — Cart system, category filtering, order placement
- 📦 **Inventory** — Stock tracking, low stock alerts, supplier management
- 💳 **Payments** — Stripe card + cash payments via microservice
- 👥 **Staff** — Roles, shifts, performance ratings
- 👤 **Customers** — Loyalty points, visit history, VIP status
- 📈 **Analytics** — Revenue charts, top items, order distribution
- 📝 **Reports** — Daily sales, inventory, staff reports with CSV export
- ⚙️ **Settings** — Business config, notifications, integrations

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Recharts
- Stripe.js

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Groq AI (LLaMA 3.1)
- Helmet + CORS

### Payments Microservice
- Node.js + Express
- Stripe API
- MongoDB

### DevOps
- Docker + Docker Compose
- AWS EC2 (Ubuntu 22.04)
- Nginx
- MongoDB Atlas

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React Frontend  │────▶│  Express Backend  │────▶│   MongoDB Atlas     │
│   (Nginx :80)   │     │  (Node.js :5004)  │     │   (Cloud Database)  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                │
                         ┌──────▼──────────┐
                         │ Payments Service │
                         │ (Node.js :5007)  │
                         └─────────────────┘
```

## Local Development

### Prerequisites
- Node.js 22+
- MongoDB Atlas account
- Stripe account
- Groq API key

### Setup

```bash
# Clone the repo
git clone https://github.com/SamaUdaykiranReddy/dineops-kitchen.git
cd dineops-kitchen

# Backend
cd backend
cp .env.example .env
npm install
npm start

# Payments service
cd payments-service
cp .env.example .env
npm install
npm start

# Frontend
cd frontend
cp .env.example .env
npm install
npm start
```

### Environment Variables

**backend/.env**
```
MONGO_URI=your_mongodb_uri
PORT=5004
CLIENT_ORIGIN=http://localhost:3000
GROQ_API_KEY=your_groq_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

**payments-service/.env**
```
MONGO_URI=your_mongodb_uri
PORT=5007
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
ORDER_SERVICE_URL=http://localhost:5004
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:5004
REACT_APP_PAYMENT_URL=http://localhost:5007/payments
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Docker Deployment

```bash
# Build and run all services
docker compose up --build -d

# Check status
docker ps

# View logs
docker logs dineops-backend
docker logs dineops-payments
docker logs dineops-frontend
```

## Project Structure

```
dineops-kitchen/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # AIAssistant, Sidebar
│   │   ├── pages/            # All 13 pages
│   │   └── config.js         # API URLs
│   ├── Dockerfile
│   └── nginx.conf
├── backend/                  # Main Express API
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── utils/                # Helper functions
│   └── server.js
├── payments-service/         # Stripe microservice
│   ├── models/
│   ├── routes/
│   └── server.js
└── docker-compose.yml
```

## API Endpoints

### Orders
```
GET    /orders/recent
GET    /orders/:id
POST   /orders
PUT    /orders/:id
DELETE /orders/:id
```

### Inventory
```
GET    /inventory
POST   /inventory
PUT    /inventory/:id/stock
DELETE /inventory/:id
```

### Reservations
```
GET    /reservations
POST   /reservations
PUT    /reservations/:id/status
PUT    /reservations/:id/seat
```

### Staff
```
GET    /staff
POST   /staff
PUT    /staff/:id
PUT    /staff/:id/performance
DELETE /staff/:id
```

### Customers
```
GET    /customers
POST   /customers
PUT    /customers/:id
POST   /customers/:id/visit
DELETE /customers/:id
```

### Payments Microservice
```
POST   /payments/create-payment-intent
POST   /payments/webhook
GET    /payments
GET    /payments/search
```

## Author
Sama Udaykiran Reddy  
[GitHub](https://github.com/SamaUdaykiranReddy) · [LinkedIn](https://linkedin.com/in/yourprofile)

## License
MIT