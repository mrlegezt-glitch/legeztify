import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, Heart, Maximize2, Minimize2, Download, Gauge, Repeat, Shuffle } from 'lucide-react';

interface Song {
    videoId: string;
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
    streamUrl?: string; // Direct audio URL
}

interface PlayerProps {
    currentSong: Song | null;
    isPlaying: boolean;
    volume: number;
    played: number;
    duration: number;
    onPlayPause: () => void;
    onVolumeChange: (val: number) => void;
    onSeek: (val: number) => void;
    onProgress: (state: any) => void;
    onDuration: (duration: number) => void;
    onEnded: () => void;
    onDownload?: () => void;
    onLike?: () => void;
}

const Player = ({
    currentSong, isPlaying, volume, played, duration,
    onPlayPause, onVolumeChange, onSeek, onProgress, onDuration, onEnded, onDownload, onLike
}: PlayerProps) => {

    // ... (rest is same)



    // Since replace_file_content works on chunks, let's just target the Heart icon area in the Mini Player.


    const playerRef = useRef<HTMLAudioElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);

    // Sync Play/Pause
    useEffect(() => {
        if (playerRef.current) {
            if (isPlaying) playerRef.current.play().catch(e => console.error("Play error", e));
            else playerRef.current.pause();
        }
    }, [isPlaying, currentSong]);

    // Sync Volume
    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.volume = volume;
        }
    }, [volume]);

    // Sync Playback Rate
    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Sync Seek
    const handleSeekChange = (e: any) => {
        const newTime = parseFloat(e.target.value);
        onSeek(newTime);
        if (playerRef.current) {
            playerRef.current.currentTime = newTime;
        }
    };

    if (!currentSong) {
        return (
            <div className="h-[var(--player-height)] bg-[#050510]/95 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between z-40 fixed bottom-0 left-0 right-0">
                {/* Placeholder for empty state */}
                <div className="flex items-center gap-4 w-[30%] opacity-50">
                    <div className="w-14 h-14 bg-white/5 rounded-lg animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <>
            {/* MINI PLAYER (Bottom Bar) */}
            <div
                onClick={() => setIsExpanded(true)}
                className="h-[var(--player-height)] bg-[#050510]/95 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between z-40 fixed bottom-0 left-0 right-0 cursor-pointer hover:bg-white/5 transition-colors group"
            >
                {/* Left: Current Song */}
                <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
                    <img src={currentSong.thumbnail} className="h-14 w-14 rounded-lg object-cover shadow-lg border border-white/5" alt="cover" />
                    <div className="flex flex-col justify-center overflow-hidden">
                        <span className="font-bold text-sm text-white hover:underline truncate">{currentSong.title}</span>
                        <span className="text-xs text-gray-400 hover:text-white truncate">{currentSong.artist}</span>
                    </div>
                    <Heart
                        size={20}
                        className="text-pink-500 ml-2 hover:scale-110 transition-transform cursor-pointer active:scale-95"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onLike) onLike();
                        }}
                    />
                </div>

                {/* Center: Controls */}
                <div className="flex flex-col items-center gap-2 w-[40%] max-w-[600px]" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-8">
                        <button className="text-gray-400 hover:text-white transition-colors"><SkipBack size={24} fill="currentColor" /></button>
                        <button
                            onClick={onPlayPause}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-white/20"
                        >
                            {isPlaying ? <Pause size={20} fill="black" className="text-black" /> : <Play size={20} fill="black" className="text-black ml-1" />}
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors"><SkipForward size={24} fill="currentColor" /></button>
                    </div>

                    <div className="flex items-center gap-3 w-full text-xs text-gray-400 font-mono">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-cyan-400"
                                style={{ width: `${(played / (duration || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Volume & Tools */}
                <div className="flex items-center justify-end gap-3 w-[30%] min-w-[200px]" onClick={e => e.stopPropagation()}>
                    <Volume2 size={20} className="text-gray-400" />
                    <div className="w-20 group-hover:w-28 transition-all">
                        <div className="h-1.5 bg-white/10 rounded-full relative">
                            <div className="absolute top-0 left-0 h-full bg-cyan-400" style={{ width: `${volume * 100}%` }}></div>
                            <input
                                type="range"
                                min={0} max={1} step={0.01}
                                value={volume}
                                onChange={e => onVolumeChange(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                    <Maximize2 size={18} className="text-gray-400 hover:text-white cursor-pointer ml-2" onClick={() => setIsExpanded(true)} />
                </div>
            </div>

            {/* EXPANDED PLAYER OVERLAY (Astral Design) */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    {/* Close Overlay Trigger */}
                    <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />

                    <div className="relative w-full max-w-5xl bg-[#0F1123]/90 border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row gap-12 items-center" onClick={e => e.stopPropagation()}>

                        {/* Background Ambient Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

                        {/* Left: Album Art */}
                        <div className="relative group w-full md:w-[45%] aspect-square">
                            <img
                                src={currentSong.thumbnail.replace("500x500", "500x500")}
                                className="w-full h-full object-cover rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-[1.02] transition-transform duration-500"
                                alt="large cover"
                            />
                        </div>

                        {/* Right: Controls & Details */}
                        <div className="flex flex-col w-full md:w-[55%] gap-8 z-10">
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight tracking-tight shadow-black drop-shadow-lg">{currentSong.title}</h2>
                                    <p className="text-lg text-gray-400 font-medium">{currentSong.artist}</p>
                                </div>
                                <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <Minimize2 size={24} className="text-gray-400 hover:text-white" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full cursor-pointer group mt-2">
                                <div className="h-2 bg-white/10 rounded-full relative">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full relative group-hover:from-blue-400 group-hover:to-cyan-300 transition-colors"
                                        style={{ width: `${(played / (duration || 1)) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-0 group-hover:scale-100 transition-transform" />
                                    </div>
                                    <input
                                        type="range"
                                        min={0} max={duration || 0}
                                        value={played}
                                        onChange={handleSeekChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 font-mono mt-2 font-medium">
                                    <span>{new Date(played * 1000).toISOString().substr(14, 5)}</span>
                                    <span>{duration ? new Date(duration * 1000).toISOString().substr(14, 5) : "00:00"}</span>
                                </div>
                            </div>

                            {/* Main Controls */}
                            <div className="flex items-center justify-between gap-6 px-4">
                                <button className="text-gray-400 hover:text-white transition-colors hover:scale-110"><Shuffle size={24} /></button>
                                <button className="text-white hover:text-cyan-400 transition-colors hover:scale-110"><SkipBack size={36} fill="currentColor" /></button>

                                <button
                                    onClick={onPlayPause}
                                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(37,99,235,0.5)] hover:shadow-[0_10px_60px_rgba(37,99,235,0.7)] hover:scale-105 transition-all active:scale-95"
                                >
                                    {isPlaying ? <Pause size={36} fill="white" /> : <Play size={36} fill="white" className="ml-1" />}
                                </button>

                                <button className="text-white hover:text-cyan-400 transition-colors hover:scale-110"><SkipForward size={36} fill="currentColor" /></button>
                                <button className="text-gray-400 hover:text-white transition-colors hover:scale-110"><Repeat size={24} /></button>
                            </div>

                            {/* Bottom Actions: Speed | Download | Volume */}
                            <div className="flex items-center justify-between mt-4 bg-[#050510]/40 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                                {/* Speed */}
                                <div className="flex items-center gap-2 group relative">
                                    <Gauge size={18} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
                                    <select
                                        className="bg-transparent text-sm font-bold text-gray-300 outline-none cursor-pointer hover:text-white appearance-none pr-4"
                                        value={playbackRate}
                                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                                    >
                                        <option value="0.5" className="bg-gray-900">Speed: 0.5x</option>
                                        <option value="1.0" className="bg-gray-900">Speed: 1.0x</option>
                                        <option value="1.25" className="bg-gray-900">Speed: 1.25x</option>
                                        <option value="1.5" className="bg-gray-900">Speed: 1.5x</option>
                                        <option value="2.0" className="bg-gray-900">Speed: 2.0x</option>
                                    </select>
                                </div>

                                {/* Download */}
                                {onDownload && (
                                    <button
                                        onClick={() => { onDownload(); }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 hover:text-cyan-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/5 hover:border-cyan-500/30 shadow-lg hover:shadow-cyan-500/20 active:scale-95"
                                    >
                                        <Download size={16} /> Download
                                    </button>
                                )}

                                {/* Volume */}
                                <div className="flex items-center gap-3 w-32 group">
                                    <Volume2 size={18} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
                                    <div className="h-1.5 bg-white/10 rounded-full flex-1 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 h-full bg-cyan-400 group-hover:bg-cyan-300 transition-colors" style={{ width: `${volume * 100}%` }}></div>
                                        <input
                                            type="range"
                                            min={0} max={1} step={0.01}
                                            value={volume}
                                            onChange={e => onVolumeChange(parseFloat(e.target.value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Audio Player */}
            {currentSong && (
                <audio
                    ref={playerRef}
                    src={currentSong.streamUrl}
                    autoPlay={isPlaying}
                    onEnded={onEnded}
                    onTimeUpdate={(e) => {
                        onProgress({
                            playedSeconds: e.currentTarget.currentTime,
                            played: e.currentTarget.currentTime / (e.currentTarget.duration || 1),
                            loaded: 0,
                            loadedSeconds: 0
                        });
                    }}
                    onLoadedMetadata={(e) => onDuration(e.currentTarget.duration)}
                    style={{ position: 'fixed', bottom: -100, opacity: 0 }} // Hidden but active
                />
            )}
        </>
    );
};

export default Player;
