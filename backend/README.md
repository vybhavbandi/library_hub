# Online Library Management System - Backend API

A complete Node.js/Express backend API for the Online Library Management System with JWT authentication, MongoDB integration, and comprehensive book management features.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Role-based access control (User/Admin)
  - Secure password hashing with bcrypt
  - Token refresh mechanism

- **Book Management**
  - CRUD operations for books
  - Advanced search functionality
  - Book borrowing and returning
  - Availability tracking
  - Genre and year filtering

- **User Management**
  - User registration and login
  - Profile management
  - Borrowing history
  - User statistics

- **Admin Features**
  - Dashboard with statistics
  - User management
  - Book management
  - Borrowing records oversight

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Security**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🚀 Getting Started

### 1. Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Update the `.env` file with your settings:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/library_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

### 3. Database Setup

Make sure MongoDB is running, then seed the database with sample data:

```bash
# Seed database with sample books and users
npm run seed
```

This will create:
- Sample books (programming, web development, databases)
- Admin user (admin@library.com / admin123)
- Regular users (john@example.com / password123)
- Sample borrowing records

### 4. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:3000

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/logout` | User logout | Private |
| GET | `/api/auth/me` | Get current user | Private |

### Books Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/books` | Get all books (paginated) | Public |
| GET | `/api/books/search` | Search books | Public |
| GET | `/api/books/:id` | Get single book | Public |
| POST | `/api/books/:id/borrow` | Borrow a book | Private |
| POST | `/api/books/:id/reserve` | Reserve a book | Private |
| POST | `/api/books/:id/return` | Return a book | Private |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/user/profile` | Get user profile | Private |
| PUT | `/api/user/profile` | Update profile | Private |
| GET | `/api/user/borrow-history` | Get borrowing history | Private |
| GET | `/api/user/active-borrows` | Get active borrows | Private |
| POST | `/api/user/renew/:borrowId` | Renew a book | Private |
| GET | `/api/user/stats` | Get user statistics | Private |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/dashboard/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/books` | Get all books (admin) | Admin |
| POST | `/api/admin/books` | Create new book | Admin |
| PUT | `/api/admin/books/:id` | Update book | Admin |
| DELETE | `/api/admin/books/:id` | Delete book | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/health` | Server health check | Public |

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Access Token**: Short-lived (15 minutes), used for API requests
2. **Refresh Token**: Long-lived (7 days), used to get new access tokens

### Usage Example

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken, refreshToken } = await response.json();

// Use access token for authenticated requests
const booksResponse = await fetch('/api/books/123/borrow', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

## 📊 Database Schema

### User Model
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: String (user/admin)
- `refreshTokens`: Array of tokens
- `isActive`: Boolean

### Book Model
- `title`: String (required)
- `author`: String (required)
- `isbn`: String (unique, optional)
- `genre`: String
- `publishedYear`: Number
- `description`: String
- `coverImage`: String (URL)
- `totalCopies`: Number (required)
- `availableCopies`: Number (required)
- `location`: Object (shelf, section)
- `tags`: Array of strings
- `isActive`: Boolean

### BorrowRecord Model
- `user`: ObjectId (ref: User)
- `book`: ObjectId (ref: Book)
- `borrowedAt`: Date
- `dueAt`: Date
- `returnedAt`: Date
- `renewedCount`: Number
- `status`: String (borrowed/returned/overdue/renewed)
- `fineAmount`: Number
- `finePaid`: Boolean
- `notes`: String

## 🔧 Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed
```

### Project Structure

```
backend/
├── models/           # Database models
│   ├── User.js
│   ├── Book.js
│   └── BorrowRecord.js
├── routes/           # API routes
│   ├── auth.js
│   ├── books.js
│   ├── user.js
│   └── admin.js
├── middleware/       # Custom middleware
│   └── auth.js
├── scripts/          # Utility scripts
│   └── seedData.js
├── server.js         # Main server file
├── package.json
└── README.md
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Input Validation**: All inputs validated
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Separate secrets for access/refresh tokens

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/library_management
JWT_SECRET=your-production-jwt-secret-very-long-and-random
JWT_REFRESH_SECRET=your-production-refresh-secret-very-long-and-random
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Update `MONGODB_URI` in your `.env` file

## 🤝 API Integration

This backend is designed to work with the React frontend. Make sure:

1. Frontend `VITE_API_BASE_URL` points to this backend
2. CORS is configured for your frontend domain
3. Both servers are running for full functionality

## 📝 Sample Data

The seed script creates:

- **12 sample books** (programming, web development, databases)
- **4 users** (1 admin, 3 regular users)
- **Sample borrow records** for testing

### Default Credentials

**Admin User:**
- Email: admin@library.com
- Password: admin123

**Regular User:**
- Email: john@example.com
- Password: password123

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **JWT Token Errors**
   - Verify JWT secrets are set
   - Check token expiration times

3. **CORS Issues**
   - Update CORS origin in `server.js`
   - Ensure frontend URL is correct

4. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing processes on port 3000

## 📄 License

This project is licensed under the MIT License.
