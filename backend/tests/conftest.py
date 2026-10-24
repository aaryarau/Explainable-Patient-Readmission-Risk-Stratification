"""
Pytest configuration and shared fixtures for ReAdmissionIQ tests.
"""
import pytest
import sys
import os

# Ensure the backend package root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "db: marks tests that require a live MongoDB instance")
    config.addinivalue_line("markers", "slow: marks tests that take more than 5 seconds")


# anyio backend for async tests
pytest_plugins = ("anyio",)
