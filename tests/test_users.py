"""Tests for user endpoints."""
import pytest


async def get_auth_token(client, email: str, password: str) -> str:
    """Helper to get authentication token."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_read_current_user(client):
    """Test reading current user profile."""
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "current@example.com",
            "password": "password123",
            "full_name": "Current User"
        }
    )

    # Get token
    token = await get_auth_token(client, "current@example.com", "password123")

    # Read current user
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "current@example.com"
    assert data["full_name"] == "Current User"


@pytest.mark.asyncio
async def test_update_current_user(client):
    """Test updating current user profile."""
    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "update@example.com",
            "password": "password123",
            "full_name": "Old Name"
        }
    )

    # Get token
    token = await get_auth_token(client, "update@example.com", "password123")

    # Update user
    response = await client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "New Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "New Name"


@pytest.mark.asyncio
async def test_read_user_unauthorized(client):
    """Test reading user without authentication."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
