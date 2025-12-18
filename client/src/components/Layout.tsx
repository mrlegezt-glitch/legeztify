import { ReactNode } from 'react';

interface LayoutProps {
    sidebar: ReactNode;
    player: ReactNode;
    children: ReactNode;
    header?: ReactNode;
}

const Layout = ({ sidebar, player, children, header }: LayoutProps) => {
    return (
        <div className="flex h-screen w-screen bg-[var(--color-bg)] text-white overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Sidebar Area */}
            <aside className="h-full flex-shrink-0 z-30 hidden md:block">
                {sidebar}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative bg-[#050510]">
                {/* Background Ambient Glow */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[100px] rounded-full pointer-events-none" />

                {header && (
                    <div className="sticky top-0 z-20 px-8 py-4 bg-[#050510]/80 backdrop-blur-md border-b border-white/5">
                        {header}
                    </div>
                )}

                <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-32 z-10">
                    {children}
                </main>

                {/* Player Area */}
                {player}
            </div>
        </div>
    );
};

export default Layout;
