from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: int
    folder_id: int
    filename: str
    relative_path: str
    file_type: str
    file_size: int
    file_hash: str
    indexing_status: str
    error_message: Optional[str] = None
    created_at: datetime
    chunk_count: Optional[int] = 0

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    vector_id: str
    chunk_index: int
    page_number: Optional[int] = None
    chunk_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    chunks: List[DocumentChunkResponse] = []

class ReindexResponse(BaseModel):
    message: str
    document_id: int
    chunks_indexed: int
