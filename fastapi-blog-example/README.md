# FastAPI Blog Application

A production-ready FastAPI blog application with authentication, built following best practices and clean architecture patterns.

## Features

- **User Management**: User registration, authentication, and profile management
- **Blog Posts**: Create, read, update, and delete blog posts
- **Authentication**: JWT-based authentication with secure password hashing
- **Clean Architecture**: Repository pattern, service layer, and dependency injection
- **Async/Await**: Full async support for high performance
- **Type Safety**: Complete type hints with Pydantic schemas
- **API Documentation**: Auto-generated OpenAPI (Swagger) documentation

## Project Structure

```
fastapi-blog-example/
├── app/
│   ├── api/                    # API routes
│   │   ├── v1/
│   │   │   ├── endpoints/      # API endpoints
│   │   │   │   ├── auth.py     # Authentication endpoints
│   │   │   │   ├── users.py    # User endpoints
│   │   │   │   └── posts.py    # Post endpoints
│   │   │   └── router.py       # API router configuration
│   │   └── dependencies.py     # Shared dependencies
│   ├── core/                   # Core configuration
│   │   ├── config.py           # Application settings
│   │   ├── database.py         # Database configuration
│   │   └── security.py         # Security utilities
│   ├── models/                 # Database models
│   │   ├── user.py             # User model
│   │   └── post.py             # Post model
│   ├── schemas/                # Pydantic schemas
│   │   ├── user.py             # User schemas
│   │   ├── post.py             # Post schemas
│   │   └── token.py            # Token schemas
│   ├── services/               # Business logic
│   │   ├── user_service.py     # User service
│   │   └── post_service.py     # Post service
│   ├── repositories/           # Data access layer
│   │   ├── base_repository.py  # Base CRUD repository
│   │   ├── user_repository.py  # User repository
│   │   └── post_repository.py  # Post repository
│   ├── tests/                  # Tests
│   └── main.py                 # Application entry point
├── requirements.txt            # Dependencies
├── .env.example               # Environment variables example
└── README.md                  # This file
```

## Installation

### Prerequisites

- Python 3.9+
- pip or poetry for package management

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fastapi-blog-example
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the following:
   - `SECRET_KEY`: Generate a secure secret key
   - `DATABASE_URL`: Your database connection string

5. **Run the application**:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login and get access token

### Users

- `POST /api/v1/users/` - Register new user
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PATCH /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

### Posts

- `POST /api/v1/posts/` - Create new post (authenticated)
- `GET /api/v1/posts/` - Get all published posts
- `GET /api/v1/posts/my-posts` - Get current user's posts (authenticated)
- `GET /api/v1/posts/{post_id}` - Get post by ID
- `PATCH /api/v1/posts/{post_id}` - Update post (authenticated, author only)
- `DELETE /api/v1/posts/{post_id}` - Delete post (authenticated, author only)

## Usage Examples

### 1. Register a new user

```bash
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123",
    "full_name": "John Doe"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=SecurePass123"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Create a post

```bash
curl -X POST "http://localhost:8000/api/v1/posts/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first blog post.",
    "published": true
  }'
```

### 4. Get all published posts

```bash
curl "http://localhost:8000/api/v1/posts/"
```

## Architecture Patterns

This application follows several best practices:

### Repository Pattern
Separates data access logic from business logic, making the code more testable and maintainable.

### Service Layer
Contains business logic, keeping it separate from API routes and data access.

### Dependency Injection
Uses FastAPI's dependency injection system for database sessions, authentication, and more.

### Async/Await
Full async support for non-blocking I/O operations.

### Type Safety
Complete type hints with Pydantic for request/response validation.

## Testing

Run tests with pytest:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app tests/
```

## Security Features

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication with expiring tokens
- **Authorization**: Role-based access control for resources
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Prevention**: SQLAlchemy ORM protects against SQL injection

## Development

### Running in Development Mode

```bash
uvicorn app.main:app --reload --log-level debug
```

### Code Quality

Format code with black:
```bash
black app/
```

Sort imports with isort:
```bash
isort app/
```

Lint with flake8:
```bash
flake8 app/
```

### Database Migrations

For production use, consider using Alembic for database migrations:

```bash
pip install alembic
alembic init migrations
```

## Production Deployment

### Environment Variables

Set these environment variables in production:

- `DATABASE_URL`: Production database URL
- `SECRET_KEY`: Strong secret key (use secrets.token_urlsafe(32))
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

### Running with Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t fastapi-blog .
docker run -p 8000:8000 fastapi-blog
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License

## Credits

Built with FastAPI following the patterns from the fastapi-templates skill.
