"""Token schemas for authentication."""
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """Token response schema."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema."""

    user_id: Optional[int] = None
