"""User service with business logic."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate, UserUpdate, User
from app.core.security import get_password_hash, verify_password
from app.models.user import User as UserModel


class UserService:
    """Business logic for users."""

    def __init__(self):
        """Initialize user service."""
        self.repository = user_repository

    async def create_user(
        self,
        db: AsyncSession,
        user_in: UserCreate
    ) -> UserModel:
        """
        Create new user with hashed password.

        Args:
            db: Database session
            user_in: User creation schema

        Returns:
            UserModel: Created user

        Raises:
            ValueError: If email or username already exists
        """
        # Check if email exists
        existing_email = await self.repository.get_by_email(db, user_in.email)
        if existing_email:
            raise ValueError("Email already registered")

        # Check if username exists
        existing_username = await self.repository.get_by_username(db, user_in.username)
        if existing_username:
            raise ValueError("Username already taken")

        # Hash password
        user_data = user_in.model_dump()
        hashed_password = get_password_hash(user_data.pop("password"))

        # Create user with hashed password
        user_create = UserCreate(
            email=user_data["email"],
            username=user_data["username"],
            full_name=user_data.get("full_name"),
            password="dummy"  # Won't be used
        )

        # Manually create the user model
        user = UserModel(
            email=user_data["email"],
            username=user_data["username"],
            full_name=user_data.get("full_name"),
            hashed_password=hashed_password,
            is_active=user_data.get("is_active", True)
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

        return user

    async def authenticate(
        self,
        db: AsyncSession,
        email: str,
        password: str
    ) -> Optional[UserModel]:
        """
        Authenticate user.

        Args:
            db: Database session
            email: User email
            password: User password

        Returns:
            Optional[UserModel]: User if authenticated, None otherwise
        """
        user = await self.repository.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    async def update_user(
        self,
        db: AsyncSession,
        user_id: int,
        user_in: UserUpdate
    ) -> Optional[UserModel]:
        """
        Update user.

        Args:
            db: Database session
            user_id: User ID
            user_in: User update schema

        Returns:
            Optional[UserModel]: Updated user if found

        Raises:
            ValueError: If email or username already exists
        """
        user = await self.repository.get(db, user_id)
        if not user:
            return None

        # Check email uniqueness if email is being updated
        if user_in.email and user_in.email != user.email:
            existing = await self.repository.get_by_email(db, user_in.email)
            if existing:
                raise ValueError("Email already registered")

        # Check username uniqueness if username is being updated
        if user_in.username and user_in.username != user.username:
            existing = await self.repository.get_by_username(db, user_in.username)
            if existing:
                raise ValueError("Username already taken")

        # Hash password if provided
        if user_in.password:
            user_data = user_in.model_dump(exclude_unset=True)
            user_data["hashed_password"] = get_password_hash(user_data.pop("password"))
            # Update manually
            for field, value in user_data.items():
                setattr(user, field, value)
        else:
            # Update without password
            update_data = user_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(user, field, value)

        await db.flush()
        await db.refresh(user)
        return user


# Create singleton instance
user_service = UserService()
