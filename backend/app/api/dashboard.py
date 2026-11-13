from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.conversation import Conversation, Message
from app.schemas.ai_tools import DashboardStatsResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate dashboard metrics and statistics for user."""
    # Folders count
    total_folders = db.query(func.count(Folder.id)).filter(Folder.user_id == current_user.id).scalar() or 0

    # Documents count & storage
    user_folders = db.query(Folder.id).filter(Folder.user_id == current_user.id).all()
    user_folder_ids = [f[0] for f in user_folders]

    total_docs = 0
    total_size = 0
    file_type_dist = {}
    status_dist = {}

    if user_folder_ids:
        total_docs = db.query(func.count(Document.id)).filter(Document.folder_id.in_(user_folder_ids)).scalar() or 0
        total_size = db.query(func.sum(Document.file_size)).filter(Document.folder_id.in_(user_folder_ids)).scalar() or 0

        # File type distribution
        types = db.query(Document.file_type, func.count(Document.id)).filter(
            Document.folder_id.in_(user_folder_ids)
        ).group_by(Document.file_type).all()
        file_type_dist = {t[0]: t[1] for t in types}

        # Status distribution
        statuses = db.query(Document.indexing_status, func.count(Document.id)).filter(
            Document.folder_id.in_(user_folder_ids)
        ).group_by(Document.indexing_status).all()
        status_dist = {s[0]: s[1] for s in statuses}

    # Total chunks
    total_chunks = 0
    if user_folder_ids:
        total_chunks = db.query(func.count(DocumentChunk.id)).join(Document).filter(
            Document.folder_id.in_(user_folder_ids)
        ).scalar() or 0

    # Total questions asked (user messages)
    total_questions = db.query(func.count(Message.id)).join(Conversation).filter(
        Conversation.user_id == current_user.id,
        Message.role == "user"
    ).scalar() or 0

    # Recent folders
    recent_folders_q = db.query(Folder).filter(Folder.user_id == current_user.id).order_by(Folder.updated_at.desc()).limit(5).all()
    recent_folders = [
        {"id": f.id, "name": f.name, "created_at": f.created_at.isoformat(), "document_count": len(f.documents)}
        for f in recent_folders_q
    ]

    # Recent conversations
    recent_convs_q = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.created_at.desc()).limit(5).all()
    recent_conversations = [
        {"id": c.id, "title": c.title, "folder_id": c.folder_id, "created_at": c.created_at.isoformat()}
        for c in recent_convs_q
    ]

    return DashboardStatsResponse(
        total_folders=total_folders,
        total_documents=total_docs,
        total_chunks=total_chunks,
        total_questions=total_questions,
        storage_bytes=total_size,
        file_type_distribution=file_type_dist,
        indexing_status_distribution=status_dist,
        recent_folders=recent_folders,
        recent_conversations=recent_conversations
    )
