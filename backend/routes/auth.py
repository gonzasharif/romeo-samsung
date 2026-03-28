from fastapi import APIRouter, HTTPException, status
from schemas.requests import LoginRequest
from utils.supabase_client import supabase

router = APIRouter()

@router.post("/login", status_code=status.HTTP_200_OK)
def login(payload: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        return response.model_dump() # Return AuthResponse containing user and session
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
