# AI-Powered Folder Intelligence System Using Retrieval-Augmented Generation (RAG)

**B.Tech Computer Science & Engineering (Artificial Intelligence) — Final-Year Major Project 2026**

[![Python 3.10](https://img.shields.io/badge/Python-3.10-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![React Vite](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://vitejs.dev/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-purple.svg)](https://www.trychroma.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-orange.svg)](https://aistudio.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

---

## 1. Project Overview

The **AI-Powered Folder Intelligence System** is an enterprise-grade web application where users can upload entire folder structures containing heterogeneous documents (`PDF`, `DOCX`, `PPTX`, `CSV`, `XLSX`, `TXT`, `MD`, `JSON`) and interact with them using natural-language questions.

Unlike naive LLM wrappers, this system implements a production **Retrieval-Augmented Generation (RAG)** pipeline:
1. Recursively scans uploaded folders while strictly preserving relative path hierarchies.
2. Extracts text page-by-page using format-specific parsers (`PyMuPDF`, `python-docx`, `python-pptx`, `pandas`).
3. Chunks text using `RecursiveCharacterTextSplitter` and enriches every chunk with metadata (`user_id`, `folder_id`, `document_id`, `filename`, `relative_path`, `page_number`, `chunk_index`, `file_hash`).
4. Generates dense vector embeddings using Google's `text-embedding-004` (768 dimensions) with deterministic fallback.
5. Stores embeddings in persistent **ChromaDB** with strict multi-tenant user and folder isolation (`$and` filters).
6. Retrieves the top-k most semantically relevant chunks based on cosine similarity.
7. Synthesizes grounded answers using **Google Gemini** with zero hallucination, verifiable citations, and exact page references.
8. Includes advanced tools: Hierarchical Document/Folder Summarization, Multi-Document Side-by-Side Comparison, Automatic Exam Quiz/MCQ Generation, and Bilingual Q&A (English & Telugu).

---

## 2. System Architecture

![AI Folder Intelligence System Architecture](docs/images/rag_architecture_diagram.jpg)

```
                       ┌──────────────────────────────────────────┐
                       │  React (Vite) + Tailwind CSS Dashboard   │
                       │   Dark Navy Glassmorphism UI (Port 5173) │
                       └────────────────────┬─────────────────────┘
                                            │ HTTP / JSON REST
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │      FastAPI Backend (Port 8000)         │
                       │   JWT Auth • CORS • Error Middleware     │
                       └─────┬──────────────────┬─────────────┬───┘
                             │                  │             │
           ┌─────────────────┴────┐   ┌─────────┴─────────┐   │
           │  Document Ingestion  │   │   RAG Retriever   │   │
           │  • PyMuPDF (PDF)     │   │   & Generation    │   │
           │  • python-docx (DOCX)│   │   • Top-K Cosine  │   │
           │  • python-pptx (PPTX)│   │   • Gemini Flash  │   │
           │  • pandas (CSV/XLSX) │   │   • Citations     │   │
           └──────────┬───────────┘   └─────────┬─────────┘   │
                      │                         │             │
                      ▼                         ▼             ▼
       ┌────────────────────────┐   ┌─────────────────┐ ┌───────────────┐
       │   Recursive Splitter   │   │ ChromaDB Vector │ │  Relational   │
       │   & Google Embeddings  │──▶│ Store (Storage) │ │   Database    │
       │   (text-embedding-004) │   │ Cosine Distance │ │ (MySQL/SQLite)│
       └────────────────────────┘   └─────────────────┘ └───────────────┘
```

---

## 3. Application Previews & Output Showcases

### 💬 Document Question Answering with Verifiable Citations
Interactively query heterogeneous files with automatic slide-by-slide and page citations:

![Document Question Answering Preview](docs/images/chat_rag_interface.jpg)

### 📊 System Intelligence & Analytics Dashboard
Real-time monitoring of vector counts, folder distribution, chunking density, and query accuracy:

![Analytics Dashboard Preview](docs/images/dashboard_analytics.jpg)

---

## 4. Technology Stack


| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios, Lucide React, Recharts |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2, Passlib (bcrypt), Python-Jose (JWT) |
| **Database** | MySQL 8.0 (Primary production target) / SQLite (Zero-config instant local start) |
| **Vector DB** | ChromaDB (Persistent local embeddings with Cosine space) |
| **AI / RAG** | Google Gemini (`gemini-1.5-flash`), Google `text-embedding-004`, LangChain text splitters |
| **Parsers** | PyMuPDF (`fitz`), `python-docx`, `python-pptx`, `pandas`, `openpyxl`, `tabulate` |
| **Testing** | pytest 8.3.4 (Automated suite covering auth, loaders, chunking, vectors, and security) |

---

## 5. Quick Start (Windows PowerShell)

### Step 1: Clone or Navigate to Project
```powershell
cd C:\Users\masin\.gemini\antigravity\scratch\folder-intelligence-rag
```

### Step 2: Backend Setup
```powershell
cd backend

# Virtual environment is already created at backend\venv
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run automated test suite to verify all modules
python -m pytest -v

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will run at:* **`http://127.0.0.1:8000`**  
*Interactive Swagger Documentation:* **`http://127.0.0.1:8000/docs`**

---

### Step 3: Frontend Setup (Open a New PowerShell Window)
```powershell
cd C:\Users\masin\.gemini\antigravity\scratch\folder-intelligence-rag\frontend

# Start Vite development server
npm run dev
```
*Frontend application will run at:* **`http://localhost:5173`**

---

## 6. Configuration & Database Options

The application configuration is managed via `backend/.env`.

### Instant SQLite Mode (Default)
By default, the backend connects to an SQLite database file (`folder_rag.db`) with zero manual setup:
```ini
DATABASE_URL=sqlite:///./folder_rag.db
```

### MySQL 8.0 Production Mode
To connect to your local MySQL 8.0 service (`MySQL80`):
1. Create the database in MySQL:
   ```sql
   CREATE DATABASE folder_rag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Update `backend/.env`:
   ```ini
   DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/folder_rag
   ```

### Google Gemini API Key
- Get your free key from [Google AI Studio](https://aistudio.google.com/).
- Enter it in `backend/.env` under `GEMINI_API_KEY="..."` or dynamically configure it in the web dashboard's **Settings Page**.
- *Note:* If left blank, the application runs with an intelligent extractive grounding engine so all features, vector searches, and citations work even without an external API key!

---

## 7. How to Test & Demonstrate the System

### 1. One-Click Demo Login
1. Open `http://localhost:5173` in your browser.
2. Click **Get Started** or **Sign In**.
3. Click the purple button: **"Launch Demo Student Account"** (or register a new user).

### 2. Ingest Sample Documents
Sample academic files are included in `backend/sample_data/`:
- `Deep_Learning_Architectures.pdf` (Multi-page PDF with chapter hierarchy)
- `Machine_Learning_Concepts.docx` (Rich Word document)
- `Artificial_Intelligence_Overview.txt` (Search algorithms & logic)
- `DBMS_Architecture.txt` (ACID properties & normalization)
- `Student_Records.csv` (Tabular academic datasets)

1. Navigate to **Upload Folder** (`/upload`).
2. Click **Select Individual Files** and select all files from `backend/sample_data/`.
3. Select or enter folder name `College_Materials` and click **Ingest & Index Documents**.
4. Watch the progress bar extract text, create vector embeddings, and store chunks into ChromaDB.

### 3. Ask Natural Language Questions in AI Chat
Navigate to **AI Chat** (`/chat`) and test queries:
- *"What is the evaluation function used in A* search algorithm?"*
- *"Explain the ACID properties of database transactions."*
- *"What is the difference between supervised and unsupervised learning?"*
- *"Tell me about the students in the Artificial Intelligence branch."*
- **Click any purple citation badge** (e.g. `[Deep_Learning_Architectures.pdf p.2]`) to open the **Source Viewer Modal** and view the exact passage and similarity score!
- Switch language to **తెలుగు (Telugu)** to test multilingual question answering.

### 4. Cross-Document Comparison
1. Navigate to **Compare** (`/compare`).
2. Select `Artificial_Intelligence_Overview.txt` and `DBMS_Architecture.txt`.
3. Click **Compare Selected Documents**.
4. Inspect the synthesized Commonalities, Divergent focus areas, and citations for each file.

### 5. Exam MCQ & Revision Quiz Generator
1. Navigate to **Quiz Gen** (`/quiz`).
2. Select your folder and click **Generate 5 Practice MCQs**.
3. Attempt the questions and click **Check Answer** to view document citations and pedagogical explanations.

---

## 8. B.Tech Major Project Viva & Evaluation Q&A

**Q1: What is Retrieval-Augmented Generation (RAG) and why is it needed?**  
*Answer:* Standard Large Language Models (LLMs) suffer from hallucinations and knowledge cutoff dates. RAG bridges this gap by decoupling knowledge retrieval from language generation. In this project, when a question is asked, ChromaDB performs semantic vector search across private document chunks and injects only the retrieved factual context into Gemini's prompt, guaranteeing grounded answers with verifiable source citations.

**Q2: What text chunking strategy is employed?**  
*Answer:* We utilize `RecursiveCharacterTextSplitter` with a default chunk size of 1000 characters and an overlap of 200 characters. The recursive splitting respects semantic boundaries (paragraphs `\n\n`, newlines `\n`, spaces ` `). Chunk overlap ensures context is not broken at sentence boundaries. Crucially, every sub-chunk inherits the exact page number of its parent document.

**Q3: How is multi-user data isolation achieved?**  
*Answer:* Multi-tenant isolation is enforced at both data layers:
1. **Relational Layer:** Foreign keys on `user_id` restrict document and folder access via JWT token claims.
2. **Vector Layer:** ChromaDB queries enforce mandatory composite metadata filters:  
   `{"$and": [{"user_id": str(user_id)}, {"folder_id": str(folder_id)}]}`. User A cannot query or retrieve vectors belonging to User B under any circumstances.

**Q4: How does the system handle scanned or image-based PDFs?**  
*Answer:* PyMuPDF checks for extractable text streams. If an encrypted PDF is detected, a descriptive exception is raised. If a PDF contains only scanned bitmaps with no text layer, the system reports that OCR is required.

---

## 9. Automated Test Suite Summary


Run all 21 automated tests:
```powershell
.\backend\venv\Scripts\python.exe -m pytest -v
```

Verified test modules:
- `test_auth.py`: Registration, login, password hashing, JWT expiration.
- `test_folders.py`: CRUD operations, folder updates, deletion.
- `test_loaders.py`: PyMuPDF PDF page extraction, python-docx, CSV/pandas, TXT, SHA-256 hash.
- `test_chunking.py`: RecursiveCharacterTextSplitter, page number preservation.
- `test_vector_store.py`: ChromaDB vector insertion, cosine query, vector deletion.
- `test_rag.py`: Grounded answer generation, citation structure, unsupported question detection.
- `test_security.py`: Cross-user folder access blocks, cross-user vector isolation in ChromaDB.

---

**Developed for B.Tech Computer Science (Artificial Intelligence) Major Project.**
