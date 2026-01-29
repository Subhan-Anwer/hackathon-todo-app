# Backend API - Hackathon Todo App

FastAPI-based REST API for multi-user todo management with JWT authentication.

## Tech Stack

- **Framework**: FastAPI 0.115+
- **ORM**: SQLModel 0.0.16+
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT with python-jose
- **Migrations**: Alembic

## Setup Instructions

### 1. Install Dependencies

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Security Note**: Generate a cryptographically secure JWT_SECRET:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Run Database Migrations

```bash
# Apply migrations to create tables
alembic upgrade head
```

### 4. Start Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check

- `GET /` - Root endpoint
- `GET /health` - Health check

### Tasks API (v1)

All task endpoints require JWT authentication via `Authorization: Bearer <token>` header.

#### Get All Tasks
```
GET /api/v1/tasks
```
Returns all tasks for the authenticated user, ordered by created_at descending.

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Buy groceries",
    "description": "Milk, bread, eggs",
    "completed": false,
    "created_at": "2026-01-29T10:00:00Z",
    "updated_at": "2026-01-29T10:00:00Z"
  }
]
```

#### Create Task
```
POST /api/v1/tasks
```

**Request Body**:
```json
{
  "title": "Buy groceries",
  "description": "Optional description"
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Buy groceries",
  "description": "Optional description",
  "completed": false,
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z"
}
```

#### Update Task
```
PUT /api/v1/tasks/{id}
```

**Request Body**:
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Response**: `200 OK` (same as create response)

#### Toggle Task Completion
```
PATCH /api/v1/tasks/{id}/complete
```

Toggles the completion status of the task.

**Response**: `200 OK` (returns updated task)

#### Delete Task
```
DELETE /api/v1/tasks/{id}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Task deleted successfully"
  }
}
```

### Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message"
}
```

Common status codes:
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Task not found or doesn't belong to user
- `500 Internal Server Error` - Server error

## API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Security Features

### User Data Isolation

All task queries are filtered by `user_id` extracted from the JWT token:

```python
# Example: Only return tasks belonging to authenticated user
tasks = session.exec(
    select(Task)
    .where(Task.user_id == current_user.id)
).all()
```

### Authorization

- **404 Instead of 403**: Returns 404 for unauthorized access to prevent user enumeration
- **JWT Verification**: All protected endpoints verify JWT signature and expiration
- **No Trust of Client Data**: User ID is always extracted from JWT, never from request body

## Database Schema

### Tasks Table

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
```

## Development

### Code Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── tasks.py      # Task API endpoints
│   ├── auth/
│   │   └── jwt.py            # JWT authentication
│   ├── models/
│   │   └── task.py           # SQLModel Task model
│   ├── schemas/
│   │   ├── task.py           # Pydantic request/response schemas
│   │   └── error.py          # Error response schemas
│   └── database.py           # Database connection
├── alembic/
│   └── versions/             # Migration scripts
├── main.py                   # FastAPI app entry point
├── requirements.txt          # Python dependencies
└── .env                      # Environment variables (gitignored)
```

### Running Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

### Testing

```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=app
```

## Production Deployment

### Environment Configuration

1. Set `DATABASE_URL` to your Neon production database
2. Generate a secure `JWT_SECRET` (32+ bytes)
3. Set `CORS_ORIGINS` to your production frontend URL
4. Disable SQL echo in `app/database.py` (set `echo=False`)

### Running in Production

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with Gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` format: `postgresql://user:password@host:5432/database`
- Check Neon database is accessible
- Ensure firewall allows connections

### JWT Authentication Errors

- Verify `JWT_SECRET` is set and matches across environments
- Check token expiration (`JWT_EXPIRY_HOURS`)
- Ensure Authorization header format: `Bearer <token>`

### CORS Errors

- Add frontend URL to `CORS_ORIGINS` in `.env`
- Restart server after environment changes

## License

See root project LICENSE file.
