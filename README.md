# Library Hub - Online Library Management System

A full-stack library management system with React frontend and Spring Boot backend.

## Features

### User Features
- Browse and search books
- Borrow and return books  
- View borrowing history
- Profile management
- **Wishlist** - Save books for later
- **Dark Mode** - Toggle light/dark theme

### Admin Features
- Dashboard with statistics
- Add/Edit/Delete books
- Manage users
- Bulk book operations

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Spring Boot 3.2, Spring Security, JWT
- **Database**: H2 (dev) / MySQL (prod)

## Quick Start

### Backend
```bash
cd backend-spring
mvnw.cmd spring-boot:run
```
Runs on: http://localhost:8081

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on: http://localhost:5173

## Login Credentials
- **Admin**: admin@library.com / admin123
- **User**: john@example.com / password123
