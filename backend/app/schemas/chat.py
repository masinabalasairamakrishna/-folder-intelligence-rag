from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SourceCitation(BaseModel):
    document_id: int
    filename: str
    relative_path: str
    page_number: Optional[int] = None
    chunk_index: int
    excerpt: str
    score: Optional[float] = None

class ChatRequest(BaseModel):
    folder_id: Optional[int] = None
    folder_ids: Optional[List[int]] = None  # Support multi-folder Q&A
    conversation_id: Optional[int] = None
    question: str = Field(..., min_length=1)
    top_k: Optional[int] = 8
    language: Optional[str] = "en"  # "en" or "te" (Telugu)
    api_key: Optional[str] = None
    model: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    conversation_id: int
    folder_id: Optional[int] = None
    grounded: bool = True
    suggested_follow_ups: Optional[List[str]] = []

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    sources_json: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    folder_id: Optional[int] = None
    title: str
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    id: int
    title: str
    folder_id: Optional[int] = None
    created_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True
