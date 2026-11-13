from app.rag.document_loader import ExtractedChunk
from app.rag.text_splitter import split_extracted_chunks

def test_chunking_preserves_page_numbers():
    chunks = [
        ExtractedChunk(text="Sentence on page 1." * 50, page_number=1),
        ExtractedChunk(text="Sentence on page 2." * 50, page_number=2),
    ]

    base_meta = {"user_id": "1", "filename": "test.pdf"}
    results = split_extracted_chunks(chunks, chunk_size=200, chunk_overlap=30, base_metadata=base_meta)

    assert len(results) > 2
    # Verify page numbers match the origin
    page_1_chunks = [r for r in results if r.page_number == 1]
    page_2_chunks = [r for r in results if r.page_number == 2]

    assert len(page_1_chunks) > 0
    assert len(page_2_chunks) > 0
    assert results[0].metadata["filename"] == "test.pdf"
    assert "chunk_index" in results[0].metadata
