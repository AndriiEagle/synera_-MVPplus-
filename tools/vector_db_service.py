import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import faiss
import os
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Synera Vector DB", description="Local NVIDIA/CPU Vector Memory for C14.L5")

# Initialize model
try:
    # Use a small, fast model for MVP+
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Warning: could not load sentence-transformers. Using dummy embeddings. Error: {e}")
    model = None

# Initialize FAISS index
EMBEDDING_DIM = 384 # Dimension for all-MiniLM-L6-v2
INDEX_PATH = os.path.join(os.path.dirname(__file__), '.index.faiss')
ID_MAP_PATH = os.path.join(os.path.dirname(__file__), '.index.ids')

# We use IndexFlatIP (Inner Product) with normalized vectors for Cosine Similarity
if os.path.exists(INDEX_PATH):
    index = faiss.read_index(INDEX_PATH)
else:
    index = faiss.IndexIDMap(faiss.IndexFlatIP(EMBEDDING_DIM))

class EmbedRequest(BaseModel):
    documents: List[str]
    ids: List[str] # UUIDs

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

@app.post("/embed")
async def embed_documents(req: EmbedRequest):
    if len(req.documents) != len(req.ids):
        raise HTTPException(status_code=400, detail="Mismatched documents and ids")
    
    if not model:
        raise HTTPException(status_code=500, detail="SentenceTransformer model not loaded")

    # Generate embeddings
    embeddings = model.encode(req.documents, convert_to_numpy=True)
    faiss.normalize_L2(embeddings)
    
    # Hash UUIDs to Int64 for FAISS
    # For MVP+, we store a mapping or just use deterministic integer hashes
    import hashlib
    int_ids = []
    id_mapping = {}
    for uid in req.ids:
        # Create a stable 64-bit int from UUID
        hashed = int(hashlib.sha256(uid.encode('utf-8')).hexdigest(), 16) % (2**63 - 1)
        int_ids.append(hashed)
        id_mapping[hashed] = uid
    
    # Add to FAISS
    index.add_with_ids(embeddings, np.array(int_ids, dtype=np.int64))
    faiss.write_index(index, INDEX_PATH)
    
    # Save ID mapping
    with open(ID_MAP_PATH, 'a', encoding='utf-8') as f:
        for int_id, uid in id_mapping.items():
            f.write(f"{int_id},{uid}\n")

    return {"status": "success", "added": len(req.documents)}

@app.post("/search")
async def search_documents(req: SearchRequest):
    if not model:
        raise HTTPException(status_code=500, detail="SentenceTransformer model not loaded")
        
    query_vector = model.encode([req.query], convert_to_numpy=True)
    faiss.normalize_L2(query_vector)
    
    distances, indices = index.search(query_vector, req.top_k)
    
    # Load ID mapping to return UUIDs instead of int hashes
    id_mapping = {}
    if os.path.exists(ID_MAP_PATH):
        with open(ID_MAP_PATH, 'r', encoding='utf-8') as f:
            for line in f:
                if ',' in line:
                    int_id, uid = line.strip().split(',', 1)
                    id_mapping[int(int_id)] = uid

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx != -1:
            results.append({
                "id": id_mapping.get(int(idx), str(idx)),
                "score": float(dist)
            })
            
    return {"results": results}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
