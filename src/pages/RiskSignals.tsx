import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface RiskSignal {
  id: string;
  risk_type: string;
  severity: string;
  category: string;
  description: string | null;
  source: string | null;
  company_id: string;
  company_name?: string;
}

export default function RiskSignals() {
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      const [risksRes, companiesRes] = await Promise.all([
        supabase.from('risk_signals').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('id, company_name'),
      ]);

      const companyMap = new Map((companiesRes.data ?? []).map(c => [c.id, c.company_name]));
      setSignals((risksRes.data ?? []).map(r => ({ ...r, company_name: companyMap.get(r.company_id) })));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filter === 'all' ? signals : signals.filter(s => s.severity === filter);

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Risk Signals</h1>
      <p className="text-muted-foreground text-sm mb-6">AI-detected risk indicators across all borrower entities</p>

      <div className="flex items-center gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {f.label} {f.value !== 'all' && `(${signals.filter(s => s.severity === f.value).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="metric-card text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No risk signals detected</h3>
          <p className="text-muted-foreground text-sm">Run secondary research on a company to generate risk signals.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="metric-card flex items-start gap-3">
              <div className={`mt-0.5 ${r.severity === 'high' ? 'text-risk-high' : r.severity === 'medium' ? 'text-risk-medium' : 'text-risk-low'}`}>
                {r.severity === 'high' ? <XCircle className="w-4 h-4" /> : r.severity === 'medium' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{r.category}</span>
                  <span className={`risk-badge-${r.severity}`}>{r.severity}</span>
                  {r.company_name && <span className="text-xs text-muted-foreground">• {r.company_name}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}