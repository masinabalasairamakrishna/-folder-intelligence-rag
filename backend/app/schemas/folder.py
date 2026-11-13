from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None

class FolderResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    document_count: Optional[int] = 0
    total_size_bytes: Optional[int] = 0

    class Config:
        from_attributes = True

class FolderDetailResponse(FolderResponse):
    documents: List["DocumentResponse"] = []

# Forward reference resolution
from app.schemas.document import DocumentResponse
FolderDetailResponse.model_rebuild()
