import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, Building2, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  company_name: string;
  sector: string;
  annual_turnover: number;
  created_at: string;
}

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('companies').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCompanies(data ?? []);
      setLoading(false);
    });
  }, []);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-2">Entity Management</p>
          <h1 className="text-3xl font-display font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Manage and analyze borrower entities in your portfolio.</p>
        </div>
        <Button onClick={() => navigate('/companies/new')} className="bg-accent text-accent-foreground hover:bg-accent/90" style={{ boxShadow: 'var(--shadow-glow-sm)' }}>
          <Plus className="w-4 h-4 mr-2" /> Onboard Company
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading entities...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="metric-card text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 mx-auto mb-4 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">No companies yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Start your credit analysis journey by onboarding your first borrower entity.</p>
          <Button onClick={() => navigate('/companies/new')} className="bg-accent text-accent-foreground hover:bg-accent/90" style={{ boxShadow: 'var(--shadow-glow-sm)' }}>
            <Plus className="w-4 h-4 mr-2" /> Onboard Company
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {companies.map((c, i) => (
            <div
              key={c.id}
              className="metric-card flex items-center justify-between cursor-pointer group animate-fade-in"
              onClick={() => navigate(`/companies/${c.id}`)}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-accent transition-colors">{c.company_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.sector} • Added {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-display font-bold text-sm">{formatCurrency(c.annual_turnover)}</p>
                  <p className="text-[10px] text-muted-foreground">Annual Turnover</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
