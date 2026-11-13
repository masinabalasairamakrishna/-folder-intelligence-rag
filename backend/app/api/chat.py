from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.folder import Folder
from app.models.conversation import Conversation, Message
from app.schemas.chat import (
    ChatRequest, ChatResponse, ConversationResponse, MessageResponse, ConversationSummary
)
from app.api.deps import get_current_user
from app.rag.rag_pipeline import generate_rag_answer

router = APIRouter()

@router.post("/ask", response_model=ChatResponse)
def ask_question(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ask a question grounded in the documents of one or more folders.
    """
    # Validate folder ownership if folder_id is provided
    if req.folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == req.folder_id, Folder.user_id == current_user.id).first()
        if not folder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    # If folder_ids provided for multi-folder query
    if req.folder_ids:
        owned_count = db.query(Folder).filter(
            Folder.id.in_(req.folder_ids),
            Folder.user_id == current_user.id
        ).count()
        if owned_count != len(req.folder_ids):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to one or more folders")

    # Create or retrieve conversation
    conversation = None
    if req.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == req.conversation_id,
            Conversation.user_id == current_user.id
        ).first()

    if not conversation:
        title = req.question[:40] + ("..." if len(req.question) > 40 else "")
        conversation = Conversation(
            user_id=current_user.id,
            folder_id=req.folder_id,
            title=title
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Record User Message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=req.question.strip()
    )
    db.add(user_msg)
    db.commit()

    # Run RAG generation
    rag_response = generate_rag_answer(
        question=req.question.strip(),
        user_id=current_user.id,
        folder_id=req.folder_id,
        folder_ids=req.folder_ids,
        top_k=req.top_k or 8,
        language=req.language or "en",
        api_key=req.api_key,
        model_name=req.model
    )

    # Record Assistant Message with sources
    sources_data = [s.model_dump() for s in rag_response.sources]
    asst_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=rag_response.answer,
        sources_json=sources_data
    )
    db.add(asst_msg)
    db.commit()

    rag_response.conversation_id = conversation.id
    return rag_response

@router.get("/conversations", response_model=List[ConversationSummary])
def list_conversations(
    folder_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List recent chat conversations for user."""
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if folder_id is not None:
        query = query.filter(Conversation.folder_id == folder_id)
    convs = query.order_by(Conversation.created_at.desc()).all()

    results = []
    for c in convs:
        results.append(ConversationSummary(
            id=c.id,
            title=c.title,
            folder_id=c.folder_id,
            created_at=c.created_at,
            message_count=len(c.messages)
        ))
    return results

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a specific conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            sources_json=m.sources_json,
            created_at=m.created_at
        )
        for m in conversation.messages
    ]

    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        folder_id=conversation.folder_id,
        title=conversation.title,
        created_at=conversation.created_at,
        messages=messages
    )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation session and all its messages."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return None
