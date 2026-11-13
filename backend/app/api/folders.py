from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.folder import Folder
from app.models.document import Document
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse, FolderDetailResponse
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user
from app.rag.vector_store import vector_store

router = APIRouter()

@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder_in: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new folder for the current user."""
    folder = Folder(
        name=folder_in.name.strip(),
        description=folder_in.description.strip() if folder_in.description else None,
        user_id=current_user.id
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return FolderResponse(
        id=folder.id,
        user_id=folder.user_id,
        name=folder.name,
        description=folder.description,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        document_count=0,
        total_size_bytes=0
    )

@router.get("", response_model=List[FolderResponse])
def list_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all folders owned by the current user."""
    folders = db.query(Folder).filter(Folder.user_id == current_user.id).order_by(Folder.updated_at.desc()).all()
    results = []
    for f in folders:
        doc_count = db.query(func.count(Document.id)).filter(Document.folder_id == f.id).scalar() or 0
        total_size = db.query(func.sum(Document.file_size)).filter(Document.folder_id == f.id).scalar() or 0
        results.append(FolderResponse(
            id=f.id,
            user_id=f.user_id,
            name=f.name,
            description=f.description,
            created_at=f.created_at,
            updated_at=f.updated_at,
            document_count=doc_count,
            total_size_bytes=total_size
        ))
    return results

@router.get("/{folder_id}", response_model=FolderDetailResponse)
def get_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single folder and its documents."""
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    docs = db.query(Document).filter(Document.folder_id == folder.id).order_by(Document.created_at.desc()).all()
    doc_responses = []
    total_size = 0
    for d in docs:
        total_size += d.file_size
        chunk_count = len(d.chunks)
        doc_responses.append(DocumentResponse(
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
            chunk_count=chunk_count
        ))

    return FolderDetailResponse(
        id=folder.id,
        user_id=folder.user_id,
        name=folder.name,
        description=folder.description,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        document_count=len(docs),
        total_size_bytes=total_size,
        documents=doc_responses
    )

@router.patch("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: int,
    folder_in: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename or update folder description."""
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    if folder_in.name is not None:
        folder.name = folder_in.name.strip()
    if folder_in.description is not None:
        folder.description = folder_in.description.strip()

    db.commit()
    db.refresh(folder)

    doc_count = db.query(func.count(Document.id)).filter(Document.folder_id == folder.id).scalar() or 0
    total_size = db.query(func.sum(Document.file_size)).filter(Document.folder_id == folder.id).scalar() or 0

    return FolderResponse(
        id=folder.id,
        user_id=folder.user_id,
        name=folder.name,
        description=folder.description,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        document_count=doc_count,
        total_size_bytes=total_size
    )

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete folder, associated documents, and vector embeddings in ChromaDB."""
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    # Delete vectors from ChromaDB
    vector_store.delete_folder_vectors(user_id=current_user.id, folder_id=folder.id)

    db.delete(folder)
    db.commit()
    return None
