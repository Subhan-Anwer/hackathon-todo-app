"""Error response schemas."""
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Error detail with message and code."""

    message: str
    code: str


class ErrorResponse(BaseModel):
    """Standard error response format."""

    success: bool = False
    error: ErrorDetail
