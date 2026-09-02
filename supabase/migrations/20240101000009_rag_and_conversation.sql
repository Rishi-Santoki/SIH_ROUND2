-- Migration 9: RAG and Conversation Tables

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  document_type VARCHAR,
  source VARCHAR,
  file_url TEXT,
  uploaded_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  access_level VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE document_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(document_id) ON DELETE CASCADE,
  content TEXT,
  chunk_index INTEGER,
  embedding VECTOR(1536), -- assuming typical openai embeddings size
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE chat_history (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_id UUID,
  role VARCHAR,
  message TEXT,
  created_at TIMESTAMP DEFAULT now()
);
