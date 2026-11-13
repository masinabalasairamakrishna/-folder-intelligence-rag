import os
import shutil
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.processing_job import ProcessingJob
from app.schemas.document import DocumentResponse, DocumentDetailResponse, DocumentChunkResponse, ReindexResponse
from app.api.deps import get_current_user
from app.rag.document_loader import load_document, calculate_file_hash, DocumentExtractionError
from app.rag.text_splitter import split_extracted_chunks
from app.rag.vector_store import vector_store

router = APIRouter()

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".txt", ".md", ".csv", ".xlsx", ".xls", ".json"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB limit per file

def sanitize_path(path_str: str) -> str:
    """Sanitize relative path to strictly avoid path traversal."""
    normalized = os.path.normpath(path_str).replace("\\", "/")
    parts = [p for p in normalized.split("/") if p and p != "." and p != ".."]
    return "/".join(parts) if parts else "unnamed_file"

def process_and_index_document(doc: Document, user_id: int, db: Session):
    """Core document ingestion and ChromaDB indexing worker."""
    job = ProcessingJob(document_id=doc.id, status="PROCESSING", progress=10.0)
    db.add(job)
    db.commit()

    try:
        # Step 1: Extraction
        extracted_parts = load_document(doc.storage_path)
        job.progress = 40.0
        db.commit()

        # Step 2: Chunking
        base_meta = {
            "user_id": str(user_id),
            "folder_id": str(doc.folder_id),
            "document_id": str(doc.id),
            "filename": doc.filename,
            "relative_path": doc.relative_path,
            "file_hash": doc.file_hash
        }
        chunks = split_extracted_chunks(
            extracted_parts,
            chunk_size=settings.DEFAULT_CHUNK_SIZE,
            chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP,
            base_metadata=base_meta
        )
        job.progress = 70.0
        db.commit()

        # Step 3: Remove existing vectors if reindexing
        vector_store.delete_document_vectors(user_id=user_id, document_id=doc.id)
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

        # Step 4: Add to ChromaDB and MySQL
        chunk_ids = []
        chunk_texts = []
        chunk_metas = []
        db_chunks = []

        for c in chunks:
            vector_id = f"usr_{user_id}_doc_{doc.id}_chk_{c.chunk_index}"
            chunk_ids.append(vector_id)
            chunk_texts.append(c.text)
            chunk_metas.append(c.metadata)

            db_chunks.append(DocumentChunk(
                document_id=doc.id,
                vector_id=vector_id,
                chunk_index=c.chunk_index,
                page_number=c.page_number,
                chunk_text=c.text[:500]  # Store preview excerpt
            ))

        vector_store.add_chunks(chunk_ids, chunk_texts, chunk_metas)
        db.bulk_save_objects(db_chunks)

        doc.indexing_status = "INDEXED"
        doc.error_message = None
        job.status = "COMPLETED"
        job.progress = 100.0
        db.commit()
    except Exception as e:
        db.rollback()
        doc.indexing_status = "FAILED"
        doc.error_message = str(e)
        job.status = "FAILED"
        job.error_message = str(e)
        db.commit()
        raise

@router.post("/folders/{folder_id}/upload", response_model=List[DocumentResponse])
async def upload_documents(
    folder_id: int,
    files: List[UploadFile] = File(...),
    relative_paths: Optional[List[str]] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload one or multiple files/folders into a folder, preserving relative paths,
    extracting text, and indexing embeddings into ChromaDB.
    """
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    folder_storage_dir = settings.UPLOAD_DIR / str(current_user.id) / str(folder.id)
    os.makedirs(folder_storage_dir, exist_ok=True)

    uploaded_docs = []

    for idx, upload_file in enumerate(files):
        filename = os.path.basename(upload_file.filename)
        ext = Path(filename).suffix.lower()

        if ext not in SUPPORTED_EXTENSIONS:
            # Skip unsupported file extensions gracefully
            continue

        rel_path = relative_paths[idx] if (relative_paths and idx < len(relative_paths)) else filename
        clean_rel_path = sanitize_path(rel_path)

        dest_file_path = folder_storage_dir / clean_rel_path
        os.makedirs(dest_file_path.parent, exist_ok=True)

        with open(dest_file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        file_size = os.path.getsize(dest_file_path)
        if file_size > MAX_FILE_SIZE:
            os.remove(dest_file_path)
            continue

        file_hash = calculate_file_hash(str(dest_file_path))

        # Check for existing document with same path in folder
        existing_doc = db.query(Document).filter(
            Document.folder_id == folder.id,
            Document.relative_path == clean_rel_path
        ).first()

        if existing_doc:
            doc = existing_doc
            doc.file_size = file_size
            doc.file_hash = file_hash
            doc.storage_path = str(dest_file_path)
            doc.indexing_status = "INDEXING"
        else:
            doc = Document(
                folder_id=folder.id,
                filename=filename,
                relative_path=clean_rel_path,
                file_type=ext.replace(".", ""),
                file_size=file_size,
                file_hash=file_hash,
                storage_path=str(dest_file_path),
                indexing_status="INDEXING"
            )
            db.add(doc)

        db.commit()
        db.refresh(doc)

        # Process & index
        try:
            process_and_index_document(doc, current_user.id, db)
        except Exception as e:
            print(f"Error processing document {doc.filename}: {e}")

        db.refresh(doc)
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()

        uploaded_docs.append(DocumentResponse(
            id=doc.id,
            folder_id=doc.folder_id,
            filename=doc.filename,
            relative_path=doc.relative_path,
            file_type=doc.file_type,
            file_size=doc.file_size,
            file_hash=doc.file_hash,
            indexing_status=doc.indexing_status,
            error_message=doc.error_message,
            created_at=doc.created_at,
            chunk_count=chunk_count
        ))

    return uploaded_docs

@router.get("/folders/{folder_id}/documents", response_model=List[DocumentResponse])
def get_folder_documents(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all documents in a specific folder."""
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    docs = db.query(Document).filter(Document.folder_id == folder.id).all()
    results = []
    for d in docs:
        c_count = len(d.chunks)
        results.append(DocumentResponse(
            id=d.id,
            folder_id=d.folder_id,
            filename=d.filename,
            relative_path=d.relative_path,
            file_type=d.file_type,
            file_size=d.file_size,
            file_hash=d.file_hash,
            indexing_status=d.indexing_status,
            error_message=d.error_message,
            created_at=d.created_at,
            chunk_count=c_count
        ))
    return results

@router.get("/documents/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document details including extracted chunks."""
    doc = db.query(Document).join(Folder).filter(
        Document.id == document_id,
        Folder.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index).all()
    chunk_responses = [
        DocumentChunkResponse(
            id=c.id,
            document_id=c.document_id,
            vector_id=c.vector_id,
            chunk_index=c.chunk_index,
            page_number=c.page_number,
            chunk_text=c.chunk_text,
            created_at=c.created_at
        )
        for c in chunks
    ]

    return DocumentDetailResponse(
        id=doc.id,
        folder_id=doc.folder_id,
        filename=doc.filename,
        relative_path=doc.relative_path,
        file_type=doc.file_type,
        file_size=doc.file_size,
        file_hash=doc.file_hash,
        indexing_status=doc.indexing_status,
        error_message=doc.error_message,
        created_at=doc.created_at,
        chunk_count=len(chunks),
        chunks=chunk_responses
    )

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete document, physical file, and ChromaDB embeddings."""
    doc = db.query(Document).join(Folder).filter(
        Document.id == document_id,
        Folder.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete from ChromaDB
    vector_store.delete_document_vectors(user_id=current_user.id, document_id=doc.id)

    # Delete file from disk
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return None

@router.post("/documents/{document_id}/reindex", response_model=ReindexResponse)
def reindex_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Re-extract and re-index a document into ChromaDB."""
    doc = db.query(Document).join(Folder).filter(
        Document.id == document_id,
        Folder.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    process_and_index_document(doc, current_user.id, db)
    db.refresh(doc)
    count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()

    return ReindexResponse(
        message=f"Document '{doc.filename}' re-indexed successfully.",
        document_id=doc.id,
        chunks_indexed=count
    )
