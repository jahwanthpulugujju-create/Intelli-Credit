import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReportRow {
  id: string;
  company_id: string;
  report_type: string;
  recommendation: string | null;
  created_at: string;
  company_name?: string;
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [rRes, cRes] = await Promise.all([
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('id, company_name'),
      ]);
      const companyMap = new Map((cRes.data ?? []).map(c => [c.id, c.company_name]));
      setReports((rRes.data ?? []).map(r => ({ ...r, company_name: companyMap.get(r.company_id) })));
      setLoading(false);
    };
    load();
  }, []);

  const recBadge = (rec: string | null) => {
    if (!rec) return null;
    const color = rec === 'Approve' ? 'bg-risk-low/15 text-risk-low' :
      rec === 'Conditional Approval' ? 'bg-risk-medium/15 text-risk-medium' :
      'bg-risk-high/15 text-risk-high';
    return <Badge className={`${color} border-0 text-xs`}>{rec}</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Reports</h1>
      <p className="text-muted-foreground text-sm mb-8">Generated credit assessment reports</p>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
      ) : reports.length === 0 ? (
        <div className="metric-card text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">No reports yet</h3>
          <p className="text-muted-foreground text-sm">Generate an investment report from a company's detail page to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div
              key={r.id}
              onClick={() => navigate(`/companies/${r.company_id}/report/${r.id}`)}
              className="metric-card flex items-center justify-between cursor-pointer hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">{r.company_name || 'Unknown Company'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {r.report_type === 'investment' ? 'Investment Assessment' : r.report_type} •{' '}
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {recBadge(r.recommendation)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}