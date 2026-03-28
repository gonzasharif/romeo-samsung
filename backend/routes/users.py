from fastapi import APIRouter, status, HTTPException
from models.domain import User
from schemas.requests import UserCreate, UserUpdate
from utils.common import now_utc
from services.auth_service import get_user_or_404
from utils.supabase_client import supabase
import json

router = APIRouter()

@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
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
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Error creating user in Auth")
            
        timestamp = now_utc().isoformat()
        user_data = {
            "id": response.user.id,
            "full_name": payload.full_name,
            "email": payload.email,
            "company": payload.company.model_dump_json(), # Se almacena como string JSON
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        db_response = supabase.table("users").insert(user_data).execute()
        
        out_data = db_response.data[0]
        out_data["company"] = json.loads(out_data["company"])
        return User(**out_data)
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: str) -> User:
    return get_user_or_404(user_id)

@router.put("/users/{user_id}", response_model=User)
@router.patch("/users/{user_id}", response_model=User)
def update_user(user_id: str, payload: UserUpdate) -> User:
    current = get_user_or_404(user_id)
    
    update_data = {}
    if payload.full_name is not None: update_data["full_name"] = payload.full_name
    if payload.email is not None: update_data["email"] = payload.email
    if payload.company is not None: update_data["company"] = payload.company.model_dump_json()
    
    if not update_data:
        return current
        
    update_data["updated_at"] = now_utc().isoformat()
    
    resp = supabase.table("users").update(update_data).eq("id", user_id).execute()
    if not resp.data:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
         
    out_data = resp.data[0]
    try:
        if isinstance(out_data.get("company"), str):
            out_data["company"] = json.loads(out_data["company"])
        else:
            out_data["company"] = out_data.get("company") or {}
    except:
        out_data["company"] = {"name": out_data["company"]}
        
    return User(**out_data)
