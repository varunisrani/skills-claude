# Request Flow Documentation

This document illustrates how a request flows through the FastAPI application architecture.

## Example: Create Item Request

```
Client Request: POST /api/v1/items/
Authorization: Bearer <JWT_TOKEN>
Body: {"title": "My Item", "description": "Test"}
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                  │
│                    (curl, browser, app)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Request
                             │ POST /api/v1/items/
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI (main.py)                          │
│  - CORS Middleware                                              │
│  - Request Validation                                           │
│  - Route Matching                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               API ROUTER (api/v1/router.py)                     │
│  Routes to correct endpoint based on path                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          AUTHENTICATION (api/dependencies.py)                   │
│  - get_current_user(token)                                      │
│    ├─ Decode JWT token                                          │
│    ├─ Extract user_id                                           │
│    └─ Fetch user from database                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ user object
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         API ENDPOINT (api/v1/endpoints/items.py)                │
│  @router.post("/")                                              │
│  async def create_item(                                         │
│      item_in: ItemCreate,                                       │
│      db: AsyncSession = Depends(get_db),                        │
│      current_user: User = Depends(get_current_active_user)      │
│  )                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ ItemCreate schema
                             │ validated by Pydantic
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE SESSION (core/database.py)                │
│  - get_db() dependency                                          │
│  - Creates async session                                        │
│  - Provides session to endpoint                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ db session
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         BUSINESS LOGIC (services/item_service.py)               │
│  [In this simple example, logic is in endpoint]                 │
│  - Validate business rules                                      │
│  - Transform data if needed                                     │
│  - Orchestrate repository calls                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│       DATA ACCESS (repositories/item_repository.py)             │
│  - item_repository.create(db, item_data)                        │
│  - Creates SQLAlchemy model instance                            │
│  - Adds to session                                              │
│  - Flushes and refreshes                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               DATABASE (SQLite/PostgreSQL)                      │
│  - Execute INSERT statement                                     │
│  - Return created record                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQLAlchemy model
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           RESPONSE SERIALIZATION (schemas/item.py)              │
│  - SQLAlchemy model → Pydantic Item schema                      │
│  - Auto-convert using model_config from_attributes=True         │
│  - Validate output                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ Item Pydantic model
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FASTAPI RESPONSE                               │
│  - Serialize Pydantic model to JSON                             │
│  - Add HTTP status code (201 Created)                           │
│  - Add headers                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP Response
                             │ Status: 201
                             │ Body: {"id": 1, "title": "My Item", ...}
                             ▼
                         ┌────────┐
                         │ CLIENT │
                         └────────┘
```

## Detailed Step-by-Step

### 1. Client Sends Request
```http
POST /api/v1/items/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{"title": "My Item", "description": "Test item"}
```

### 2. FastAPI Receives Request
- **File**: `app/main.py`
- **Process**:
  - CORS middleware processes request
  - FastAPI validates request format
  - Routes request to appropriate handler

### 3. Router Directs to Endpoint
- **File**: `app/api/v1/router.py`
- **Process**:
  - Matches `/api/v1/items/` → items router
  - POST method → `create_item` endpoint

### 4. Dependency Injection Executes
- **Files**:
  - `app/core/database.py` - `get_db()`
  - `app/api/dependencies.py` - `get_current_user()`

#### 4a. Database Session Dependency
```python
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session  # Provides session to endpoint
        await session.commit()
```

#### 4b. Authentication Dependency
```python
async def get_current_user(token: str, db: AsyncSession):
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    user = await user_service.get_user(db, user_id)
    return user  # Provides authenticated user to endpoint
```

### 5. Request Body Validation
- **File**: `app/schemas/item.py`
- **Process**:
```python
class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True
```
- Pydantic validates JSON body
- Converts to `ItemCreate` instance
- Raises 422 if validation fails

### 6. Endpoint Handler Executes
- **File**: `app/api/v1/endpoints/items.py`
```python
@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_in: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Create item model with owner_id
    db_item = ItemModel(
        **item_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(db_item)
    await db.flush()
    await db.refresh(db_item)
    return db_item  # FastAPI converts to Item schema
```

### 7. Database Operation
- **File**: `app/models/item.py`
- **Process**:
  - SQLAlchemy creates SQL INSERT
  - Executes async database operation
  - Returns created record with ID

### 8. Response Serialization
- **File**: `app/schemas/item.py`
- **Process**:
```python
class Item(BaseModel):
    id: int
    title: str
    description: Optional[str]
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```
- SQLAlchemy model → Pydantic schema
- Validates output matches schema
- Serializes to JSON

### 9. HTTP Response
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 1,
  "title": "My Item",
  "description": "Test item",
  "is_active": true,
  "owner_id": 1,
  "created_at": "2025-11-06T17:00:00.000Z",
  "updated_at": null
}
```

## Error Handling Flow

### Authentication Error
```
Client → FastAPI → get_current_user → Invalid token
                                     ↓
                        HTTPException(401, "Could not validate credentials")
                                     ↓
                               Client receives 401
```

### Validation Error
```
Client → FastAPI → Pydantic validation → Invalid data
                                        ↓
                      RequestValidationError
                                        ↓
                    422 Unprocessable Entity with error details
```

### Database Error
```
Endpoint → Repository → Database → Error
                                   ↓
                         Exception raised
                                   ↓
                         Session rollback (in get_db)
                                   ↓
                         HTTPException(500) or specific error
                                   ↓
                         Client receives error response
```

## Dependency Graph

```
create_item endpoint
    │
    ├── Depends(get_db)
    │       └── Provides: AsyncSession
    │
    └── Depends(get_current_active_user)
            │
            └── Depends(get_current_user)
                    │
                    ├── Depends(oauth2_scheme)
                    │       └── Provides: JWT token string
                    │
                    └── Depends(get_db)
                            └── Provides: AsyncSession
```

## Async Flow

All operations are async for maximum performance:

```python
# 1. Async endpoint
async def create_item(...):

    # 2. Async database session context
    async with AsyncSessionLocal() as session:

        # 3. Async authentication
        user = await user_service.get_user(db, user_id)

        # 4. Async database operations
        db.add(db_item)
        await db.flush()
        await db.refresh(db_item)

        # 5. Async commit
        await session.commit()
```

## Layer Responsibilities

### API Layer (`app/api/`)
- HTTP concerns
- Route definitions
- Request/response handling
- Dependency injection setup
- Status codes

### Service Layer (`app/services/`)
- Business logic
- Data validation
- Orchestration
- Error handling
- Business rules

### Repository Layer (`app/repositories/`)
- Data access
- CRUD operations
- Custom queries
- Database abstraction

### Model Layer (`app/models/`)
- Database schema
- Relationships
- Constraints
- ORM mappings

### Schema Layer (`app/schemas/`)
- Input validation
- Output serialization
- Type definitions
- API contracts

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Testability**: Each layer can be tested independently
3. **Maintainability**: Changes in one layer don't affect others
4. **Reusability**: Services and repositories can be used by multiple endpoints
5. **Type Safety**: Type hints throughout ensure correctness
6. **Async Performance**: Non-blocking I/O for high throughput
7. **Dependency Injection**: Clean, testable code with automatic dependency resolution
