# Quick Start Guide

This guide will help you get the FastAPI application up and running in under 5 minutes.

## Prerequisites

- Python 3.11 or higher
- pip

## Installation Steps

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Environment

```bash
cp .env.example .env
```

Note: The default configuration uses SQLite, so it works out of the box. For production, update the `.env` file with your database URL and generate a secure SECRET_KEY.

### 4. Initialize Database

```bash
python init_db.py
```

### 5. Run the Application

```bash
python run.py
```

Or use uvicorn directly:

```bash
uvicorn app.main:app --reload
```

The application will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## Testing the API

### 1. Register a User

Open your browser and go to http://localhost:8000/docs

Or use curl:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "full_name": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpassword123"
```

Save the `access_token` from the response.

### 3. Create an Item

```bash
curl -X POST "http://localhost:8000/api/v1/items/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Item",
    "description": "This is a test item"
  }'
```

### 4. Get Your Items

```bash
curl -X GET "http://localhost:8000/api/v1/items/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Running Tests

```bash
pytest
```

With coverage:

```bash
pytest --cov=app tests/
```

## Next Steps

- Explore the interactive API documentation at http://localhost:8000/docs
- Check out the full README.md for detailed information
- Modify the code to add your own features
- Switch to PostgreSQL for production use

## Troubleshooting

### Import Errors

If you see import errors, make sure you're in the project root directory and the virtual environment is activated.

### Database Errors

If you see database errors, try deleting `app.db` and running `python init_db.py` again.

### Port Already in Use

If port 8000 is already in use, you can specify a different port:

```bash
uvicorn app.main:app --reload --port 8001
```
