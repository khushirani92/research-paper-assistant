# ResearchIQ — Research Paper Intelligence Assistant

An AI-powered application that helps users explore research papers, retrieve relevant information from PDF documents, and get answers to questions using Retrieval-Augmented Generation (RAG).

## Overview

ResearchIQ is designed to make research papers easier to understand. Instead of manually searching through lengthy documents, users can upload a PDF and ask questions about its content.

The application combines a React frontend, a FastAPI backend, semantic search, and a language model to retrieve relevant passages and generate contextual answers.

## Features

- Upload research papers in PDF format.
- Extract and process text from PDF documents.
- Split document text into smaller chunks for retrieval.
- Generate semantic embeddings using Sentence Transformers.
- Retrieve relevant passages using FAISS similarity search.
- Ask questions about the uploaded research paper.
- Generate AI-powered answers using the Gemini API.
- Display relevant source passages and page references.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| PDF Processing | pypdf |
| Embeddings | Sentence Transformers |
| Vector Search | FAISS |
| Language Model | Google Gemini API |
| API Communication | REST API |

## Project Structure

```text
research-paper-assistant/
├── backend/
│   └── main.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following:

- Python 3.11 or a compatible version
- Node.js and npm
- A Google Gemini API key
- Git

### 1. Clone the repository

```bash
git clone https://github.com/khushirani92/research-paper-assistant.git
cd research-paper-assistant
```

### 2. Set up the backend

Create and activate a Python virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the required Python packages:

```bash
pip install fastapi "uvicorn[standard]" pypdf langchain langchain-community langchain-text-splitters sentence-transformers faiss-cpu python-multipart google-genai python-dotenv
```


```


Start the backend:

```powershell
cd backend
..\venv\Scripts\python.exe -m uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open a separate terminal:

```powershell
cd C:\Users\sama\research-paper-assistant\frontend
npm install
npm run dev
```

Open the local URL shown in your terminal, usually `http://localhost:5173`.

### 4. Use the application

1. Start both the backend and frontend.
2. Upload a research paper in PDF format.
3. Wait for document processing to finish.
4. Enter a question about the uploaded paper.
5. Review the generated answer and its source references.

## How RAG Works

1. **Document ingestion:** Extract text from the uploaded PDF.
2. **Chunking:** Divide the text into smaller passages.
3. **Embedding:** Convert passages into numerical vectors.
4. **Retrieval:** Use FAISS to find passages relevant to the user's question.
5. **Generation:** Send the retrieved context and question to the Gemini model.
6. **Answer:** Return a context-based response with source references.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Basic backend status |
| GET | `/health` | Health check |
| POST | `/upload-pdf` | Upload and process a PDF |
| POST | `/ask` | Ask a question about the processed document |

## Security Notes

- Keep API keys in environment variables.
- Never commit `.env`, virtual environments, or dependency folders.
- Do not upload confidential research documents or sensitive data without permission.
- Review model-generated answers against the original research paper.

## Future Improvements

- Support multiple research papers at the same time.
- Add chat history and conversation memory.
- Improve source citations and page-level references.
- Add paper summaries and key findings extraction.
- Deploy the frontend and backend to cloud hosting.

## Author

**Khushi Rani**

GitHub: [@khushirani92](https://github.com/khushirani92)

---

*ResearchIQ is an evolving project for exploring AI, semantic search, and Retrieval-Augmented Generation (RAG).*
