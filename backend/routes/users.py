from fastapi import APIRouter, status
from models.domain import User
from models.db import USERS
from schemas.requests import UserCreate, UserUpdate
from utils.common import now_utc, new_id
from services.auth_service import get_user_or_404

router = APIRouter()

@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate) -> User:
    timestamp = now_utc()
    user = User(
        id=new_id("user"),
        full_name=payload.full_name,
        email=payload.email,
        company=payload.company,
        billing=payload.billing,
        created_at=timestamp,
        updated_at=timestamp,
    )
    USERS[user.id] = user
    return user

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
