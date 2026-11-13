import os
import hashlib
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
import pandas as pd

class DocumentExtractionError(Exception):
    pass

class ExtractedChunk:
    def __init__(self, text: str, page_number: Optional[int] = None, metadata: Optional[Dict[str, Any]] = None):
        self.text = text
        self.page_number = page_number
        self.metadata = metadata or {}

def calculate_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash of a file for duplicate detection."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def extract_pdf(file_path: str) -> List[ExtractedChunk]:
    """Extract text from PDF page-by-page using PyMuPDF (fitz)."""
    import fitz  # PyMuPDF
    chunks = []
    try:
        doc = fitz.open(file_path)
        if doc.is_encrypted:
            raise DocumentExtractionError("PDF is encrypted and password-protected.")

        for page_idx in range(len(doc)):
            page = doc.load_page(page_idx)
            text = page.get_text("text").strip()
            if text:
                chunks.append(ExtractedChunk(
                    text=text,
                    page_number=page_idx + 1,
                    metadata={"total_pages": len(doc)}
                ))
        doc.close()
    except Exception as e:
        if isinstance(e, DocumentExtractionError):
            raise
        raise DocumentExtractionError(f"Failed to extract PDF: {str(e)}")

    if not chunks:
        raise DocumentExtractionError("PDF contains no selectable text. It may be a scanned image requiring OCR.")
    return chunks

def extract_docx(file_path: str) -> List[ExtractedChunk]:
    """Extract paragraphs and tables from DOCX using python-docx."""
    from docx import Document
    chunks = []
    try:
        doc = Document(file_path)
        full_text_parts = []

        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                full_text_parts.append(text)

        # Also extract table contents
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    full_text_parts.append(row_text)

        text = "\n\n".join(full_text_parts)
        if text.strip():
            chunks.append(ExtractedChunk(text=text, page_number=1))
    except Exception as e:
        raise DocumentExtractionError(f"Failed to extract DOCX: {str(e)}")

    if not chunks:
        raise DocumentExtractionError("DOCX document is empty.")
    return chunks

def extract_pptx(file_path: str) -> List[ExtractedChunk]:
    """Extract slide-by-slide text from PPTX using python-pptx."""
    from pptx import Presentation
    chunks = []
    try:
        prs = Presentation(file_path)
        for slide_idx, slide in enumerate(prs.slides):
            slide_texts = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text:
                            slide_texts.append(text)
                elif shape.has_table:
                    for row in shape.table.rows:
                        row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                        if row_text:
                            slide_texts.append(row_text)

            slide_content = "\n".join(slide_texts).strip()
            if slide_content:
                chunks.append(ExtractedChunk(
                    text=slide_content,
                    page_number=slide_idx + 1,
                    metadata={"slide_number": slide_idx + 1}
                ))
    except Exception as e:
        raise DocumentExtractionError(f"Failed to extract PPTX: {str(e)}")

    if not chunks:
        raise DocumentExtractionError("PPTX presentation contains no extractable text.")
    return chunks

def extract_txt_md(file_path: str) -> List[ExtractedChunk]:
    """Extract text from plain text or markdown files."""
    encodings = ["utf-8", "latin-1", "cp1252"]
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                content = f.read().strip()
                if content:
                    return [ExtractedChunk(text=content, page_number=1)]
        except UnicodeDecodeError:
            continue
        except Exception as e:
            raise DocumentExtractionError(f"Failed to read text file: {str(e)}")

    raise DocumentExtractionError("Failed to decode text file with supported encodings.")

def extract_csv_xlsx(file_path: str, ext: str) -> List[ExtractedChunk]:
    """Extract CSV or XLSX as descriptive tabular rows with header context."""
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        if df.empty:
            raise DocumentExtractionError("Spreadsheet is empty.")

        # Summary of sheet
        summary = f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns.\n"
        summary += f"Columns: {', '.join([str(c) for c in df.columns])}\n\n"

        # Group rows into manageable batches
        rows_per_chunk = 50
        chunks = []
        for i in range(0, len(df), rows_per_chunk):
            subset = df.iloc[i : i + rows_per_chunk]
            try:
                markdown_table = subset.to_markdown(index=False)
            except Exception:
                markdown_table = subset.to_string(index=False)
            chunk_text = f"{summary}Rows {i+1} to {min(i+rows_per_chunk, len(df))}:\n\n{markdown_table}"
            chunks.append(ExtractedChunk(
                text=chunk_text,
                page_number=(i // rows_per_chunk) + 1,
                metadata={"total_rows": len(df)}
            ))
        return chunks
    except Exception as e:
        raise DocumentExtractionError(f"Failed to extract tabular data: {str(e)}")

def extract_json(file_path: str) -> List[ExtractedChunk]:
    """Extract formatted structured text from JSON."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        formatted = json.dumps(data, indent=2, ensure_ascii=False)
        return [ExtractedChunk(text=formatted, page_number=1)]
    except Exception as e:
        raise DocumentExtractionError(f"Failed to parse JSON file: {str(e)}")

def load_document(file_path: str) -> List[ExtractedChunk]:
    """Main ingestion router dispatching to format-specific extractors."""
    if not os.path.exists(file_path):
        raise DocumentExtractionError(f"File not found: {file_path}")

    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return extract_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_docx(file_path)
    elif ext in [".pptx", ".ppt"]:
        return extract_pptx(file_path)
    elif ext in [".txt", ".md", ".log", ".py", ".java", ".c", ".cpp"]:
        return extract_txt_md(file_path)
    elif ext in [".csv", ".xlsx", ".xls"]:
        return extract_csv_xlsx(file_path, ext)
    elif ext == ".json":
        return extract_json(file_path)
    else:
        raise DocumentExtractionError(f"Unsupported file format: {ext}")
