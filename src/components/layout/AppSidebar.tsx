import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Upload,
  BarChart3,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
} from 'lucide-react';
import logoImg from '@/assets/logo.png';

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Companies', icon: Building2, path: '/companies' },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { label: 'Documents', icon: FileText, path: '/upload' },
      { label: 'Analysis', icon: BarChart3, path: '/analysis' },
      { label: 'Risk Signals', icon: AlertTriangle, path: '/risk-signals' },
    ],
  },
  {
    label: 'Output',
    items: [
      { label: 'Reports', icon: FileText, path: '/reports' },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, hasRole } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[260px] flex flex-col z-40 border-r border-border/40"
      style={{ background: 'hsl(var(--sidebar-bg))' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden">
          <img src={logoImg} alt="IntelliCredit" className="w-9 h-9 object-contain" />
          <div className="absolute inset-0 rounded-xl animate-glow-pulse" style={{ boxShadow: '0 0 15px hsl(var(--accent) / 0.3)' }} />
        </div>
        <div>
          <h1 className="font-display text-[15px] font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Intelli-Credit
          </h1>
          <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Credit Intelligence
          </p>
        </div>
      </div>

      <div className="mx-4 mb-2 h-px" style={{ background: 'hsl(var(--border))' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-5">
        {navSections.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`sidebar-link w-full group ${active ? 'active' : ''}`}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {active && <ChevronRight className="w-3 h-3 opacity-50" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {hasRole('admin') && (
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              System
            </p>
            <button
              onClick={() => navigate('/admin')}
              className={`sidebar-link w-full ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <Shield className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1 text-left">Admin</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`sidebar-link w-full ${location.pathname === '/settings' ? 'active' : ''}`}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1 text-left">Settings</span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4">
        <div className="mx-1 mb-3 h-px" style={{ background: 'hsl(var(--border))' }} />
        <button
          onClick={() => navigate('/settings')}
          className="sidebar-link w-full"
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </button>
        <button
          onClick={signOut}
          className="sidebar-link w-full"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
