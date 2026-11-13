import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.rag.embeddings import get_embeddings, get_query_embedding

class VectorStore:
    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=str(settings.CHROMA_PERSIST_DIR),
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name="folder_intelligence_docs",
            metadata={"hnsw:space": "cosine"}
        )

    def add_chunks(
        self,
        chunk_ids: List[str],
        texts: List[str],
        metadatas: List[Dict[str, Any]]
    ):
        """Add text chunks and embeddings to ChromaDB with sanitized metadata."""
        if not texts:
            return

        # Sanitize metadata for ChromaDB (no null values, only str/int/float/bool)
        sanitized_metadatas = []
        for meta in metadatas:
            clean = {}
            for k, v in meta.items():
                if v is None:
                    clean[k] = ""
                elif isinstance(v, (str, int, float, bool)):
                    clean[k] = v
                else:
                    clean[k] = str(v)
            sanitized_metadatas.append(clean)

        embeddings = get_embeddings(texts)

        # Upsert in safe batches of 100
        batch_size = 100
        for i in range(0, len(chunk_ids), batch_size):
            self.collection.upsert(
                ids=chunk_ids[i : i + batch_size],
                embeddings=embeddings[i : i + batch_size],
                documents=texts[i : i + batch_size],
                metadatas=sanitized_metadatas[i : i + batch_size]
            )

    def search(
        self,
        query: str,
        user_id: int,
        folder_id: Optional[int] = None,
        folder_ids: Optional[List[int]] = None,
        document_ids: Optional[List[int]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant chunks enforcing strict user and folder/document isolation.
        """
        query_vector = get_query_embedding(query)

        # Build metadata filter conditions
        conditions = [{"user_id": str(user_id)}]

        if document_ids:
            if len(document_ids) == 1:
                conditions.append({"document_id": str(document_ids[0])})
            else:
                conditions.append({"document_id": {"$in": [str(d) for d in document_ids]}})
        elif folder_ids:
            if len(folder_ids) == 1:
                conditions.append({"folder_id": str(folder_ids[0])})
            else:
                conditions.append({"folder_id": {"$in": [str(f) for f in folder_ids]}})
        elif folder_id is not None:
            conditions.append({"folder_id": str(folder_id)})

        where_filter = {"$and": conditions} if len(conditions) > 1 else conditions[0]

        # Query collection
        try:
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=top_k,
                where=where_filter
            )
        except Exception as e:
            print(f"ChromaDB search query failed: {e}")
            return []

        formatted_results = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            ids = results["ids"][0] if "ids" in results else [""] * len(docs)

            for i in range(len(docs)):
                formatted_results.append({
                    "id": ids[i],
                    "text": docs[i],
                    "metadata": metas[i],
                    "distance": distances[i],
                    "similarity": 1.0 - distances[i] if distances[i] is not None else 1.0
                })

        return formatted_results

    def delete_document_vectors(self, user_id: int, document_id: int):
        """Delete all vectors belonging to a specific document."""
        try:
            self.collection.delete(
                where={"$and": [{"user_id": str(user_id)}, {"document_id": str(document_id)}]}
            )
        except Exception as e:
            print(f"Error deleting document vectors: {e}")

    def delete_folder_vectors(self, user_id: int, folder_id: int):
        """Delete all vectors belonging to an entire folder."""
        try:
            self.collection.delete(
                where={"$and": [{"user_id": str(user_id)}, {"folder_id": str(folder_id)}]}
            )
        except Exception as e:
            print(f"Error deleting folder vectors: {e}")

vector_store = VectorStore()
