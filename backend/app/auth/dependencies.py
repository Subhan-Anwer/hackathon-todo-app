"""FastAPI dependencies for authentication and authorization."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .jwt_handler import verify_jwt_token
from .models import User

# HTTP Bearer security scheme for OpenAPI documentation
security = HTTPBearer()


class AuthenticationError(HTTPException):
    """
    Standardized authentication error (401 Unauthorized).

    Used when authentication fails due to:
    - Missing Authorization header
    - Invalid JWT token
    - Expired JWT token
    - Missing required token claims

    Always includes WWW-Authenticate header per RFC 7235.
    """
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """
    Standardized authorization error (403 Forbidden).

    Used when authentication succeeds but authorization fails:
    - Valid JWT token but insufficient permissions
    - Attempting to access resource owned by different user
    - Role-based access control rejection

    Does NOT include WWW-Authenticate header (authentication was successful).
    """
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    FastAPI dependency that verifies JWT and returns authenticated user.

    This is the primary authentication dependency used throughout the application.
    It should be added to all protected endpoints to enforce authentication.

    Workflow:
        1. Extract JWT token from Authorization header (Bearer scheme)
        2. Verify token signature and expiration using verify_jwt_token()
        3. Extract user_id from token claims (tries 'sub', 'user_id', 'id' fields)
        4. Extract optional email from token claims
        5. Return User object with user_id and email

    Args:
        credentials: HTTP Bearer token automatically extracted by FastAPI
                    from Authorization: Bearer <token> header

    Returns:
        User: Authenticated user object with user_id and email

    Raises:
        HTTPException: 401 Unauthorized if:
            - Authorization header is missing
            - Token is invalid or expired
            - Token signature verification fails
            - user_id claim is missing from token
            - user_id is not a valid integer

    Usage in endpoints:
        @router.get("/tasks")
        async def get_tasks(current_user: User = Depends(get_current_user)):
            user_id = current_user.user_id
            # Filter tasks by user_id from JWT (NEVER from request body)
            tasks = session.exec(
                select(Task).where(Task.user_id == user_id)
            ).all()
            return tasks

    Security guarantees:
        - User identity is cryptographically verified via JWT signature
        - user_id is sourced exclusively from verified JWT claims
        - Cannot be spoofed by modifying request body or query parameters
        - Enforces multi-user data isolation at the API layer

    OpenAPI documentation:
        - This dependency automatically adds "Bearer Token" security to endpoint docs
        - Frontend developers can test protected endpoints in Swagger UI
        - Shows "Authorize" button in OpenAPI documentation
    """
    # Extract token from credentials
    token = credentials.credentials

    # Verify token and get payload
    payload = verify_jwt_token(token)

    # Extract user_id from JWT claims
    # Try multiple field names for compatibility with different JWT issuers:
    # - 'sub': Standard JWT subject claim (recommended)
    # - 'user_id': Custom claim used by some auth providers
    # - 'id': Alternative custom claim
    user_id = payload.get("sub") or payload.get("user_id") or payload.get("id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user identifier not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Convert user_id to string (Better Auth uses TEXT/UUID type)
    # Ensure user_id is always a string for consistency with database schema
    user_id = str(user_id)

    # Extract optional email from token claims
    email = payload.get("email")

    # Return User object with verified identity
    return User(user_id=user_id, email=email)
