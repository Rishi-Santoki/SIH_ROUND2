from typing import List, Dict, Any
from supabase import Client
from app.core.embeddings import get_embedding

def retrieve_relevant_chunks(
    client: Client, 
    query: str, 
    access_level: str, 
    top_k: int = 5, 
    threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Module 4: Retrieval Function
    Shared by all copilots. Embeds the query and runs a pgvector similarity search
    against document_chunks.embedding, strictly filtering by access_level.
    """
    # 1. Embed the incoming query using the same embedding model
    query_embedding = get_embedding(query)
    
    # 2. Prepare the allowed access levels list
    allowed_access_levels = [access_level]
    # For example, if access_level == "student", we only want chunks where
    # kd.access_level IN ('student', 'all') (handled natively by the RPC)
    
    # 3. Call the rpc match_document_chunks
    try:
        res = client.rpc(
            "match_document_chunks",
            {
                "query_embedding": query_embedding,
                "match_threshold": threshold,
                "match_count": top_k,
                "allowed_access_levels": allowed_access_levels
            }
        ).execute()
        return res.data
    except Exception as e:
        print(f"RAG retrieval error: {e}")
        return []

def retrieve_curriculum_content(client: Client, skill_id: str) -> List[Dict[str, Any]]:
    """
    Module 1: Curriculum Knowledge Retrieval
    Fetches curated curriculum chunks directly for a specific skill_id without semantic search.
    """
    try:
        # Get the knowledge document for this skill curriculum
        docs_res = client.table("knowledge_documents") \
            .select("document_id") \
            .eq("document_type", "skill_curriculum") \
            .execute()
            
        doc_ids = [d["document_id"] for d in docs_res.data]
        if not doc_ids:
            return []
            
        # Get chunks that match the skill_id in metadata
        chunks_res = client.table("document_chunks") \
            .select("chunk_id, content, metadata") \
            .in_("document_id", doc_ids) \
            .execute()
            
        # Filter chunks by skill_id
        # Supabase Python client jsonb filtering can be tricky, so we filter locally
        # or we could use `.contains("metadata", {"skill_id": skill_id})`
        relevant_chunks = [
            c for c in chunks_res.data 
            if c.get("metadata", {}).get("skill_id") == skill_id
        ]
        
        return relevant_chunks
    except Exception as e:
        print(f"Curriculum retrieval error: {e}")
        return []
