import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-[260px] min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border/40 backdrop-blur-xl px-8 py-3.5 flex items-center justify-between" style={{ background: 'hsl(var(--background) / 0.8)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" style={{ boxShadow: '0 0 6px hsl(var(--accent) / 0.5)' }} />
            <span className="text-xs text-muted-foreground font-medium tracking-wide">System Online</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-2">
              <p className="text-xs font-medium text-foreground">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">Credit Analyst</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent text-xs font-bold ring-1 ring-accent/20">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
