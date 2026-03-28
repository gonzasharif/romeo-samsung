from datetime import UTC, datetime
from uuid import uuid4

def now_utc() -> datetime:
    return datetime.now(UTC)

def new_uuid() -> str:
    return str(uuid4())
