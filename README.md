# 🏍️ Bike Consultancy — Vehicle Management System

Production-ready web application built with **Node.js + Express + MongoDB** (backend).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

---

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env — set your MONGODB_URI and JWT_SECRET
nano .env

# Seed default admin + expense categories
npm run seed
# → Creates: admin / Admin@123

# Start development server
npm run dev
# → Runs on http://localhost:5000
```

#### `.env` Configuration
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bike_consultancy
JWT_SECRET=change_this_to_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
```

---

## 📡 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Vehicles
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/vehicles` | List (filters: status, search, page) |
| POST | `/api/vehicles` | Create + upload images (multipart) |
| GET | `/api/vehicles/:id` | Get detail + expenses + sold info |
| PUT | `/api/vehicles/:id` | Update |
| DELETE | `/api/vehicles/:id` | Soft delete (admin) |
| POST | `/api/vehicles/:id/sell` | Mark as sold |
| POST | `/api/vehicles/:id/expenses` | Add repair expense |
| POST | `/api/vehicles/:id/images` | Upload more images |
| DELETE | `/api/vehicles/:id/images/:imageId` | Remove image |

### Expenses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/expenses/categories` | List categories |
| POST | `/api/expenses/categories` | Create category (admin) |
| GET | `/api/expenses/office` | List office expenses (filter: month, year) |
| POST | `/api/expenses/office` | Add expense + receipt upload |
| DELETE | `/api/expenses/office/:id` | Soft delete (admin) |

### Dashboard & Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Stats, recent vehicles, recent sales, chart data |
| GET | `/api/reports?year=2024` | Per-vehicle profit, monthly breakdown |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List all + unread count |
| PUT | `/api/notifications/read-all` | Mark all as read |

---

## 🗄️ Database Models

| Collection | Description |
|-----------|-------------|
| `users` | Admin & staff accounts (bcrypt passwords) |
| `vehicles` | Inventory master (soft-delete, virtuals for images/expenses) |
| `vehicleimages` | Photos per vehicle (primary flag) |
| `vehicleexpenses` | Per-vehicle repair/RTO costs |
| `expensecategories` | Office expense category master |
| `officeexpenses` | Shop running costs (rent, salary, etc.) |
| `soldvehicles` | Buyer info + final sale price (1:1 with vehicle) |
| `notifications` | Bell icon alerts (insurance, sales, inventory) |

---

## 🔒 Security Features
- JWT authentication with 7-day expiry
- Bcrypt password hashing (12 rounds)
- Helmet.js security headers
- CORS with origin whitelist
- Rate limiting: 200 req/15min (API), 20 req/15min (auth)
- Soft delete (records preserved)
- Admin-only routes (delete, reports, categories)

## ⏰ Cron Jobs
- **Daily @ 9 AM**: Scans vehicles with insurance expiring within 30 days → creates warning notifications

## 📦 Production Build

```bash
# Backend (with PM2)
cd backend
npm install -g pm2
pm2 start src/server.js --name bike-consultancy
pm2 save
```
