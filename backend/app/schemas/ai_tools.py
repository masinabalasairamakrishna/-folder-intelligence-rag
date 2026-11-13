from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.chat import SourceCitation

class SummarizeDocumentRequest(BaseModel):
    document_id: int
    focus_topic: Optional[str] = None
    language: Optional[str] = "en"

class SummarizeFolderRequest(BaseModel):
    folder_id: int
    focus_topic: Optional[str] = None
    language: Optional[str] = "en"

class SummaryResponse(BaseModel):
    title: str
    executive_summary: str
    key_points: List[str]
    topics: List[str]
    terminology: Dict[str, str]
    sources: List[SourceCitation]

class CompareDocumentsRequest(BaseModel):
    document_ids: List[int] = Field(..., min_length=2, max_length=5)
    query: Optional[str] = "Compare key concepts, methodologies, findings, and conclusions."
    language: Optional[str] = "en"

class ComparisonResponse(BaseModel):
    query: str
    documents_compared: List[Dict[str, Any]]
    common_aspects: List[str]
    distinct_aspects: Dict[str, List[str]]
    comparison_summary: str
    conclusion: str
    sources: List[SourceCitation]

class MCQGenerateRequest(BaseModel):
    folder_id: Optional[int] = None
    document_id: Optional[int] = None
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"  # easy, medium, hard

class MCQQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    source_document: str
    source_page: Optional[int] = None

class MCQResponse(BaseModel):
    folder_id: Optional[int] = None
    document_id: Optional[int] = None
    questions: List[MCQQuestion]

class DashboardStatsResponse(BaseModel):
    total_folders: int
    total_documents: int
    total_chunks: int
    total_questions: int
    storage_bytes: int
    file_type_distribution: Dict[str, int]
    indexing_status_distribution: Dict[str, int]
    recent_folders: List[Dict[str, Any]]
    recent_conversations: List[Dict[str, Any]]
    knowledge_graph: Optional[Dict[str, Any]] = None
    activity_timeline: Optional[List[Dict[str, Any]]] = None
