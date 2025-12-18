import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library'; // New Import

// --- Types ---
interface Song {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  duration?: string;
  streamUrl?: string; // Direct audio URL
}

interface DownloadJob {
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'error';
  progress: number;
  file?: string;
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library'>('home');
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);

  // Download State
  const [jobs, setJobs] = useState<{ [key: string]: DownloadJob }>({});
  const [activeDownloads, setActiveDownloads] = useState<string[]>([]);

  // --- Handlers ---

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const startDownload = async (song: Song) => {
    try {
      const downloadPayload = {
        url: song.streamUrl || "",
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail
      };

      if (!downloadPayload.url) {
        console.error("No stream URL available for download (JioSaavn ID only)");
        if (!song.streamUrl) {
          alert("Cannot download this song (No Stream URL). Try searching again.");
          return;
        }
      }

      const res = await axios.post(`${API_BASE}/api/download`, downloadPayload);

      const jobId = res.data.job_id;
      setJobs(prev => ({ ...prev, [jobId]: { status: 'queued', progress: 0 } }));
      setActiveDownloads(prev => [...prev, jobId]);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleSongEnd = async () => {
    // ALGORITHM: Fetch recommendation based on current song
    if (!currentSong) {
      setIsPlaying(false);
      return;
    }

    try {
      console.log("Fetching recommendation for:", currentSong.title);
      const res = await axios.get(`${API_BASE}/api/recommendations/${currentSong.videoId}`);
      const nextSongs = res.data;

      if (nextSongs && nextSongs.length > 0) {
        // Filter out current song to prevent repeat loop
        const next = nextSongs.find((s: Song) => s.videoId !== currentSong.videoId && s.title !== currentSong.title) || nextSongs[0];

        const songObj: Song = {
          videoId: next.videoId,
          title: next.title,
          artist: next.artist,
          album: next.album,
          thumbnail: next.thumbnail,
          streamUrl: next.streamUrl
        };

        console.log("Auto-playing next:", songObj.title);
        setCurrentSong(songObj);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch (e) {
      console.error("Auto-play failed", e);
      setIsPlaying(false);
    }
  };

  // Poll for download status
  useEffect(() => {
    if (activeDownloads.length === 0) return;

    const interval = setInterval(async () => {
      for (const jobId of activeDownloads) {
        try {
          const res = await axios.get(`${API_BASE}/api/status/${jobId}`);
          setJobs(prev => ({ ...prev, [jobId]: res.data }));

          if (['completed', 'failed', 'error'].includes(res.data.status)) {
            setActiveDownloads(prev => prev.filter(id => id !== jobId));
          }
        } catch (err) {
          console.error(err);
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeDownloads]);

  const saveFile = (filename: string) => {
    window.open(`${API_BASE}/api/files/${filename}`, '_blank');
  };

  return (
    <>
      <Layout
        sidebar={
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        }
        player={
          <Player
            currentSong={currentSong}
            isPlaying={isPlaying}
            volume={volume}
            played={played}
            duration={duration}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onVolumeChange={setVolume}
            onSeek={(val) => setPlayed(val)}
            onProgress={({ playedSeconds }) => setPlayed(playedSeconds)}
            onDuration={setDuration}
            onEnded={handleSongEnd}
            onDownload={() => currentSong && startDownload(currentSong)}
          />
        }
      >
        {activeTab === 'home' && (
          <Home
            onPlay={handlePlay}
            onDownload={startDownload}
            category={selectedCategory}
          />
        )}
        {activeTab === 'search' && <Search onPlay={handlePlay} onDownload={startDownload} />}
        {activeTab === 'library' && <Library onPlay={handlePlay} />}
      </Layout>

      {/* Download Toasts */}
      <div className="fixed bottom-[110px] right-8 flex flex-col gap-2 z-50 pointer-events-none">
        {Object.entries(jobs).map(([id, job]) => (
          <div key={id} className="pointer-events-auto bg-[#1e1e2e]/90 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-white/10 w-80 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-start mb-2">
              <span className={
                job.status === 'completed' ? 'text-green-400 font-bold' :
                  job.status === 'failed' || job.status === 'error' ? 'text-red-400 font-bold' :
                    'text-cyan-400 font-bold'
              }>{job.status.toUpperCase()}</span>
              {job.status === 'completed' && (
                <button onClick={() => saveFile(job.file!)} className="text-xs bg-green-500 text-black px-3 py-1 rounded-full font-bold hover:scale-105">SAVE</button>
              )}
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${job.status === 'completed' ? 'bg-green-500' : 'bg-cyan-400'}`}
                style={{ width: `${job.progress}%` }}>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
