from typing import List, Dict, Any, Optional, Tuple
from app.rag.vector_store import vector_store
from app.schemas.chat import SourceCitation

def retrieve_context(
    query: str,
    user_id: int,
    folder_id: Optional[int] = None,
    folder_ids: Optional[List[int]] = None,
    document_ids: Optional[List[int]] = None,
    top_k: int = 5,
    chronological: bool = False
) -> Tuple[str, List[SourceCitation]]:
    """
    Retrieve top-k chunks, format contextual string with bracketed citations,
    and return validated SourceCitation objects.
    When chronological is False (default), retains ranked vector similarity order.
    """
    raw_results = vector_store.search(
        query=query,
        user_id=user_id,
        folder_id=folder_id,
        folder_ids=folder_ids,
        document_ids=document_ids,
        top_k=top_k
    )

    if not raw_results:
        return "", []

    # Only sort chronologically when explicitly requested (e.g. for full document chronological summary)
    if chronological:
        raw_results = sorted(
            raw_results,
            key=lambda x: (
                x.get("metadata", {}).get("filename", ""),
                int(x.get("metadata", {}).get("page_number") or 0) if str(x.get("metadata", {}).get("page_number", "")).isdigit() else 0,
                int(x.get("metadata", {}).get("chunk_index") or 0) if str(x.get("metadata", {}).get("chunk_index", "")).isdigit() else 0
            )
        )

    context_blocks = []
    citations: List[SourceCitation] = []

    for idx, item in enumerate(raw_results):
        meta = item.get("metadata", {})
        doc_id = int(meta.get("document_id", 0))
        filename = meta.get("filename", "Unknown Document")
        rel_path = meta.get("relative_path", filename)
        page_num = meta.get("page_number")
        if page_num == "" or page_num is None:
            page_num = None
        else:
            try:
                page_num = int(page_num)
            except ValueError:
                page_num = None

        chunk_idx = int(meta.get("chunk_index", idx))
        text = item.get("text", "")
        similarity = item.get("similarity", 1.0)

        page_info = f", Page/Slide: {page_num}" if page_num is not None else ""
        source_header = f"[Source {idx+1}: {filename}{page_info}]"
        context_blocks.append(f"{source_header}\n{text}\n")

        citations.append(SourceCitation(
            document_id=doc_id,
            filename=filename,
            relative_path=rel_path,
            page_number=page_num,
            chunk_index=chunk_idx,
            excerpt=text,
            score=round(float(similarity), 4)
        ))

    formatted_context = "\n---\n".join(context_blocks)
    return formatted_context, citations
