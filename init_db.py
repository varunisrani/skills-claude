"""Script to initialize the database."""
import asyncio
from app.core.database import init_db


async def main():
    """Initialize database tables."""
    print("Creating database tables...")
    await init_db()
    print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(main())
