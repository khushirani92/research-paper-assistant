
from io import BytesIO

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

from sentence_transformers import SentenceTransformer
import faiss
import numpy as np


# ------------------------------------------
# 1. FastAPI application
# ------------------------------------------

app = FastAPI(
    title="Research Paper Intelligence Assistant",
    description="Upload, read and search research papers",
    version="1.0.0",
)


# ------------------------------------------
# 2. React frontend connection (CORS)
# ------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------
# 3. Store the uploaded paper in memory
# ------------------------------------------

# Abhi development ke liye ek paper memory mein rahega.
paper_chunks = []
paper_index = None
paper_filename = None

# First run par model download ho sakta hai.
embedding_model = None


def get_embedding_model():
    global embedding_model

    if embedding_model is None:
        embedding_model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )

    return embedding_model


# ------------------------------------------
# 4. Home endpoint
# ------------------------------------------

@app.get("/")
def home():
    return {
        "message": (
            "Research Paper Intelligence Assistant API is running!"
        )
    }


# ------------------------------------------
# 5. Health check
# ------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ------------------------------------------
# 6. Upload and read a PDF
# ------------------------------------------

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    global paper_chunks, paper_index, paper_filename

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    try:
        reader = PdfReader(BytesIO(content))

        if reader.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="Password-protected PDFs are not supported.",
            )

        extracted_pages = []

        for page_number, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""

            if text.strip():
                extracted_pages.append({
                    "page": page_number,
                    "text": text,
                })

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read this PDF: {str(exc)}",
        )

    if not extracted_pages:
        raise HTTPException(
            status_code=422,
            detail=(
                "No selectable text found. "
                "This may be a scanned PDF."
            ),
        )

    # Har page ke text ko chhote chunks mein divide karo.
    new_chunks = []

    for page in extracted_pages:
        page_text = page["text"]
        chunk_size = 800
        overlap = 150
        start = 0

        while start < len(page_text):
            chunk_text = page_text[start:start + chunk_size]

            if chunk_text.strip():
                new_chunks.append({
                    "text": chunk_text,
                    "page": page["page"],
                })

            start += chunk_size - overlap

    if not new_chunks:
        raise HTTPException(
            status_code=422,
            detail="No readable text chunks found in the PDF.",
        )

    # Text chunks ke embeddings banao aur FAISS index create karo.
    try:
        model = get_embedding_model()

        texts = [chunk["text"] for chunk in new_chunks]

        embeddings = model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        embeddings = np.asarray(embeddings, dtype=np.float32)

        new_index = faiss.IndexFlatIP(embeddings.shape[1])
        new_index.add(embeddings)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not create the search index. "
                "Check model download and installed libraries. "
                f"Details: {str(exc)}"
            ),
        )

    # Naya paper successfully process hone ke baad hi save karo.
    paper_chunks = new_chunks
    paper_index = new_index
    paper_filename = file.filename

    return {
        "message": "PDF read and indexed successfully!",
        "filename": paper_filename,
        "total_pages": len(reader.pages),
        "readable_pages": len(extracted_pages),
        "total_chunks": len(paper_chunks),
        "extracted_characters": sum(
            len(page["text"]) for page in extracted_pages
        ),
        "preview": extracted_pages[0]["text"][:1000],
    }


# ------------------------------------------
# 7. Question request format
# ------------------------------------------

class QuestionRequest(BaseModel):
    question: str


# ------------------------------------------
# 8. Ask a question about the uploaded paper
# ------------------------------------------

@app.post("/ask")
def ask_question(request: QuestionRequest):
    if paper_index is None or not paper_chunks:
        raise HTTPException(
            status_code=400,
            detail="Upload a research paper before asking questions.",
        )

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )

    try:
        model = get_embedding_model()

        question_embedding = model.encode(
            [question],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        question_embedding = np.asarray(
            question_embedding,
            dtype=np.float32,
        )

        # Question se milte-julte chunks search karo.
        k = min(3, len(paper_chunks))
        scores, indices = paper_index.search(question_embedding, k)

        sources = []

        for score, index in zip(scores[0], indices[0]):
            if index < 0:
                continue

            chunk = paper_chunks[int(index)]

            sources.append({
                "page": chunk["page"],
                "text": chunk["text"],
                "similarity": round(float(score), 3),
            })

        if not sources:
            raise HTTPException(
                status_code=404,
                detail="No relevant text found in the paper.",
            )

        # Abhi retrieved text return ho raha hai.
        # Agle stage mein LLM isi context se natural-language answer banayega.
        return {
            "filename": paper_filename,
            "question": question,
            "answer": (
                "Relevant passages from your paper are shown below. "
                "Natural-language AI answer generation will be added "
                "in the next step."
            ),
            "sources": sources,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Question search failed: {str(exc)}",
        )
