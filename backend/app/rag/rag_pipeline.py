import re
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.schemas.chat import ChatResponse, SourceCitation
from app.rag.retriever import retrieve_context

SYSTEM_INSTRUCTION = (
    "You are an expert document-grounded AI assistant. Provide a concise, targeted, "
    "and well-structured explanation based strictly on the supplied document context. "
    "Never invent information. If the user asks for a specific topic, explain ONLY that specific topic. "
    "Do NOT summarize or dump the entire uploaded presentation or other unrelated slides. "
    "Provide accurate source citations and page/slide numbers in brackets like [Filename, Page X]. "
    "If the user asks in Telugu, answer in Telugu while maintaining strict grounding in the documents."
)

def _is_full_document_query(question: str) -> bool:
    """Detect if the user is explicitly requesting a complete document dump/summary of all slides/topics."""
    q = question.lower().strip()
    # Explicit specific topic queries should NEVER be treated as full document dumps
    if any(kw in q for kw in ["only", "specifically", "just", "what is", "how does", "why does", "define", "who is", "when did", "which"]):
        return False

    full_doc_triggers = [
        "all topics", "full file", "full information", "entire file", "entire document",
        "whole file", "whole presentation", "every slide", "all slides",
        "comprehensive summary of file", "summarize file", "summarize this presentation",
        "complete document", "everything in this file", "full report", "all sections"
    ]
    return any(t in q for t in full_doc_triggers)

def _clean_text_lines(text: str) -> List[str]:
    lines = []
    for l in text.split("\n"):
        line = l.strip()
        if len(line) < 3:
            continue
        clean = re.sub(r"^[-*•\d.]+\s*", "", line).strip()
        if clean and len(clean) > 3:
            lines.append(clean)
    return lines

def _extract_query_keywords(query: str) -> List[str]:
    stop_words = {
        "explain", "only", "the", "in", "a", "an", "of", "about", "what", "is", "are",
        "for", "to", "how", "does", "do", "and", "or", "give", "me", "show", "tell",
        "please", "this", "that", "these", "those", "with", "from", "by", "on", "can", "you"
    }
    words = re.findall(r"[a-zA-Z0-9_-]+", query.lower())
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    return keywords

def _generate_specific_topic_answer(
    question: str,
    citations: List[SourceCitation],
    language: str = "en"
) -> Tuple[str, List[SourceCitation]]:
    """
    Fast, targeted extractive synthesis focused strictly on the specific topic the user requested.
    Returns only the specific relevant text and only the relevant citations.
    """
    if not citations:
        msg = "ఈ ప్రశ్నకు సమాధానం అందించిన పత్రాలలో కనుగొనబడలేదు." if language == "te" else "The uploaded documents do not contain sufficient evidence for this topic."
        return msg, []

    keywords = _extract_query_keywords(question)
    
    # Score citations by keyword match
    scored_citations = []
    for cit in citations:
        text_lower = (cit.excerpt or "").lower()
        match_count = sum(1 for kw in keywords if kw in text_lower)
        # Check technical synonyms if "technical" or "architecture" in keywords
        if any(k in ["technical", "architecture", "system", "tech"] for k in keywords):
            tech_synonyms = ["algorithm", "pipeline", "approach", "method", "scoring", "detection", "model", "tokenization", "supervised", "unsupervised", "framework", "architecture"]
            match_count += sum(1 for s in tech_synonyms if s in text_lower) * 0.8
        scored_citations.append((match_count, cit))

    scored_citations.sort(key=lambda x: x[0], reverse=True)
    
    # Select top 2-3 most relevant citations matching the topic
    relevant_cits = [c for score, c in scored_citations if score > 0]
    if not relevant_cits:
        relevant_cits = citations[:2]
    else:
        relevant_cits = relevant_cits[:3]

    doc_name = relevant_cits[0].filename if relevant_cits else "Document"
    topic_label = " ".join(w.capitalize() for w in keywords) or "Requested Topic"

    # Extract clean points from the relevant citations
    extracted_points = []
    seen = set()
    for c in relevant_cits:
        p_num = f"Slide {c.page_number}" if c.page_number else "Section"
        for line in _clean_text_lines(c.excerpt):
            if line not in seen and not line.startswith("TOPIC") and not line.startswith("TEXT") and not line.isdigit():
                seen.add(line)
                extracted_points.append((p_num, line))

    if language == "te":
        lines = [
            f"### 🎯 కేంద్రీకృత వివరణ: {topic_label}",
            f"`{doc_name}` పత్రం ఆధారంగా, **{question}** కి సంబంధించిన వివరాలు:"
        ]
    else:
        lines = [
            f"### 🎯 Targeted Focus: {topic_label}",
            f"Based on `{doc_name}`, here is the specific explanation for **{question}**:"
        ]

    # Group by slide / subtopic
    points_by_slide = {}
    for p_num, pt in extracted_points:
        if p_num not in points_by_slide:
            points_by_slide[p_num] = []
        points_by_slide[p_num].append(pt)

    for p_num, pts in points_by_slide.items():
        title = pts[0]
        sub_pts = pts[1:] if len(pts) > 1 else pts
        lines.append(f"#### 📌 {title} `[{p_num}]`")
        for sp in sub_pts[:5]:
            if ":" in sp:
                parts = sp.split(":", 1)
                lines.append(f"- **{parts[0].strip()}:** {parts[1].strip()}")
            elif "|" in sp:
                parts = [p.strip() for p in sp.split("|") if p.strip()]
                lines.append(f"- **{parts[0]}:** {' • '.join(parts[1:])}")
            else:
                lines.append(f"- {sp}")
        lines.append("")

    lines.append("---")
    c_pills = ", ".join(f"`[{c.filename}, Slide {c.page_number}]`" if c.page_number else f"`[{c.filename}]`" for c in relevant_cits)
    if language == "te":
        lines.append(f"*ధృవీకరించబడిన ఆధారాలు:* {c_pills}")
    else:
        lines.append(f"*Verified topic citations:* {c_pills}")

    return "\n".join(lines), relevant_cits

def _generate_offline_full_report(
    question: str,
    context: str,
    citations: List[SourceCitation],
    language: str = "en"
) -> str:
    """Multi-section report used ONLY when the user explicitly asks for a complete full-document summary."""
    if not citations or not context.strip():
        if language == "te":
            return "అందించిన పత్రాలలో సమాచారం కనుగొనబడలేదు."
        return "The uploaded documents do not contain sufficient evidence."

    doc_groups: Dict[str, Dict[Any, List[str]]] = {}
    for cit in citations:
        fname = cit.filename
        p_num = cit.page_number or "General"
        if fname not in doc_groups:
            doc_groups[fname] = {}
        if p_num not in doc_groups[fname]:
            doc_groups[fname][p_num] = []

        lines = [l.strip() for l in cit.excerpt.split("\n") if l.strip()]
        for line in lines:
            if len(line) < 3:
                continue
            clean = re.sub(r"^[-*•\d.]+\s*", "", line).strip()
            if clean and clean not in doc_groups[fname][p_num]:
                doc_groups[fname][p_num].append(clean)

    primary_doc = list(doc_groups.keys())[0]
    
    slide_sections = []
    for fname in doc_groups:
        for p_num in sorted(doc_groups[fname].keys(), key=lambda x: (isinstance(x, int), x)):
            items = doc_groups[fname][p_num]
            if not items:
                continue
            title = items[0] if len(items[0]) < 60 and not items[0].startswith("|") else f"Section {p_num}"
            slide_sections.append(f"#### 📄 {fname} — Slide / Page {p_num}: {title}")
            for b in items[1:5]:
                slide_sections.append(f"- {b}")
            slide_sections.append("")

    header = f"# 📊 Comprehensive Intelligence Report: {primary_doc}"
    return f"{header}\n\n## Overview of Document\n\n" + "\n".join(slide_sections)

def generate_rag_answer(
    question: str,
    user_id: int,
    folder_id: Optional[int] = None,
    folder_ids: Optional[List[int]] = None,
    document_ids: Optional[List[int]] = None,
    top_k: int = 5,
    language: str = "en",
    api_key: Optional[str] = None,
    model_name: Optional[str] = None
) -> ChatResponse:
    """
    RAG Answer Generation:
    - If user asks for a specific topic, retrieves top 5 relevant chunks and returns ONLY the specific topic answer fast.
    - If user explicitly requests full document breakdown, retrieves comprehensive chunks.
    """
    is_full_doc = _is_full_document_query(question)
    effective_top_k = 25 if is_full_doc else min(top_k, 5)

    context, citations = retrieve_context(
        query=question,
        user_id=user_id,
        folder_id=folder_id,
        folder_ids=folder_ids,
        document_ids=document_ids,
        top_k=effective_top_k,
        chronological=is_full_doc
    )

    if not context.strip():
        not_found_msg = (
            "ఈ ప్రశ్నకు సమాధానం ఇవ్వడానికి అందించిన పత్రాలలో తగిన సమాచారం లభించలేదు."
            if language == "te"
            else "The uploaded documents do not contain sufficient evidence to answer this question."
        )
        return ChatResponse(
            answer=not_found_msg,
            sources=[],
            conversation_id=0,
            folder_id=folder_id,
            grounded=False,
            suggested_follow_ups=[]
        )

    active_api_key = (api_key or "").strip() or settings.GEMINI_API_KEY.strip()
    active_model = (model_name or "").strip() or settings.GEMINI_MODEL
    answer_text = ""

    if active_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=active_api_key)
            model = genai.GenerativeModel(
                model_name=active_model,
                system_instruction=SYSTEM_INSTRUCTION
            )

            if is_full_doc:
                prompt_instruction = "Provide a comprehensive, exhaustive explanation covering all topics found in the context."
            else:
                prompt_instruction = (
                    "CRITICAL: The user is asking ONLY for the specific topic stated in USER QUESTION. "
                    "Answer ONLY about this specific topic directly, concisely, and specifically. "
                    "DO NOT summarize the entire presentation or dump unrelated slides. "
                    "Only cite the exact page/slide numbers where this specific topic appears."
                )

            prompt = (
                f"DOCUMENT CONTEXT FROM UPLOADED FILES:\n{context}\n\n"
                f"USER QUESTION: {question}\n\n"
                f"LANGUAGE: {'Telugu' if language == 'te' else 'English'}\n\n"
                f"INSTRUCTIONS:\n{prompt_instruction}\n\n"
                f"GROUNDED ANSWER:"
            )

            response = model.generate_content(prompt)
            if response and response.text:
                answer_text = response.text.strip()
                # For specific queries with Gemini, keep only citations matching the top 3
                if not is_full_doc:
                    citations = citations[:3]
        except Exception as e:
            print(f"Gemini API generation error: {e}. Falling back to structured extractive synthesis.")

    # Offline / Extractive fallback
    if not answer_text:
        if is_full_doc:
            answer_text = _generate_offline_full_report(question, context, citations, language=language)
        else:
            answer_text, citations = _generate_specific_topic_answer(question, citations, language=language)

    # Generate helpful follow-ups based on the user's specific topic
    suggested_follow_ups = []
    if citations:
        doc_names = list(set(c.filename for c in citations))
        primary_doc = doc_names[0]
        if is_full_doc:
            suggested_follow_ups = [
                f"Can you explain the technical architecture in {primary_doc}?",
                "What are the key algorithms and methods used?",
                "Summarize the evaluation results."
            ]
        else:
            suggested_follow_ups = [
                f"Can you give more details on this topic from {primary_doc}?",
                "What are the main advantages or limitations mentioned?",
                "How does this compare to other methods in the document?"
            ]

    return ChatResponse(
        answer=answer_text,
        sources=citations,
        conversation_id=0,
        folder_id=folder_id,
        grounded=True,
        suggested_follow_ups=suggested_follow_ups[:3]
    )
