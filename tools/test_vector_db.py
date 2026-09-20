import requests
import time
import uuid

def main():
    base_url = "http://127.0.0.1:8001"
    
    # Check if DB is running
    try:
        requests.get(base_url)
    except requests.exceptions.ConnectionError:
        print("Vector DB is not running. Please start it with `python tools/vector_db_service.py`")
        return
        
    docs = ["I need help with product design and frontend development", "Looking for B2B sales automation"]
    ids = [str(uuid.uuid4()), str(uuid.uuid4())]
    
    # 1. Embed
    start = time.time()
    res = requests.post(f"{base_url}/embed", json={"documents": docs, "ids": ids})
    print(f"Embed took: {(time.time() - start)*1000:.2f}ms. Response: {res.json()}")
    
    # 2. Search
    start = time.time()
    res = requests.post(f"{base_url}/search", json={"query": "frontend design", "top_k": 1})
    elapsed = (time.time() - start)*1000
    print(f"Search took: {elapsed:.2f}ms. Response: {res.json()}")
    
    if elapsed > 50:
        print(f"WARNING: Search latency {elapsed:.2f}ms is greater than 50ms constraint.")
    else:
        print("Latency is within < 50ms limit.")

if __name__ == "__main__":
    main()
