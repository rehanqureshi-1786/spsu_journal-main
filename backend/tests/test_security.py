"""
Unit tests for security utilities.
"""
import pytest
from datetime import timedelta
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, verify_token


class TestPasswordHashing:
    def test_hash_password_returns_bcrypt_hash(self):
        password = "my_secure_password"
        hashed = hash_password(password)
        assert hashed.startswith("$") or hashed.startswith("$")
        assert len(hashed) == 60
    
    def test_verify_password_correct(self):
        password = "correct_password"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True


class TestTokenGeneration:
    def test_create_access_token_returns_string(self):
        data = {"sub": "user@example.com", "role": "author"}
        token = create_access_token(data)
        assert isinstance(token, str)
        assert len(token) > 0


class TestTokenVerification:
    def test_verify_token_valid(self):
        data = {"sub": "user@example.com", "role": "author"}
        token = create_access_token(data)
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "user@example.com"
