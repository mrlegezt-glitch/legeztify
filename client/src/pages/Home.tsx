import { useEffect, useState } from 'react';
import axios from 'axios';
import SongCard from '../components/SongCard';
import { Sparkles, TrendingUp } from 'lucide-react';

interface Song {
    videoId: string;
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
}

interface HomeProps {
    onPlay: (song: Song) => void;
    onDownload: (song: Song) => void;
    category: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Home = ({ onPlay, onDownload, category }: HomeProps) => {
    const [trending, setTrending] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharts = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/api/charts`, { params: { category } });
                setTrending(res.data);
            } catch (err) {
                console.error("Failed to fetch charts", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCharts();
    }, [category]);

    return (
        <div className="flex flex-col gap-10">
            {/* Hero Section */}
            <div className="relative h-[300px] rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-black z-0" />
                <img
                    src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2670&auto=format&fit=crop"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                    alt="Hero"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] to-transparent" />

                <div className="relative z-10 h-full flex flex-col justify-end p-10">
                    <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold tracking-wider text-sm uppercase">
                        <Sparkles size={16} />
                        <span>Featured Collection</span>
                    </div>
                    <h1 className="text-5xl font-black mb-4 text-white leading-tight">
                        Cosmic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Journeys</span>
                    </h1>
                    <p className="text-gray-300 max-w-xl text-lg">
                        Experience soundscapes that transcend boundaries. Curated for the explorers of the sonic universe.
                    </p>
                </div>
            </div>

            {/* Trending Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="text-purple-500" />
                    <h2 className="text-2xl font-bold text-white">Trending Now</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {trending.map(song => (
                            <SongCard
                                key={song.videoId}
                                song={song}
                                onPlay={() => onPlay(song)}
                                onDownload={() => onDownload(song)}
                            />
                        ))}
                        {trending.length === 0 && (
                            <p className="text-gray-500 col-span-full">No trending music found. Try searching instead.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
