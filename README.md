# FastAPI Production Template

A production-ready FastAPI application demonstrating best practices with async patterns, dependency injection, comprehensive error handling, and clean architecture.

## Features

- **Async/Await Patterns**: Full async support for high-performance I/O operations
- **Clean Architecture**: Separation of concerns with layers (API, Service, Repository, Model)
- **Dependency Injection**: Leveraging FastAPI's built-in DI system
- **Authentication & Authorization**: JWT-based auth with OAuth2 password flow
- **Repository Pattern**: Generic CRUD operations with custom queries
- **Pydantic Schemas**: Strong typing for request/response validation
- **Error Handling**: Comprehensive error handling with HTTP exceptions
- **Database**: SQLAlchemy async ORM with SQLite (easily switchable to PostgreSQL)
- **CORS Support**: Configurable CORS middleware
- **API Documentation**: Auto-generated OpenAPI (Swagger) and ReDoc documentation

## Project Structure

```
app/
├── api/                    # API layer
│   ├── v1/
│   │   ├── endpoints/     # API endpoints
│   │   │   ├── auth.py    # Authentication endpoints
│   │   │   ├── users.py   # User endpoints
│   │   │   └── items.py   # Item endpoints
│   │   └── router.py      # API router
│   └── dependencies.py    # Shared dependencies (auth, etc.)
├── core/                  # Core configuration
│   ├── config.py         # Settings management
│   ├── security.py       # Security utilities (JWT, password hashing)
│   └── database.py       # Database configuration
├── models/               # SQLAlchemy models
│   ├── user.py          # User model
│   └── item.py          # Item model
├── schemas/             # Pydantic schemas
│   ├── user.py         # User schemas
│   ├── item.py         # Item schemas
│   └── token.py        # Token schemas
├── services/           # Business logic layer
│   ├── user_service.py # User business logic
│   └── auth_service.py # Authentication logic
├── repositories/       # Data access layer
│   ├── base_repository.py    # Generic CRUD operations
│   ├── user_repository.py   # User data access
│   └── item_repository.py   # Item data access
└── main.py            # Application entry point
```

## Installation

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Setup

1. Clone the repository or copy the project files

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment configuration:
```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration (especially the `SECRET_KEY`)

## Running the Application

### Development Server

Run with auto-reload enabled:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application will be available at:
- API: http://localhost:8000
- Interactive API docs (Swagger UI): http://localhost:8000/docs
- Alternative API docs (ReDoc): http://localhost:8000/redoc

### Production Server

For production, use multiple workers:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or use Gunicorn with Uvicorn workers:

```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## API Usage Examples

### 1. Register a New User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "John Doe"
  }'
```

### 2. Login to Get Access Token

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=securepassword123"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Get Current User Profile

```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create an Item

```bash
curl -X POST "http://localhost:8000/api/v1/items/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Item",
    "description": "This is a test item"
  }'
```

### 5. Get All Items

```bash
curl -X GET "http://localhost:8000/api/v1/items/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Update an Item

```bash
curl -X PATCH "http://localhost:8000/api/v1/items/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Item Title",
    "is_active": true
  }'
```

### 7. Delete an Item

```bash
curl -X DELETE "http://localhost:8000/api/v1/items/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing

Run tests with pytest:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app tests/
```

## Database Migration (Optional)

For production applications, consider using Alembic for database migrations:

1. Install Alembic:
```bash
pip install alembic
```

2. Initialize Alembic:
```bash
alembic init alembic
```

3. Configure `alembic.ini` and `alembic/env.py` with your database settings

4. Create and run migrations:
```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Configuration

All configuration is managed through environment variables. See `.env.example` for available options:

- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: Secret key for JWT token generation (CHANGE IN PRODUCTION!)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiration time
- `BACKEND_CORS_ORIGINS`: Allowed CORS origins

## Architecture Patterns

### Repository Pattern
Separates data access logic from business logic, making the code more testable and maintainable.

### Service Layer
Contains business logic, keeping route handlers thin and focused on HTTP concerns.

### Dependency Injection
FastAPI's DI system is used throughout for database sessions, authentication, and service injection.

### Async/Await
Full async support for database operations and API endpoints for optimal performance.

## Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication with JWT
- **OAuth2 Password Flow**: Standard OAuth2 implementation
- **CORS**: Configurable CORS middleware
- **Input Validation**: Pydantic schemas for request validation

## Best Practices Implemented

1. **Separation of Concerns**: Clear boundaries between API, service, repository, and model layers
2. **Type Hints**: Comprehensive type hints throughout the codebase
3. **Async All The Way**: Async database operations and route handlers
4. **Error Handling**: Consistent error responses with appropriate HTTP status codes
5. **Documentation**: Auto-generated API documentation with examples
6. **Configuration Management**: Environment-based configuration
7. **Testing**: Structure supports easy unit and integration testing

## Common Tasks

### Adding a New Endpoint

1. Create model in `app/models/`
2. Create schemas in `app/schemas/`
3. Create repository in `app/repositories/`
4. Create service in `app/services/`
5. Create endpoint in `app/api/v1/endpoints/`
6. Register router in `app/api/v1/router.py`

### Switching to PostgreSQL

1. Update `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
```

2. Install asyncpg:
```bash
pip install asyncpg
```

3. Update `requirements.txt`

## License

This is a template project for educational and development purposes.

## Support

For issues and questions, please refer to the FastAPI documentation:
- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/
- SQLAlchemy: https://docs.sqlalchemy.org/
