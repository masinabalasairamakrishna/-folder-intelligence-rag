from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, TokenData
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse, FolderDetailResponse
from app.schemas.document import DocumentResponse, DocumentChunkResponse, DocumentDetailResponse, ReindexResponse
from app.schemas.chat import (
    ChatRequest, ChatResponse, SourceCitation,
    ConversationResponse, MessageResponse, ConversationSummary
)
from app.schemas.ai_tools import (
    SummarizeDocumentRequest, SummarizeFolderRequest, SummaryResponse,
    CompareDocumentsRequest, ComparisonResponse, MCQGenerateRequest, MCQResponse,
    DashboardStatsResponse
)

__all__ = [
    "UserRegister", "UserLogin", "UserResponse", "Token", "TokenData",
    "FolderCreate", "FolderUpdate", "FolderResponse", "FolderDetailResponse",
    "DocumentResponse", "DocumentChunkResponse", "DocumentDetailResponse", "ReindexResponse",
    "ChatRequest", "ChatResponse", "SourceCitation",
    "ConversationResponse", "MessageResponse", "ConversationSummary",
    "SummarizeDocumentRequest", "SummarizeFolderRequest", "SummaryResponse",
    "CompareDocumentsRequest", "ComparisonResponse", "MCQGenerateRequest", "MCQResponse",
    "DashboardStatsResponse"
]
