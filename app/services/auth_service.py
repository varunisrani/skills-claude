"""Authentication service for login and token management."""
from datetime import timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.core.config import get_settings
from app.services.user_service import user_service
from app.schemas.token import Token
from app.schemas.user import User


settings = get_settings()


class AuthService:
    """Business logic for authentication."""

    async def login(
        self,
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[Token]:
        """
        Authenticate user and create access token.

        Args:
            db: Database session
            email: User email
            password: User password

        Returns:
            Token with access_token and token_type, or None if authentication fails
        """
        user = await user_service.authenticate(db, email, password)
        if not user:
            return None

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )

        return Token(access_token=access_token, token_type="bearer")

    async def get_current_user_from_token(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Optional[User]:
        """
        Get current user from token payload.

        Args:
            db: Database session
            user_id: User ID from token

        Returns:
            User or None
        """
        return await user_service.get_user(db, user_id)


# Create singleton instance
auth_service = AuthService()
