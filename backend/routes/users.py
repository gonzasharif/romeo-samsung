from fastapi import APIRouter, status, HTTPException
from models.domain import User
from models.db import USERS
from schemas.requests import UserCreate, UserUpdate
from utils.common import now_utc, new_id
from services.auth_service import get_user_or_404
from utils.supabase_client import supabase

router = APIRouter()

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate):
    try:
        response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name,
                    "company_name": payload.company.name
                }
            }
        })
        return response.model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: str) -> User:
    return get_user_or_404(user_id)

@router.put("/users/{user_id}", response_model=User)
@router.patch("/users/{user_id}", response_model=User)
def update_user(user_id: str, payload: UserUpdate) -> User:
    current = get_user_or_404(user_id)
    updated = current.model_copy(
        update=payload.model_dump(exclude_unset=True) | {"updated_at": now_utc()}
    )
    USERS[user_id] = updated
    return updated
