import os
import pytest
import fitz  # PyMuPDF
from docx import Document as DocxDoc
from app.rag.document_loader import (
    extract_pdf, extract_docx, extract_csv_xlsx, extract_txt_md, 
    extract_json, calculate_file_hash, load_document
)

@pytest.fixture
def sample_pdf(tmp_path):
    pdf_path = str(tmp_path / "test_doc.pdf")
    doc = fitz.open()
    page1 = doc.new_page()
    page1.insert_text((50, 72), "Page 1: Introduction to Supervised Machine Learning and Regression.")
    page2 = doc.new_page()
    page2.insert_text((50, 72), "Page 2: Unsupervised Learning: K-Means Clustering and Dimensionality Reduction.")
    doc.save(pdf_path)
    doc.close()
    return pdf_path

@pytest.fixture
def sample_docx(tmp_path):
    docx_path = str(tmp_path / "test_notes.docx")
    doc = DocxDoc()
    doc.add_heading("Artificial Intelligence Syllabus", level=1)
    doc.add_paragraph("Heuristic search algorithms include A* and Greedy Best First Search.")
    doc.save(docx_path)
    return docx_path

@pytest.fixture
def sample_csv(tmp_path):
    csv_path = str(tmp_path / "students.csv")
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("id,name,grade\n1,Aarav,A\n2,Diya,A+\n")
    return csv_path

def test_extract_pdf_pages(sample_pdf):
    chunks = extract_pdf(sample_pdf)
    assert len(chunks) == 2
    assert chunks[0].page_number == 1
    assert "Supervised Machine Learning" in chunks[0].text
    assert chunks[1].page_number == 2
    assert "Unsupervised Learning" in chunks[1].text

def test_extract_docx(sample_docx):
    chunks = extract_docx(sample_docx)
    assert len(chunks) >= 1
    assert "Heuristic search algorithms" in chunks[0].text

def test_extract_csv(sample_csv):
    chunks = extract_csv_xlsx(sample_csv, ".csv")
    assert len(chunks) >= 1
    assert "Aarav" in chunks[0].text

def test_extract_txt(tmp_path):
    txt_path = str(tmp_path / "notes.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("Relational algebra operations: Select, Project, Join.")
    chunks = extract_txt_md(txt_path)
    assert len(chunks) == 1
    assert "Relational algebra" in chunks[0].text

def test_calculate_file_hash(sample_pdf):
    h = calculate_file_hash(sample_pdf)
    assert isinstance(h, str)
    assert len(h) == 64  # SHA-256 length
