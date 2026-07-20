"""
Bootstrap production database: seed roles, then ensure admin exists.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from scripts.init_db import init_roles
from create_admin import create_admin


def main():
    db = SessionLocal()
    try:
        init_roles(db)
    finally:
        db.close()

    create_admin()


if __name__ == "__main__":
    main()
