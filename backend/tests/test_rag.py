from app.rag.vector_store import vector_store
from app.rag.rag_pipeline import generate_rag_answer

def test_rag_generation_with_citations():
    user_id = 1001
    folder_id = 2001
    doc_id = 3001

    # Insert chunk into ChromaDB
    chunk_id = f"test_{user_id}_{doc_id}_0"
    text = "The A* search algorithm uses the evaluation function f(n) = g(n) + h(n), where g is path cost and h is admissible heuristic."
    metadata = {
        "user_id": str(user_id),
        "folder_id": str(folder_id),
        "document_id": str(doc_id),
        "filename": "Search_Algorithms.pdf",
        "relative_path": "AI/Search_Algorithms.pdf",
        "page_number": 4,
        "chunk_index": 0
    }
    vector_store.add_chunks([chunk_id], [text], [metadata])

    # Ask question
    res = generate_rag_answer(
        question="What is the evaluation function of A* search?",
        user_id=user_id,
        folder_id=folder_id,
        top_k=3,
        language="en"
    )

    assert res.grounded is True
    assert len(res.sources) > 0
    assert res.sources[0].filename == "Search_Algorithms.pdf"
    assert res.sources[0].page_number == 4
    assert "f(n) = g(n) + h(n)" in res.answer or "A*" in res.answer

    # Cleanup
    vector_store.delete_document_vectors(user_id=user_id, document_id=doc_id)

def test_rag_unsupported_question_reports_not_found():
    res = generate_rag_answer(
        question="What is the boiling point of liquid nitrogen in Kelvin?",
        user_id=999999,  # Non-existent user/chunks
        folder_id=999999,
        top_k=3
    )
    assert "not contain sufficient evidence" in res.answer.lower() or res.grounded is False
