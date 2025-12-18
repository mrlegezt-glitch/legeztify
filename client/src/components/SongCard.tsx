import { Play, Download } from 'lucide-react';

interface Song {
    videoId: string;
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
    duration?: string;
}

interface SongCardProps {
    song: Song;
    onPlay: () => void;
    onDownload: () => void;
}

const SongCard = ({ song, onPlay, onDownload }: SongCardProps) => {
    return (
        <div className="p-4 rounded-xl glass hover:bg-white/10 transition-all group cursor-pointer flex flex-col gap-3 relative overflow-hidden">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg mb-1 group-hover:shadow-2xl transition-shadow">
                <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlay(); }}
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
                    >
                        <Play fill="black" className="text-black ml-1" size={24} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-1 min-h-[50px] z-10">
                <h3 className="font-bold text-white truncate text-base leading-tight group-hover:text-cyan-400 transition-colors">{song.title}</h3>
                <p className="text-sm text-gray-400 truncate">{song.artist}</p>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                className="mt-auto w-full py-2.5 bg-white/5 hover:bg-white/20 border border-white/10 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide z-10 backdrop-blur-sm"
            >
                <Download size={14} /> Download
            </button>
        </div>
    );
};

export default SongCard;
