from fastapi import Header, HTTPException, status, Depends
from models.domain import User, CompanyProfile
from datetime import datetime

data = {
    'id': 'test',
    'full_name': 'Test User',
    'email': 'test@test.com',
    'company': {'name': 'test'},
    'created_at': '2026-03-28T07:15:37+00:00',
    'updated_at': '2026-03-28T07:15:37+00:00'
}

try:
    user = User(**data)
    print("User is OK")
except Exception as e:
    print("User failed:", e)

