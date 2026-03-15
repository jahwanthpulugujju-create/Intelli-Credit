import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Zap, BarChart3, FileText } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { toast } from 'sonner';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        await signUp(email, password, fullName);
        toast.success('Account created! Check your email to verify.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: FileText, label: 'AI Document Ingestion', desc: 'Auto-classify financial documents' },
    { icon: BarChart3, label: 'Credit Scoring Engine', desc: 'Five Cs model with AI reasoning' },
    { icon: Zap, label: 'Instant Reports', desc: 'Generate investment memos in seconds' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — hero */}
      <div className="hidden lg:flex lg:w-[55%] items-center justify-center relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(225 30% 6%), hsl(225 25% 10%), hsl(225 30% 6%))' }} />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]" style={{ background: 'hsl(var(--accent))' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]" style={{ background: 'hsl(174 62% 60%)' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 px-16 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center relative overflow-hidden">
              <img src={logoImg} alt="IntelliCredit" className="w-11 h-11 object-contain" />
              <div className="absolute inset-0 rounded-xl animate-glow-pulse" style={{ boxShadow: '0 0 25px hsl(var(--accent) / 0.4)' }} />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">Intelli-Credit</h1>
              <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Credit Intelligence Platform</p>
            </div>
          </div>

          <h2 className="font-display text-4xl font-bold leading-tight text-foreground mb-4">
            Transform documents into
            <span className="text-accent accent-glow"> credit decisions</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed mb-10">
            AI-powered enterprise credit underwriting. From raw financial documents to actionable investment reports — in minutes, not weeks.
          </p>

          {/* Feature pills */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={f.label} className="glass-card !p-3.5 flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(hsl(var(--accent)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="w-full max-w-[380px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img src={logoImg} alt="IntelliCredit" className="w-10 h-10 object-contain" />
            </div>
            <span className="font-display text-xl font-bold">Intelli-Credit</span>
          </div>

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-2">
              {isLogin ? 'Welcome back' : 'Get started'}
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              {isLogin ? 'Access your credit intelligence dashboard.' : 'Start analyzing companies in minutes.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full Name</Label>
                <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required className="h-11 bg-muted/50 border-border/60 focus:border-accent focus:ring-accent/20" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="analyst@company.com" required className="h-11 bg-muted/50 border-border/60 focus:border-accent focus:ring-accent/20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 bg-muted/50 border-border/60 focus:border-accent focus:ring-accent/20" />
            </div>
            <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold mt-2" disabled={loading} style={{ boxShadow: 'var(--shadow-glow-sm)' }}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-accent hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
