import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompanyWithScore {
  id: string;
  company_name: string;
  sector: string;
  hasSignals: boolean;
  hasScore: boolean;
  totalScore: number | null;
  creditGrade: string | null;
}

export default function Analysis() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cRes, sigRes, scRes] = await Promise.all([
        supabase.from('companies').select('id, company_name, sector').order('created_at', { ascending: false }),
        supabase.from('financial_signals').select('company_id'),
        supabase.from('credit_scores').select('company_id, total_score, credit_grade'),
      ]);

      const signalSet = new Set((sigRes.data ?? []).map(s => s.company_id));
      const scoreMap = new Map((scRes.data ?? []).map(s => [s.company_id, s]));

      setCompanies((cRes.data ?? []).map(c => ({
        ...c,
        hasSignals: signalSet.has(c.id),
        hasScore: scoreMap.has(c.id),
        totalScore: scoreMap.get(c.id)?.total_score ?? null,
        creditGrade: scoreMap.get(c.id)?.credit_grade ?? null,
      })));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Analysis</h1>
      <p className="text-muted-foreground text-sm mb-8">AI-powered credit analysis and scoring for your borrower entities</p>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : companies.length === 0 ? (
        <div className="metric-card text-center py-16">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No companies to analyze</h3>
          <p className="text-muted-foreground text-sm mb-4">Onboard a company and upload documents to begin credit analysis.</p>
          <Button onClick={() => navigate('/companies/new')} className="bg-accent text-accent-foreground hover:bg-accent/90">Get Started</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/companies/${c.id}`)}
              className="metric-card flex items-center justify-between cursor-pointer hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{c.company_name}</h3>
                  <p className="text-sm text-muted-foreground">{c.sector}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {c.hasSignals && <span className="risk-badge-low">Signals ✓</span>}
                {c.hasScore ? (
                  <span className={`risk-badge-${c.totalScore && c.totalScore >= 70 ? 'low' : c.totalScore && c.totalScore >= 55 ? 'medium' : 'high'}`}>
                    {c.creditGrade} ({c.totalScore}/100)
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not scored</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
