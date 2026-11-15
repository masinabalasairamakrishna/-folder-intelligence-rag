@echo off
echo ========================================================
echo   Starting Folder Intelligence RAG System
echo ========================================================
echo.

echo [1/2] Starting Backend Server (FastAPI on Port 8000)...
start "FolderIntelligence Backend" cmd /k "cd /d C:\Users\masin\.gemini\antigravity\scratch\folder-intelligence-rag\backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Vite on Port 5173)...
start "FolderIntelligence Frontend" cmd /k "cd /d C:\Users\masin\.gemini\antigravity\scratch\folder-intelligence-rag\frontend && npm start"

echo.
echo ========================================================
echo   All servers started!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000/docs
echo ========================================================
