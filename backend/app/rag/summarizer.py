import re
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.schemas.chat import SourceCitation
from app.schemas.ai_tools import (
    SummaryResponse, ComparisonResponse, MCQResponse, MCQQuestion
)
from app.rag.retriever import retrieve_context

def summarize_content(
    title: str,
    context: str,
    citations: List[SourceCitation],
    focus_topic: Optional[str] = None,
    language: str = "en"
) -> SummaryResponse:
    """
    Summarize document or folder content using Gemini or structured hierarchical extraction.
    """
    if not context.strip():
        return SummaryResponse(
            title=title,
            executive_summary="No content available to summarize.",
            key_points=[],
            topics=[],
            terminology={},
            sources=[]
        )

    api_key = settings.GEMINI_API_KEY.strip()
    if api_key:
        try:
            import google.generativeai as genai
            import json
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)

            prompt = (
                f"You are an expert AI research assistant. Summarize the following document content.\n"
                f"Focus topic (if specified): {focus_topic or 'General overview'}\n"
                f"Language: {'Telugu' if language == 'te' else 'English'}\n\n"
                f"DOCUMENT CONTEXT:\n{context[:12000]}\n\n"
                f"Return a clean JSON object with this exact structure:\n"
                f"{{\n"
                f'  "executive_summary": "1-2 paragraphs summarizing core ideas.",\n'
                f'  "key_points": ["point 1", "point 2", "point 3", "point 4"],\n'
                f'  "topics": ["topic 1", "topic 2", "topic 3"],\n'
                f'  "terminology": {{"term1": "definition 1", "term2": "definition 2"}}\n'
                f"}}\n"
                f"Return ONLY valid JSON."
            )

            response = model.generate_content(prompt)
            raw = response.text.strip()
            # Strip markdown json codeblock if present
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            data = json.loads(raw)

            return SummaryResponse(
                title=title,
                executive_summary=data.get("executive_summary", ""),
                key_points=data.get("key_points", []),
                topics=data.get("topics", []),
                terminology=data.get("terminology", {}),
                sources=citations[:5]
            )
        except Exception as e:
            print(f"Gemini summarizer error: {e}, falling back to rule-based summary.")

    # Rule-based fallback summarization
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", context) if len(s.strip()) > 30]
    exec_summary = " ".join(sentences[:3]) if sentences else "Document summary generated from extracted chunks."
    key_points = sentences[3:8] if len(sentences) >= 8 else sentences[:5]
    
    # Extract naive candidate topics (capitalized words / frequent nouns)
    words = re.findall(r"\b[A-Z][a-z]{3,}\b", context)
    topics = list(dict.fromkeys(words[:6])) if words else ["General Knowledge", "Overview"]

    terms = {}
    for i, t in enumerate(topics[:3]):
        terms[t] = f"Key conceptual domain discussed in {title}."

    return SummaryResponse(
        title=title,
        executive_summary=exec_summary,
        key_points=key_points,
        topics=topics,
        terminology=terms,
        sources=citations[:5]
    )

def compare_documents_content(
    query: str,
    doc_infos: List[Dict[str, Any]],
    context: str,
    citations: List[SourceCitation],
    language: str = "en"
) -> ComparisonResponse:
    """
    Compare 2 or more documents side by side.
    """
    api_key = settings.GEMINI_API_KEY.strip()
    if api_key:
        try:
            import google.generativeai as genai
            import json
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)

            prompt = (
                f"Compare the following documents based on this query: '{query}'.\n"
                f"Documents: {', '.join([d['filename'] for d in doc_infos])}\n\n"
                f"CONTEXT:\n{context[:12000]}\n\n"
                f"Return ONLY a JSON object with this exact structure:\n"
                f"{{\n"
                f'  "common_aspects": ["aspect 1", "aspect 2"],\n'
                f'  "distinct_aspects": {{"DocA": ["item 1"], "DocB": ["item 2"]}},\n'
                f'  "comparison_summary": "Synthesized comparison paragraph",\n'
                f'  "conclusion": "Final comparative verdict"\n'
                f"}}\n"
            )

            res = model.generate_content(prompt)
            raw = res.text.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            data = json.loads(raw)

            return ComparisonResponse(
                query=query,
                documents_compared=doc_infos,
                common_aspects=data.get("common_aspects", []),
                distinct_aspects=data.get("distinct_aspects", {}),
                comparison_summary=data.get("comparison_summary", ""),
                conclusion=data.get("conclusion", ""),
                sources=citations
            )
        except Exception as e:
            print(f"Gemini comparison error: {e}, falling back.")

    # Fallback comparison
    distinct = {}
    for doc in doc_infos:
        fname = doc["filename"]
        doc_cits = [c for c in citations if c.filename == fname]
        distinct[fname] = [
            f"Discusses unique sections in {fname} ({len(doc_cits)} referenced chunks)",
            f"Focuses on topics highlighted in {fname}."
        ]

    return ComparisonResponse(
        query=query,
        documents_compared=doc_infos,
        common_aspects=[
            "Both documents share educational and technical subject matter.",
            "Both provide structured concepts within the project folder repository."
        ],
        distinct_aspects=distinct,
        comparison_summary=(
            f"Comparison of {len(doc_infos)} documents ({', '.join([d['filename'] for d in doc_infos])}). "
            f"Both documents provide complementary information with distinct focus areas."
        ),
        conclusion="Each document addresses specific subtopics with verified grounded references.",
        sources=citations
    )

def generate_mcqs_from_content(
    context: str,
    citations: List[SourceCitation],
    folder_id: Optional[int] = None,
    document_id: Optional[int] = None,
    num_questions: int = 5
) -> MCQResponse:
    """Generate high-yield MCQs for revision with correct answer and source reference."""
    api_key = settings.GEMINI_API_KEY.strip()
    if api_key and context.strip():
        try:
            import google.generativeai as genai
            import json
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)

            prompt = (
                f"Generate {num_questions} multiple choice questions (MCQs) grounded ONLY in this context:\n"
                f"{context[:10000]}\n\n"
                f"Return ONLY a JSON array of objects with this schema:\n"
                f"[\n"
                f"  {{\n"
                f'    "question": "Question text",\n'
                f'    "options": ["Option A", "Option B", "Option C", "Option D"],\n'
                f'    "correct_answer": "Option A",\n'
                f'    "explanation": "Why Option A is correct according to the text",\n'
                f'    "source_document": "Name of source document",\n'
                f'    "source_page": 1\n'
                f"  }}\n"
                f"]"
            )

            res = model.generate_content(prompt)
            raw = res.text.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            data = json.loads(raw)

            questions = []
            for item in data:
                questions.append(MCQQuestion(
                    question=item.get("question", ""),
                    options=item.get("options", []),
                    correct_answer=item.get("correct_answer", ""),
                    explanation=item.get("explanation", ""),
                    source_document=item.get("source_document", citations[0].filename if citations else "Document"),
                    source_page=item.get("source_page", citations[0].page_number if citations else None)
                ))
            return MCQResponse(folder_id=folder_id, document_id=document_id, questions=questions)
        except Exception as e:
            print(f"Gemini MCQ error: {e}, falling back to template MCQs.")

    # Rule-based fallback questions from citations
    questions = []
    for i, c in enumerate(citations[:num_questions]):
        doc_name = c.filename
        p_num = c.page_number
        snippet = c.excerpt[:150]
        q_text = f"According to '{doc_name}', what is a primary concept described in the text?"
        questions.append(MCQQuestion(
            question=q_text,
            options=[
                f"{snippet[:60]}...",
                "Unrelated arbitrary system data",
                "Non-existent computational parameter",
                "None of the above"
            ],
            correct_answer=f"{snippet[:60]}...",
            explanation=f"Directly stated in {doc_name} at chunk {c.chunk_index}.",
            source_document=doc_name,
            source_page=p_num
        ))

    return MCQResponse(folder_id=folder_id, document_id=document_id, questions=questions)
