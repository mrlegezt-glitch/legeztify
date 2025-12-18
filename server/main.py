import os
import subprocess
import uuid
import shutil
import asyncio
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
from jiosaavn_client import JioSaavnClient

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = os.path.join(os.getcwd(), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Start JioSaavn client
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

async def run_direct_download(job_id: str, request: DownloadRequest):
    jobs[job_id]["status"] = "downloading"
    
    try:
        # Direct download from streamUrl
        stream_url = request.url
        if not stream_url:
            raise Exception("No stream URL provided")

        # Sanitize filename
        safe_title = "".join([c for c in request.title if c.isalpha() or c.isdigit() or c==' ']).strip()
        filename = f"{safe_title}.mp3" # It's mp4/aac usually but we name it mp3 or m4a
        # Better to check ext from url
        # ext = "m4a" if ".m4a" in stream_url else "mp3"
        # Just force mp3 naming usually works for players, but let's be technically correct or just use .m4a
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
