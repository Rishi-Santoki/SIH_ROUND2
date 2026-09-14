from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from supabase import Client
from typing import List, Optional
import re
from app.dependencies import get_current_super_admin, get_service_client
from app.models.super_admin_schemas import KnowledgeDocumentCreateText
from app.core.embeddings import get_embedding

router = APIRouter(prefix="/admin/knowledge-base", tags=["Knowledge Base Ingestion"])

# Helper: simple token/word chunking respecting paragraphs and sentences
def chunk_text(text: str, max_words: int = 300, overlap_words: int = 50) -> List[str]:
    # Split by paragraphs
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for p in paragraphs:
        # If paragraph is very long, split by sentences
        sentences = re.split(r'(?<=[.!?])\s+', p)
        for s in sentences:
            words = s.split()
            if not words:
                continue
            
            if current_length + len(words) > max_words and current_chunk:
                # Store current chunk
                chunks.append(" ".join(current_chunk))
                # Create overlap
                overlap = []
                overlap_len = 0
                for w in reversed(current_chunk):
                    if overlap_len + 1 > overlap_words:
                        break
                    overlap.insert(0, w)
                    overlap_len += 1
                current_chunk = overlap + words
                current_length = overlap_len + len(words)
            else:
                current_chunk.extend(words)
                current_length += len(words)
                
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks

# Background Task for Embedding
def process_embeddings_background(document_id: str):
    client = get_service_client()
    # Fetch chunks without embedding
    res = client.table("document_chunks").select("*").eq("document_id", document_id).is_("embedding", "null").execute()
    
    for chunk in res.data:
        # Embed the content
        embedding = get_embedding(chunk["content"])
        # Update row
        client.table("document_chunks").update({"embedding": embedding}).eq("chunk_id", chunk["chunk_id"]).execute()

@router.post("/documents")
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form(...),
    access_level: str = Form(...),
    source: Optional[str] = Form("uploaded_file"),
    admin: dict = Depends(get_current_super_admin)
):
    """Module 1: Document Upload (reuses storage service conceptually, but processes content for RAG)"""
    client = admin["client"]
    
    # We should read the file to chunk it. Since it's unstructured text/markdown:
    try:
        content = file.file.read().decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Only text/markdown files are supported for ingestion.")
    
    # 1. Store in DB
    insert_data = {
        "title": title,
        "document_type": document_type,
        "source": source,
        "access_level": access_level,
        "uploaded_by": admin["user_id"]
    }
    doc_res = client.table("knowledge_documents").insert(insert_data).execute()
    doc_id = doc_res.data[0]["document_id"]
    
    # 2. Chunking (Module 2)
    chunks = chunk_text(content)
    
    chunk_inserts = []
    for idx, c in enumerate(chunks):
        chunk_inserts.append({
            "document_id": doc_id,
            "content": c,
            "chunk_index": idx,
            "metadata": {"title": title, "document_type": document_type}
        })
        
    if chunk_inserts:
        client.table("document_chunks").insert(chunk_inserts).execute()
        
    # 3. Embedding (Module 3 - background)
    background_tasks.add_task(process_embeddings_background, doc_id)
    
    return {"message": "Document uploaded and chunking initiated.", "document_id": doc_id, "chunk_count": len(chunks)}

@router.post("/documents/text")
def add_text_document(
    data: KnowledgeDocumentCreateText,
    background_tasks: BackgroundTasks,
    admin: dict = Depends(get_current_super_admin)
):
    client = admin["client"]
    
    insert_data = {
        "title": data.title,
        "document_type": data.document_type,
        "source": data.source,
        "access_level": data.access_level,
        "uploaded_by": admin["user_id"]
    }
    doc_res = client.table("knowledge_documents").insert(insert_data).execute()
    doc_id = doc_res.data[0]["document_id"]
    
    chunks = chunk_text(data.content)
    
    chunk_inserts = []
    for idx, c in enumerate(chunks):
        chunk_inserts.append({
            "document_id": doc_id,
            "content": c,
            "chunk_index": idx,
            "metadata": {"title": data.title, "document_type": data.document_type}
        })
        
    if chunk_inserts:
        client.table("document_chunks").insert(chunk_inserts).execute()
        
    background_tasks.add_task(process_embeddings_background, doc_id)
    
    return {"message": "Text document ingested.", "document_id": doc_id, "chunk_count": len(chunks)}

@router.get("/documents")
def list_documents(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("knowledge_documents").select("*, document_chunks(count)").execute()
    return res.data

@router.delete("/documents/{document_id}")
def delete_document(document_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    client.table("knowledge_documents").delete().eq("document_id", document_id).execute()
    return {"message": "Document and cascading chunks deleted."}

@router.post("/documents/{document_id}/embed")
def trigger_embedding(document_id: str, background_tasks: BackgroundTasks, admin: dict = Depends(get_current_super_admin)):
    """Manually trigger embedding for missing chunks."""
    background_tasks.add_task(process_embeddings_background, document_id)
    return {"message": "Embedding background task triggered."}

@router.post("/seed")
def seed_knowledge_base(background_tasks: BackgroundTasks, admin: dict = Depends(get_current_super_admin)):
    """Module 5: Seed Content"""
    client = admin["client"]
    
    seeds = [
        {
            "title": "What is an FDP?",
            "content": "A Faculty Development Program (FDP) is a structured training program designed to enhance the academic and research skills of educators. It typically lasts between 1 to 2 weeks and differs from a guest lecture by providing hands-on, intensive workshops and certification upon completion.",
            "access_level": "all",
            "document_type": "faq"
        },
        {
            "title": "Internship vs. Apprenticeship vs. Job",
            "content": "An internship is typically a short-term, entry-level opportunity for students to gain practical experience, often lasting 3 to 6 months. An apprenticeship is a formal, longer-term earn-while-you-learn arrangement tied to a specific trade or skill set, often lasting 1 to 3 years. A full-time job is a permanent employment contract for graduated candidates.",
            "access_level": "all",
            "document_type": "platform_glossary"
        },
        {
            "title": "What counts as verified evidence?",
            "content": "The Trust Layer validates student skills using several vectors: standardized platform assessment results, admin-approved certifications and project portfolios, and direct mentor validation from authenticated industry professionals.",
            "access_level": "all",
            "document_type": "faq"
        },
        {
            "title": "How does the match score work?",
            "content": "The Explainable Matching Engine computes an aggregate suitability score weighted across multiple dimensions: 40% for verified skills match against the digital twin, 20% for relevant experience, 15% for standardized assessment performance, 10% for educational background, and 15% for portfolio strength.",
            "access_level": "all",
            "document_type": "faq"
        },
        {
            "title": "Consultancy vs. Industrial Training listings",
            "content": "A consultancy listing indicates an academician offering expert problem-solving or advisory services to an industry partner for a fee. An industrial training listing indicates the academician is seeking or offering specialized training programs designed to align industry workers with cutting-edge academic research.",
            "access_level": "academician",
            "document_type": "guide"
        },
        {
            "title": "How institution verification works",
            "content": "When a new institution registers, their status is set to 'pending'. A Super Admin must review their submitted credentials and accreditation documents via the verification_requests queue. Once approved, the institution gains full access to post interventions and view aggregate analytics.",
            "access_level": "institution",
            "document_type": "policy"
        }
    ]
    
    seeded_count = 0
    for s in seeds:
        # Idempotency check
        existing = client.table("knowledge_documents").select("document_id").eq("title", s["title"]).execute()
        if not existing.data:
            doc_res = client.table("knowledge_documents").insert({
                "title": s["title"],
                "content": s["content"], # For simple tracking, though content lives in chunks mostly
                "document_type": s["document_type"],
                "source": "seed",
                "access_level": s["access_level"],
                "uploaded_by": admin["user_id"]
            }).execute()
            
            doc_id = doc_res.data[0]["document_id"]
            
            # Chunk and embed synchronously for immediate availability
            chunks = chunk_text(s["content"])
            chunk_inserts = []
            for idx, c in enumerate(chunks):
                emb = get_embedding(c)
                chunk_inserts.append({
                    "document_id": doc_id,
                    "content": c,
                    "chunk_index": idx,
                    "metadata": {"title": s["title"], "document_type": s["document_type"]},
                    "embedding": emb
                })
            if chunk_inserts:
                client.table("document_chunks").insert(chunk_inserts).execute()
                
            seeded_count += 1
            
    return {"message": f"Seeded {seeded_count} knowledge base entries."}

@router.get("/test-query")
def test_query(q: str, access_level: str, admin: dict = Depends(get_current_super_admin)):
    """Module 6: Ingestion Quality Check"""
    from app.core.rag import retrieve_relevant_chunks
    client = admin["client"]
    chunks = retrieve_relevant_chunks(client, query=q, access_level=access_level, top_k=3)
    return chunks
