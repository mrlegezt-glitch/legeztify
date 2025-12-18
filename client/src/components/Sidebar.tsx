import { Home, Search, Library, PlusSquare, Heart, Music } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
    activeTab: 'home' | 'search' | 'library';
    onTabChange: (tab: 'home' | 'search' | 'library') => void;
    selectedCategory: string;
    onSelectCategory: (cat: string) => void;
}

const CATEGORIES = [
    { id: 'all', label: 'All Trends' },
    { id: 'phonk', label: 'Phonk' },
    { id: 'bollywood', label: 'Bollywood' },
    { id: 'old', label: 'Old Classics' },
    { id: 'hollywood', label: 'Hollywood' },
    { id: 'japanese', label: 'Japanese' },
    { id: 'punjabi', label: 'Punjabi' },
    { id: 'lofi', label: 'Lofi Beats' },
];

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <div
        onClick={onClick}
        className={clsx(
            "flex items-center gap-4 cursor-pointer transition-all h-12 px-4 font-semibold text-sm rounded-lg mb-1",
            active
                ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border-l-4 border-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
        )}
    >
        <Icon size={22} className={active ? "text-cyan-400" : ""} />
        <span>{label}</span>
    </div>
);

const Sidebar = ({ activeTab, onTabChange, selectedCategory, onSelectCategory }: SidebarProps) => {
    return (
        <div className="w-[var(--sidebar-width)] bg-[var(--color-bg-light)] flex flex-col p-6 h-full border-r border-white/5 z-20 overflow-y-auto custom-scrollbar">
            {/* Logo */}
            <div className="flex items-center gap-3 px-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Music size={24} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white italic">
                    LEGEZTIFY
                </h1>
            </div>

            {/* Navigation */}
            <div className="flex flex-col gap-2 mb-8">
                <SidebarItem
                    icon={Home}
                    label="Home"
                    active={activeTab === 'home'}
                    onClick={() => onTabChange('home')}
                />
                <SidebarItem
                    icon={Search}
                    label="Search"
                    active={activeTab === 'search'}
                    onClick={() => onTabChange('search')}
                />
                <SidebarItem
                    icon={Library}
                    label="Your Library"
                    active={activeTab === 'library'}
                    onClick={() => onTabChange('library')}
                />
            </div>

            {/* Categories Section */}
            <div className="mb-6">
                <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Explore Genres</h3>
                <div className="flex flex-col gap-1">
                    {CATEGORIES.map(cat => (
                        <div
                            key={cat.id}
                            onClick={() => {
                                onTabChange('home');
                                onSelectCategory(cat.id);
                            }}
                            className={clsx(
                                "flex items-center gap-3 cursor-pointer transition-all h-10 px-4 text-sm rounded-lg",
                                selectedCategory === cat.id
                                    ? "bg-white/10 text-cyan-400 font-bold border-r-2 border-cyan-400"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span className={clsx("w-1.5 h-1.5 rounded-full transition-colors", selectedCategory === cat.id ? "bg-cyan-400 shadow-[0_0_8px_cyan]" : "bg-gray-700")} />
                            <span>{cat.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Collections */}
            <div className="mb-4 mt-auto">
                <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">My Collections</h3>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4 cursor-pointer hover:bg-white/5 text-gray-400 hover:text-white h-12 px-4 font-semibold text-sm rounded-lg transition-colors">
                        <PlusSquare size={22} />
                        <span>Create Playlist</span>
                    </div>
                    <div className="flex items-center gap-4 cursor-pointer hover:bg-white/5 text-gray-400 hover:text-white h-12 px-4 font-semibold text-sm rounded-lg transition-colors">
                        <Heart size={22} className="text-pink-500" />
                        <span>Liked Songs</span>
                    </div>
                </div>
            </div>

            {/* Decorative box */}
            <div className="glass-panel p-4 rounded-xl mt-4 border border-white/5">
                <p className="text-xs text-gray-400 mb-2 font-mono">Listening on Legeztify Web</p>
                <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-2/3 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
