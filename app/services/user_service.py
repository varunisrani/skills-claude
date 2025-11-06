"""User service for business logic."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate, UserUpdate, User
from app.core.security import get_password_hash, verify_password


class UserService:
    """Business logic for user operations."""

    def __init__(self):
        """Initialize service with repository."""
        self.repository = user_repository

    async def create_user(
        self,
        db: AsyncSession,
        user_in: UserCreate
    ) -> User:
        """
        Create new user with hashed password.

        Args:
            db: Database session
            user_in: User creation schema

        Returns:
            Created user

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing = await self.repository.get_by_email(db, user_in.email)
        if existing:
            raise ValueError("Email already registered")

        # Hash password
        user_data = user_in.model_dump() if hasattr(user_in, 'model_dump') else user_in.dict()
        hashed_password = get_password_hash(user_data.pop("password"))

        # Create user with hashed password
        user_create = UserCreate(
            email=user_data["email"],
            full_name=user_data.get("full_name"),
            is_active=user_data.get("is_active", True),
            password=hashed_password  # This will be treated as hashed_password in repo
        )

        # Manually create user to handle hashed_password
        from app.models.user import User as UserModel
        db_user = UserModel(
            email=user_data["email"],
            full_name=user_data.get("full_name"),
            is_active=user_data.get("is_active", True),
            hashed_password=hashed_password,
        )
        db.add(db_user)
        await db.flush()
        await db.refresh(db_user)

        return db_user

    async def authenticate(
        self,
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[User]:
        """
        Authenticate user with email and password.

        Args:
            db: Database session
            email: User email
            password: Plain password

        Returns:
            User if authenticated, None otherwise
        """
        user = await self.repository.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def update_user(
        self,
        db: AsyncSession,
        user_id: int,
        user_in: UserUpdate
    ) -> Optional[User]:
        """
        Update user information.

        Args:
            db: Database session
            user_id: User ID
            user_in: User update schema

        Returns:
            Updated user or None if not found
        """
        user = await self.repository.get(db, user_id)
        if not user:
            return None

        # If password is being updated, hash it
        if user_in.password:
            user_data = user_in.model_dump(exclude_unset=True) if hasattr(user_in, 'model_dump') else user_in.dict(exclude_unset=True)
            hashed_password = get_password_hash(user_data.pop("password"))
            user.hashed_password = hashed_password
            # Update other fields
            for field, value in user_data.items():
                setattr(user, field, value)
        else:
            return await self.repository.update(db, user, user_in)

        await db.flush()
        await db.refresh(user)
        return user

    async def get_user(self, db: AsyncSession, user_id: int) -> Optional[User]:
        """
        Get user by ID.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            User or None
        """
        return await self.repository.get(db, user_id)

    async def get_user_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Get user by email.

        Args:
            db: Database session
            email: User email

        Returns:
            User or None
        """
        return await self.repository.get_by_email(db, email)


# Create singleton instance
user_service = UserService()
