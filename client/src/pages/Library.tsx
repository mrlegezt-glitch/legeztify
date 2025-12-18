import { useEffect, useState } from 'react';
import { supabase, FavoriteSong } from '../lib/supabase';
import { Play, Trash2 } from 'lucide-react';

interface LibraryProps {
    onPlay: (song: any) => void;
}

const Library = ({ onPlay }: LibraryProps) => {
    const [songs, setSongs] = useState<FavoriteSong[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLibrary = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching library:", error);
        } else {
            setSongs(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLibrary();
    }, []);

    const handleDelete = async (e: any, id: number) => {
        e.stopPropagation();
        if (!confirm("Remove from library?")) return;

        const { error } = await supabase.from('favorites').delete().eq('id', id);
        if (!error) {
            setSongs(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Your Library</span>
                <span className="text-sm font-normal text-gray-500 bg-white/10 px-3 py-1 rounded-full">{songs.length} Songs</span>
            </h2>

            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div>
            ) : songs.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl mb-2">It's empty here.</p>
                    <p className="text-sm">Click the Heart icon on any song to add it!</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-cyan-400 underline">Refresh</button>
                </div>
            ) : (
                <div className="space-y-2">
                    {songs.map((song) => (
                        <div
                            key={song.id}
                            onClick={() => onPlay({
                                videoId: song.video_id,
                                title: song.title,
                                artist: song.artist,
                                thumbnail: song.thumbnail,
                                streamUrl: song.stream_url
                            })}
                            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                        >
                            <img src={song.thumbnail} className="w-12 h-12 rounded-lg object-cover" alt={song.title} />
                            <div className="flex-1">
                                <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{song.title}</h4>
                                <p className="text-xs text-gray-400">{song.artist}</p>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, song.id!)}
                                className="p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-cyan-400 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-lg shadow-cyan-400/20">
                                <Play size={20} fill="black" className="ml-0.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Library;
