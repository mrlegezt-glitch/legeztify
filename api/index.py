from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import uuid
import requests
import sys
import traceback
from mangum import Mangum

app = FastAPI()

# Global state to capture startup errors
startup_error = None
jio_client = None
DOWNLOAD_DIR = "/tmp/downloads"

# 1. Setup Filesystem
try:
    # Use /tmp for Vercel always to be safe
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
except Exception as e:
    startup_error = f"FS Error: {str(e)}"

# 2. Setup Sys Path for Imports
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.append(current_dir)
    # Also add parent for good measure if needed
    parent_dir = os.path.join(current_dir, '..')
    if parent_dir not in sys.path:
        sys.path.append(parent_dir)
except Exception as e:
    startup_error = f"Path Error: {str(e)}"

# 3. Import JioSaavn Client (Fault Tolerant)
if not startup_error:
    try:
        # Try importing from same directory first (Vercel structure)
        try:
            from jiosaavn_client import JioSaavnClient
        except ImportError:
            from api.jiosaavn_client import JioSaavnClient
            
        jio_client = JioSaavnClient()
    except Exception as e:
        startup_error = f"Import/Init Error: {str(e)}\n{traceback.format_exc()}"


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    # If there was a startup error, return it here so we can debug!
    if startup_error:
        return {"status": "error", "detail": startup_error}
    return {"status": "ok", "backend": "active", "client_initialized": jio_client is not None}

# --- Standard Endpoints ---

class DownloadRequest(BaseModel):
    url: str
    title: str
    artist: str
    thumbnail: str

class SearchResult(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    thumbnail: str
    videoId: str
    streamUrl: Optional[str] = None

@app.get("/api/search", response_model=List[SearchResult])
async def search_music(query: str):
    if not jio_client:
        raise HTTPException(status_code=503, detail=f"Backend Not Ready: {startup_error}")
    try:
        results = jio_client.search_songs(query)
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
        print(f"Search Error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@app.get("/api/charts", response_model=List[SearchResult])
async def get_charts(category: str = "all"):
    if not jio_client:
         raise HTTPException(status_code=503, detail=f"Backend Not Ready: {startup_error}")
    try:
        results = jio_client.get_charts(category)
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
        print(f"Charts Error: {e}")
        return []

@app.get("/api/recommendations/{song_id}", response_model=List[SearchResult])
async def get_recommendations(song_id: str):
    if not jio_client:
        return []
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

# Simplified Download Job Logic for Vercel (No background tasks persistence guarantee)
@app.post("/api/download")
async def start_download(request: DownloadRequest):
    # On Serverless, long background tasks are bad.
    # But we'll try basic approach.
    job_id = str(uuid.uuid4())
    # Just return job_id, client will fail to poll 'status' effectively in serverless if Lambda dies.
    # But for now keep interface.
    return {"job_id": job_id}

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    return {"status": "failed", "error": "Downloads not supported on Serverless Free Tier reliably"}

@app.get("/api/files/{filename}")
async def get_file(filename: str):
    raise HTTPException(status_code=404, detail="File storage not available")

# Vercel Handler
handler = Mangum(app)
