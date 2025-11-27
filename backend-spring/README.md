# Online Library Management System - Spring Boot Backend

A production-ready Spring Boot backend API for the Online Library Management System with JWT authentication, JPA/Hibernate, and comprehensive book management features.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Role-based access control (USER/ADMIN)
  - BCrypt password hashing
  - Spring Security integration

- **Book Management**
  - CRUD operations for books
  - Advanced search with filters
  - Book borrowing and returning system
  - Availability tracking

- **User Management**
  - User registration and login
  - Profile management
  - Borrowing history and statistics

- **Admin Features**
  - Dashboard with comprehensive statistics
  - User and book management
  - Borrowing records oversight

## 🛠️ Tech Stack

- **Framework**: Spring Boot 3.2.0
- **Security**: Spring Security with JWT
- **Database**: H2 (development) / PostgreSQL (production)
- **ORM**: Spring Data JPA with Hibernate
- **Build Tool**: Maven
- **Java Version**: 17+

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- (Optional) PostgreSQL for production

## 🚀 Getting Started

### 1. Clone and Navigate

```bash
cd backend-spring
```

### 2. Run the Application

```bash
# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# Or using installed Maven
mvn spring-boot:run
```

The application will start on http://localhost:3000

### 3. Access Points

- **API Base URL**: http://localhost:3000/api
- **H2 Console**: http://localhost:3000/h2-console
- **Health Check**: http://localhost:3000/api/health
- **Actuator**: http://localhost:3000/actuator/health

### 4. Default Credentials

**Admin User:**
- Email: admin@library.com
- Password: admin123

**Regular User:**
- Email: john@example.com
- Password: password123

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
| GET | `/api/books/{id}` | Get single book | Public |
| POST | `/api/books/{id}/borrow` | Borrow a book | Private |
| POST | `/api/books/{id}/reserve` | Reserve a book | Private |
| POST | `/api/books/{id}/return` | Return a book | Private |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/user/profile` | Get user profile | Private |
| PUT | `/api/user/profile` | Update profile | Private |
| GET | `/api/user/borrow-history` | Get borrowing history | Private |
| GET | `/api/user/active-borrows` | Get active borrows | Private |
| POST | `/api/user/renew/{borrowId}` | Renew a book | Private |
| GET | `/api/user/stats` | Get user statistics | Private |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/dashboard/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/books` | Get all books (admin) | Admin |
| POST | `/api/admin/books` | Create new book | Admin |
| PUT | `/api/admin/books/{id}` | Update book | Admin |
| DELETE | `/api/admin/books/{id}` | Delete book | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| PUT | `/api/admin/users/{id}` | Update user | Admin |
| DELETE | `/api/admin/users/{id}` | Delete user | Admin |

## 🔐 Authentication

### JWT Token Usage

```bash
# Login to get tokens
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'

# Use access token for authenticated requests
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Refresh token when access token expires
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## 🗄️ Database Configuration

### Development (H2 In-Memory)

The application uses H2 in-memory database by default:

- **URL**: `jdbc:h2:mem:library_db`
- **Username**: `sa`
- **Password**: `password`
- **Console**: http://localhost:3000/h2-console

### Production (PostgreSQL)

Update `application.yml` or use environment variables:

```yaml
spring:
  profiles:
    active: production
  datasource:
    url: jdbc:postgresql://localhost:5432/library_management
    username: your_username
    password: your_password
```

Or use environment variables:
```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/library_management
export DATABASE_USERNAME=your_username
export DATABASE_PASSWORD=your_password
export JWT_SECRET=your-production-jwt-secret
export JWT_REFRESH_SECRET=your-production-refresh-secret
```

## 🏗️ Project Structure

```
src/main/java/com/library/
├── LibraryManagementApplication.java    # Main application class
├── config/
│   ├── SecurityConfig.java              # Spring Security configuration
│   └── DataInitializer.java             # Sample data initialization
├── controller/
│   ├── AuthController.java              # Authentication endpoints
│   ├── BookController.java              # Book management endpoints
│   ├── UserController.java              # User profile endpoints
│   ├── AdminController.java             # Admin dashboard endpoints
│   └── HealthController.java            # Health check endpoint
├── dto/
│   ├── AuthRequest.java                 # Login request DTO
│   ├── RegisterRequest.java             # Registration request DTO
│   ├── ApiResponse.java                 # Standard API response
│   └── PaginationResponse.java          # Pagination metadata
├── entity/
│   ├── User.java                        # User entity
│   ├── Book.java                        # Book entity
│   └── BorrowRecord.java                # Borrow record entity
├── repository/
│   ├── UserRepository.java              # User data access
│   ├── BookRepository.java              # Book data access
│   └── BorrowRecordRepository.java      # Borrow record data access
├── security/
│   ├── JwtTokenProvider.java            # JWT token utilities
│   └── JwtAuthenticationFilter.java     # JWT authentication filter
└── service/
    ├── UserService.java                 # User business logic
    ├── BookService.java                 # Book business logic
    └── BorrowRecordService.java         # Borrowing business logic
```

## 🔧 Configuration

### Application Properties

Key configuration options in `application.yml`:

```yaml
# Server configuration
server:
  port: 3000

# JWT configuration
jwt:
  secret: your-jwt-secret
  refresh-secret: your-refresh-secret
  expiration: 900000  # 15 minutes
  refresh-expiration: 604800000  # 7 days

# CORS configuration
cors:
  allowed-origins:
    - http://localhost:5173  # React frontend
    - http://localhost:3000
```

### Environment Variables

For production, use environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: Refresh token signing secret

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123"}'

# Get books
curl http://localhost:3000/api/books

# Search books
curl "http://localhost:3000/api/books/search?q=javascript"
```

### Running Tests

```bash
mvn test
```

## 🚀 Deployment

### Building for Production

```bash
# Build JAR file
mvn clean package

# Run the JAR
java -jar target/library-management-system-1.0.0.jar
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM openjdk:17-jdk-slim
COPY target/library-management-system-1.0.0.jar app.jar
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Environment Variables for Production

```bash
export SPRING_PROFILES_ACTIVE=production
export DATABASE_URL=jdbc:postgresql://your-db-host:5432/library_management
export DATABASE_USERNAME=your_username
export DATABASE_PASSWORD=your_password
export JWT_SECRET=your-very-long-and-secure-jwt-secret
export JWT_REFRESH_SECRET=your-very-long-and-secure-refresh-secret
```

## 🔒 Security Features

- **JWT Authentication**: Stateless authentication with access and refresh tokens
- **Password Hashing**: BCrypt with salt rounds
- **Role-Based Access Control**: USER and ADMIN roles
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: Bean validation on all inputs
- **SQL Injection Protection**: JPA/Hibernate parameterized queries

## 📊 Sample Data

The application automatically initializes with:

- **4 Users**: 1 admin, 3 regular users
- **12 Books**: Programming, web development, and computer science books
- **3 Borrow Records**: Sample borrowing history

## 🤝 Frontend Integration

This backend is fully compatible with the React frontend:

1. **Same API Endpoints**: Identical to the Node.js version
2. **Same Response Format**: Compatible JSON responses
3. **CORS Configured**: Allows requests from http://localhost:5173

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in application.yml or use environment variable
   export SERVER_PORT=8080
   ```

2. **Database Connection Issues**
   - Check H2 console at http://localhost:3000/h2-console
   - Verify PostgreSQL connection for production

3. **JWT Token Issues**
   - Ensure JWT secrets are properly configured
   - Check token expiration times

4. **CORS Issues**
   - Update allowed origins in application.yml
   - Verify frontend URL configuration

### Logging

Enable debug logging:

```yaml
logging:
  level:
    com.library: DEBUG
    org.springframework.security: DEBUG
```

## 📄 License

This project is licensed under the MIT License.

---

## 🎯 Next Steps

The Spring Boot backend is now complete and ready to use with your React frontend! The API provides the exact same endpoints as the Node.js version, so your frontend will work without any changes.

To get started:
1. Run `mvn spring-boot:run`
2. Access the API at http://localhost:3000
3. Use the default credentials to test the system
4. Your React frontend at http://localhost:5173 should now work perfectly!
