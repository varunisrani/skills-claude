"""Token schemas for authentication."""
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """Schema for access token response."""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Schema for token payload data."""
    sub: Optional[int] = None
