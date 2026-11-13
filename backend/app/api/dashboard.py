from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
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
    """Aggregate live dashboard metrics and statistics strictly for the current user's uploaded files."""
    # User's actual folders
    user_folders = db.query(Folder).filter(Folder.user_id == current_user.id).order_by(Folder.created_at.desc()).all()
    user_folder_ids = [f.id for f in user_folders]
    total_folders = len(user_folders)

    total_docs = 0
    total_size = 0
    file_type_dist = {}
    status_dist = {}

    if user_folder_ids:
        total_docs = db.query(func.count(Document.id)).filter(Document.folder_id.in_(user_folder_ids)).scalar() or 0
        total_size = db.query(func.sum(Document.file_size)).filter(Document.folder_id.in_(user_folder_ids)).scalar() or 0

        # File type distribution strictly from user's uploaded files
        types = db.query(Document.file_type, func.count(Document.id)).filter(
            Document.folder_id.in_(user_folder_ids)
        ).group_by(Document.file_type).all()
        file_type_dist = {str(t[0]).upper(): t[1] for t in types if t[0]}

        # Status distribution
        statuses = db.query(Document.indexing_status, func.count(Document.id)).filter(
            Document.folder_id.in_(user_folder_ids)
        ).group_by(Document.indexing_status).all()
        status_dist = {s[0]: s[1] for s in statuses}

    # Total chunks in ChromaDB for user's documents
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
    recent_folders = [
        {"id": f.id, "name": f.name, "created_at": f.created_at.isoformat(), "document_count": len(f.documents)}
        for f in user_folders[:5]
    ]

    # Recent conversations
    recent_convs_q = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.created_at.desc()).limit(5).all()
    recent_conversations = [
        {"id": c.id, "title": c.title, "folder_id": c.folder_id, "created_at": c.created_at.isoformat()}
        for c in recent_convs_q
    ]

    # Dynamically build Knowledge Graph strictly from user's uploaded folders & documents
    kg_nodes = []
    kg_links = []
    
    center_id = f"user-{current_user.id}"
    kg_nodes.append({
        "id": center_id,
        "label": current_user.name or "My Vault",
        "type": "Entity",
        "x": 200,
        "y": 140,
        "r": 16,
        "color": "#D946EF"
    })

    for i, f in enumerate(user_folders[:6]):
        f_id = f"fld-{f.id}"
        fx = 200 + (90 if i % 2 == 0 else -90)
        fy = 75 + (i * 35)
        kg_nodes.append({
            "id": f_id,
            "label": f.name[:16],
            "type": "Folders",
            "x": fx,
            "y": fy,
            "r": 13,
            "color": "#8B5CF6"
        })
        kg_links.append({"source": center_id, "target": f_id})

        docs = db.query(Document).filter(Document.folder_id == f.id).limit(4).all()
        for j, d in enumerate(docs):
            doc_id = f"doc-{d.id}"
            dx = fx + (55 if j % 2 == 0 else -55)
            dy = fy + 50
            kg_nodes.append({
                "id": doc_id,
                "label": d.filename[:14],
                "type": "Docs",
                "x": dx,
                "y": dy,
                "r": 11,
                "color": "#06B6D4"
            })
            kg_links.append({"source": f_id, "target": doc_id})

            # Chunks / Slides
            chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == d.id).limit(4).all()
            for k, c in enumerate(chunks):
                kw_id = f"kw-{c.id}"
                kw_label = f"Slide {c.page_number}" if (c.page_number and d.file_type == 'pptx') else f"p.{c.page_number}" if c.page_number else f"Chunk {c.chunk_index + 1}"
                kg_nodes.append({
                    "id": kw_id,
                    "label": kw_label,
                    "type": "Keywords",
                    "x": dx + (35 * (k - 1)),
                    "y": dy + 38 + (10 if k % 2 == 0 else -5),
                    "r": 8,
                    "color": "#14B8A6"
                })
                kg_links.append({"source": doc_id, "target": kw_id})

    knowledge_graph = {"nodes": kg_nodes, "links": kg_links}

    # Dynamically build Activity Timeline from user's actual history
    # Default 7 or 30 day timeline based on user activity
    now = datetime.now(timezone.utc)
    days_data = []
    for day_offset in [1, 3, 7, 9, 13, 15, 18, 21, 24, 27, 30]:
        target_date = (now - timedelta(days=30 - day_offset)).date()
        # Count actual documents indexed on or before this date
        idx_count = 0
        if user_folder_ids:
            idx_count = db.query(func.count(Document.id)).filter(
                Document.folder_id.in_(user_folder_ids),
                func.date(Document.created_at) <= target_date
            ).scalar() or 0
        
        # Count queries on or before this date
        qry_count = db.query(func.count(Message.id)).join(Conversation).filter(
            Conversation.user_id == current_user.id,
            Message.role == "user",
            func.date(Message.created_at) <= target_date
        ).scalar() or 0

        days_data.append({
            "day": str(day_offset),
            "indexed": idx_count,
            "queries": qry_count
        })

    return DashboardStatsResponse(
        total_folders=total_folders,
        total_documents=total_docs,
        total_chunks=total_chunks,
        total_questions=total_questions,
        storage_bytes=total_size,
        file_type_distribution=file_type_dist,
        indexing_status_distribution=status_dist,
        recent_folders=recent_folders,
        recent_conversations=recent_conversations,
        knowledge_graph=knowledge_graph,
        activity_timeline=days_data
    )
