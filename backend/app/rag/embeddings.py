import math
import hashlib
from typing import List
from app.core.config import settings

def _get_fallback_embedding(text: str, dim: int = 768) -> List[float]:
    """
    Deterministic pseudo-semantic embedding vector of dimension 768
    derived from hash-based word n-grams. Used when Gemini API key is unset
    or during automated offline unit testing.
    """
    vec = [0.0] * dim
    words = text.lower().split()
    if not words:
        return vec

    for i, word in enumerate(words):
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        # Position weight
        vec[idx] += 1.0 + (1.0 / (i + 1))
        # Bigram feature
        if i > 0:
            bi_h = int(hashlib.md5(f"{words[i-1]}_{word}".encode("utf-8")).hexdigest(), 16)
            vec[bi_h % dim] += 1.5

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings using Google text-embedding-004 if API key is provided,
    otherwise gracefully fall back to the deterministic embedding generator.
    """
    if not texts:
        return []

    api_key = settings.GEMINI_API_KEY.strip()
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            results = []
            # Batch embedding in chunks of 50
            batch_size = 50
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                res = genai.embed_content(
                    model=settings.EMBEDDING_MODEL,
                    content=batch,
                    task_type="retrieval_document"
                )
                embeddings = res.get("embedding", [])
                results.extend(embeddings)
            return results
        except Exception as e:
            print(f"Warning: Gemini embedding failed ({e}), using fallback embedding.")

    # Fallback mode
    return [_get_fallback_embedding(t) for t in texts]

def get_query_embedding(query: str) -> List[float]:
    """Generate embedding for a search query."""
    api_key = settings.GEMINI_API_KEY.strip()
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            res = genai.embed_content(
                model=settings.EMBEDDING_MODEL,
                content=query,
                task_type="retrieval_query"
            )
            return res.get("embedding", [])
        except Exception as e:
            print(f"Warning: Gemini query embedding failed ({e}), using fallback embedding.")

    return _get_fallback_embedding(query)
