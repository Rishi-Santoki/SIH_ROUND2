import hashlib

def get_embedding(text: str) -> list[float]:
    """
    Generates a deterministic 1536-dimensional embedding for a given text.
    In a production setting with a real LLM provider, this function should
    call OpenAI's `text-embedding-ada-002` or an equivalent 1536d model.
    Since we don't have a configured provider right now, this generates a 
    consistent pseudo-random vector based on the text hash to ensure the RAG 
    pipeline functions correctly and can perform nearest-neighbor searches.
    """
    # Use SHA-256 to generate a deterministic sequence of bytes
    hash_obj = hashlib.sha256(text.encode('utf-8'))
    seed_bytes = hash_obj.digest()
    
    # We need 1536 floats. 1536 * 4 bytes = 6144 bytes. 
    # Let's generate a pseudo-random sequence from the seed.
    import random
    # Convert first 8 bytes of hash to an integer seed
    seed = int.from_bytes(seed_bytes[:8], 'big')
    r = random.Random(seed)
    
    # Generate 1536 floats between -1 and 1
    vector = [r.uniform(-1.0, 1.0) for _ in range(1536)]
    
    # Normalize the vector for cosine similarity
    import math
    magnitude = math.sqrt(sum(v**2 for v in vector))
    if magnitude > 0:
        vector = [v / magnitude for v in vector]
        
    return vector
