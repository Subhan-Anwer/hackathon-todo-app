"""JWT token verification and validation logic."""
import os
from datetime import datetime
from fastapi import HTTPException, status
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is not set")


def verify_jwt_token(token: str) -> dict:
    """
    Verify JWT token and return decoded payload.

    This function:
    1. Decodes the JWT token using the shared JWT_SECRET
    2. Verifies the token signature (HS256 algorithm)
    3. Checks token expiration (exp claim)
    4. Returns the decoded payload with user identity claims

    Args:
        token: JWT token string from Authorization header

    Returns:
        dict: Decoded token payload containing:
            - user_id (or sub): User identifier from Better Auth
            - email: User email address
            - exp: Token expiration timestamp
            - iat: Token issued-at timestamp

    Raises:
        HTTPException: 401 Unauthorized if token is invalid, expired, or malformed

    Security Notes:
        - Token signature is cryptographically verified
        - Expired tokens are rejected automatically by PyJWT
        - Malformed tokens raise JWTError
        - Generic error messages prevent information leakage

    Example:
        >>> payload = verify_jwt_token("eyJhbGci...")
        >>> user_id = payload.get("user_id") or payload.get("sub")
        >>> email = payload.get("email")
    """
    try:
        # Decode and verify token in one step
        # PyJWT automatically checks expiration and signature
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        # Additional expiration check (redundant but explicit)
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload

    except jwt.ExpiredSignatureError:
        # Token has expired (exp claim is in the past)
        # This provides specific feedback for token expiration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        # Invalid token signature, malformed token, or other JWT errors
        # Generic message prevents information leakage about token structure
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        # Catch-all for unexpected errors (e.g., network issues, corrupted data)
        # Generic message prevents information leakage about internal errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
