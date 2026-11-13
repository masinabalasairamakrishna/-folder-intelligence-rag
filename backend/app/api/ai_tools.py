from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document
from app.schemas.ai_tools import (
    SummarizeDocumentRequest, SummarizeFolderRequest, SummaryResponse,
    CompareDocumentsRequest, ComparisonResponse, MCQGenerateRequest, MCQResponse
)
from app.api.deps import get_current_user
from app.rag.retriever import retrieve_context
from app.rag.summarizer import summarize_content, compare_documents_content, generate_mcqs_from_content

router = APIRouter()

@router.post("/summarize-document", response_model=SummaryResponse)
def summarize_document(
    req: SummarizeDocumentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate executive summary, key points, topics, and terms for a single document."""
    doc = db.query(Document).join(Folder).filter(
        Document.id == req.document_id,
        Folder.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    context, citations = retrieve_context(
        query=req.focus_topic or "Executive overview, core ideas, and conclusions",
        user_id=current_user.id,
        document_ids=[doc.id],
        top_k=8
    )

    return summarize_content(
        title=doc.filename,
        context=context,
        citations=citations,
        focus_topic=req.focus_topic,
        language=req.language or "en"
    )

@router.post("/summarize-folder", response_model=SummaryResponse)
def summarize_folder(
    req: SummarizeFolderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate comprehensive summary across all documents in a folder."""
    folder = db.query(Folder).filter(
        Folder.id == req.folder_id,
        Folder.user_id == current_user.id
    ).first()

    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    context, citations = retrieve_context(
        query=req.focus_topic or "Comprehensive folder overview, topics, themes, and summaries",
        user_id=current_user.id,
        folder_id=folder.id,
        top_k=10
    )

    return summarize_content(
        title=f"Folder: {folder.name}",
        context=context,
        citations=citations,
        focus_topic=req.focus_topic,
        language=req.language or "en"
    )

@router.post("/compare-documents", response_model=ComparisonResponse)
def compare_documents(
    req: CompareDocumentsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compare 2 to 5 documents side-by-side."""
    docs = db.query(Document).join(Folder).filter(
        Document.id.in_(req.document_ids),
        Folder.user_id == current_user.id
    ).all()

    if len(docs) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least 2 valid documents must be selected.")

    doc_infos = [{"id": d.id, "filename": d.filename, "file_type": d.file_type} for d in docs]

    context, citations = retrieve_context(
        query=req.query or "Comparison of methods, key findings, and main differences",
        user_id=current_user.id,
        document_ids=[d.id for d in docs],
        top_k=12
    )

    return compare_documents_content(
        query=req.query or "General Document Comparison",
        doc_infos=doc_infos,
        context=context,
        citations=citations,
        language=req.language or "en"
    )

@router.post("/generate-mcqs", response_model=MCQResponse)
def generate_mcqs(
    req: MCQGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate revision MCQs grounded in document chunks."""
    doc_ids = [req.document_id] if req.document_id else None
    context, citations = retrieve_context(
        query="Key concepts, terminology, algorithms, definitions, and facts for quiz preparation",
        user_id=current_user.id,
        folder_id=req.folder_id,
        document_ids=doc_ids,
        top_k=10
    )

    return generate_mcqs_from_content(
        context=context,
        citations=citations,
        folder_id=req.folder_id,
        document_id=req.document_id,
        num_questions=req.num_questions or 5
    )
