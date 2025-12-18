from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import uuid
import requests
from mangum import Mangum

import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Helper to fix imports if running locally vs vercel
try:
    from jiosaavn_client import JioSaavnClient
except ImportError:
    try:
        from api.jiosaavn_client import JioSaavnClient
    except ImportError:
        # Last resort: try to find it in root
        sys.path.append(os.path.join(current_dir, '..'))
        from api.jiosaavn_client import JioSaavnClient

app = FastAPI()

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "backend": "active"}

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handle Read-Only Filesystem (Vercel)
try:
    DOWNLOAD_DIR = os.path.join(os.getcwd(), "downloads")
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
except OSError:
    # Fallback to /tmp for Vercel/Lambda
    DOWNLOAD_DIR = os.path.join("/tmp", "downloads")
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Start JioSaavn client
try:
    jio_client = JioSaavnClient()
except NameError:
    # Fallback if import failed locally
    from api.jiosaavn_client import JioSaavnClient
    jio_client = JioSaavnClient()

# Store job status
jobs: Dict[str, dict] = {}

class DownloadRequest(BaseModel):
    url: str # This expects the streamUrl now
    title: str
    artist: str
    thumbnail: str

class SearchResult(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    thumbnail: str
    videoId: str # We keep this key for frontend compat, but it holds Jio ID
    streamUrl: Optional[str] = None

@app.get("/api/search", response_model=List[SearchResult])
async def search_music(query: str):
    try:
        results = jio_client.search_songs(query)
        serialized_results = []
        
        for r in results:
            serialized_results.append(SearchResult(
                title=r.get('title', 'Unknown'),
                artist=r.get('artist', ''),
                album=r.get('album', ''),
                thumbnail=r.get('thumbnail', ''),
                videoId=r.get('id'), # Compat
                streamUrl=r.get('streamUrl')
            ))
            
        return serialized_results
    except Exception as e:
        print(f"Search Error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@app.get("/api/recommendations/{song_id}", response_model=List[SearchResult])
async def get_recommendations(song_id: str):
    try:
        results = jio_client.get_recommendations(song_id)
        serialized_results = []
        
        for r in results:
            serialized_results.append(SearchResult(
                title=r.get('title', 'Unknown'),
                artist=r.get('artist', ''),
                album=r.get('album', ''),
                thumbnail=r.get('thumbnail', ''),
                videoId=r.get('id'), 
                streamUrl=r.get('streamUrl')
            ))
            
        return serialized_results
    except Exception as e:
        print(f"Rec Error: {e}")
        return []

async def run_direct_download(job_id: str, request: DownloadRequest):
    jobs[job_id]["status"] = "downloading"
    
    try:
        # Direct download from streamUrl
        stream_url = request.url
        if not stream_url:
            raise Exception("No stream URL provided")

        safe_title = "".join([c for c in request.title if c.isalpha() or c.isdigit() or c==' ']).strip()
        filename = f"{safe_title}.mp3" 
        final_filename = f"{job_id}_{filename}"
        final_path = os.path.join(DOWNLOAD_DIR, final_filename)

        # Download stream
        response = requests.get(stream_url, stream=True)
        response.raise_for_status()
        
        with open(final_path, 'wb') as f:
             for chunk in response.iter_content(chunk_size=8192):
                 f.write(chunk)
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["file"] = final_filename
        jobs[job_id]["progress"] = 100
        
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        print(f"Download Error: {e}")

@app.post("/api/download")
async def start_download(request: DownloadRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    # Initial status is 'queued'
    jobs[job_id] = {"status": "queued", "progress": 0, "file": None, "error": None}
    
    background_tasks.add_task(run_direct_download, job_id, request)
    
    return {"job_id": job_id}

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.get("/api/files/{filename}")
async def get_file(filename: str):
    file_path = os.path.join(DOWNLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@app.get("/api/charts", response_model=List[SearchResult])
async def get_charts(category: str = "all"):
    try:
        results = jio_client.get_charts(category)
        serialized_results = []
        
        for r in results:
            serialized_results.append(SearchResult(
                title=r.get('title', 'Unknown'),
                artist=r.get('artist', ''),
                album=r.get('album', ''),
                thumbnail=r.get('thumbnail', ''),
                videoId=r.get('id'), # Compat
                streamUrl=r.get('streamUrl')
            ))
            
        return serialized_results
    except Exception as e:
        print(f"Charts Error: {e}")
        return []

# Vercel Handler
handler = Mangum(app)
