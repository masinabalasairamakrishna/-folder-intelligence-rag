from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.rag.document_loader import ExtractedChunk
from app.core.config import settings

class ChunkResult:
    def __init__(self, text: str, chunk_index: int, page_number: int | None, metadata: Dict[str, Any]):
        self.text = text
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.metadata = metadata

def split_extracted_chunks(
    extracted_chunks: List[ExtractedChunk],
    chunk_size: int = settings.DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = settings.DEFAULT_CHUNK_OVERLAP,
    base_metadata: Dict[str, Any] = None
) -> List[ChunkResult]:
    """
    Split extracted document parts using RecursiveCharacterTextSplitter,
    preserving exact page/slide tracking and enriched metadata.
    """
    base_metadata = base_metadata or {}
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )

    final_chunks = []
    global_chunk_idx = 0

    for extracted in extracted_chunks:
        sub_texts = text_splitter.split_text(extracted.text)
        for sub_text in sub_texts:
            if not sub_text.strip():
                continue
            meta = {
                **base_metadata,
                **extracted.metadata,
                "chunk_index": global_chunk_idx,
                "page_number": extracted.page_number
            }
            final_chunks.append(ChunkResult(
                text=sub_text.strip(),
                chunk_index=global_chunk_idx,
                page_number=extracted.page_number,
                metadata=meta
            ))
            global_chunk_idx += 1

    return final_chunks
