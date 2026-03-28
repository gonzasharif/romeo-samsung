from fastapi import Header, HTTPException, status
from models.db import USERS, PROJECTS
from models.domain import User, Project

def get_user_or_404(user_id: str) -> User:
    user = USERS.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

def get_project_or_404(project_id: str) -> Project:
    project = PROJECTS.get(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

def get_authenticated_user(x_user_id: str = Header(..., alias="X-User-Id")) -> User:
    return get_user_or_404(x_user_id)

def assert_project_owner(project: Project, user: User) -> None:
    if project.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
