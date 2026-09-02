-- Migration 22: RAG Matching RPC and Index

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    allowed_access_levels text[]
)
RETURNS TABLE (
    chunk_id uuid,
    document_id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.chunk_id,
        dc.document_id,
        dc.content,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    JOIN knowledge_documents kd ON dc.document_id = kd.document_id
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
      AND (kd.access_level = ANY(allowed_access_levels) OR kd.access_level = 'all')
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
