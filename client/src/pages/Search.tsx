import { useState, useEffect } from 'react';
import axios from 'axios';
import SongCard from '../components/SongCard';
import { Search as SearchIcon, Music } from 'lucide-react';

interface Song {
    videoId: string;
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
}

interface SearchProps {
    onPlay: (song: Song) => void;
    onDownload: (song: Song) => void;
    initialQuery?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Search = ({ onPlay, onDownload, initialQuery = '' }: SearchProps) => {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<Song[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            handleSearch(null, initialQuery);
        }
    }, [initialQuery]);

    // Predictive Search (Debounce)
    useEffect(() => {
        if (query.length >= 3) {
            const timer = setTimeout(() => {
                handleSearch(null, query);
            }, 600); // 600ms debounce
            return () => clearTimeout(timer);
        }
    }, [query]);

    const handleSearch = async (e?: React.FormEvent | null, qOverride?: string) => {
        if (e) e.preventDefault();
        const q = qOverride || query;
        if (!q) return;

        setSearching(true);
        try {
            const res = await axios.get(`${API_BASE}/api/search`, { params: { query: q } });
            setResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 min-h-full">
            {/* Search Bar */}
            <div className="sticky top-0 z-10 bg-[#050510]/95 backdrop-blur-xl py-4 -mx-8 px-8 border-b border-white/5">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 bg-[#1e1e2e] px-5 py-4 rounded-full border border-white/5 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all">
                        <SearchIcon className="text-gray-400 group-focus-within:text-white" size={20} />
                        <form onSubmit={handleSearch} className="flex-1">
                            <input
                                className="bg-transparent border-none outline-none text-base font-medium w-full placeholder-gray-500 text-white"
                                placeholder="What do you want to listen to?"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                autoFocus
                            />
                        </form>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                {!results.length && !searching ? (
                    <div className="flex flex-col items-center justify-center mt-20 opacity-30 gap-6">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                            <Music size={40} />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold mb-2">Start Searching</h2>
                            <p className="text-sm">Find your favorite artists, songs, and albums.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            {searching ? 'Searching...' : 'Top Results'}
                            {searching && <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            {results.map((song) => (
                                <SongCard
                                    key={song.videoId}
                                    song={song}
                                    onPlay={() => onPlay(song)}
                                    onDownload={() => onDownload(song)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Search;
