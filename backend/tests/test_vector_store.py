from app.rag.vector_store import vector_store

def test_vector_store_insert_and_search():
    user_id = 999
    folder_id = 888
    doc_id = 777

    chunk_ids = [f"test_{user_id}_{doc_id}_0", f"test_{user_id}_{doc_id}_1"]
    texts = [
        "Convolutional Neural Networks are designed for computer vision and image processing.",
        "Recurrent Neural Networks and LSTMs excel at sequential time series processing."
    ]
    metadatas = [
        {"user_id": str(user_id), "folder_id": str(folder_id), "document_id": str(doc_id), "filename": "DL.pdf", "page_number": 1},
        {"user_id": str(user_id), "folder_id": str(folder_id), "document_id": str(doc_id), "filename": "DL.pdf", "page_number": 2}
    ]

    # Add to ChromaDB
    vector_store.add_chunks(chunk_ids, texts, metadatas)

    # Search for CNN
    results = vector_store.search(
        query="image processing vision",
        user_id=user_id,
        folder_id=folder_id,
        top_k=2
    )

    assert len(results) > 0
    assert "Convolutional" in results[0]["text"]
    assert results[0]["metadata"]["filename"] == "DL.pdf"

    # Cleanup
    vector_store.delete_document_vectors(user_id=user_id, document_id=doc_id)

    # Verify deleted
    post_delete_results = vector_store.search(
        query="image processing",
        user_id=user_id,
        folder_id=folder_id,
        top_k=2
    )
    assert len(post_delete_results) == 0
