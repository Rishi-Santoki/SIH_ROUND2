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
