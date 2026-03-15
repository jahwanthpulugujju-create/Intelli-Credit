import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Building2, FileText, AlertTriangle, Plus, Shield, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Stats {
  companies: number;
  documents: number;
  reports: number;
  avgScore: number;
}

interface RiskDist {
  name: string;
  value: number;
  color: string;
}

interface RecentCompany {
  id: string;
  company_name: string;
  sector: string;
  created_at: string;
  credit_grade?: string | null;
  total_score?: number | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ companies: 0, documents: 0, reports: 0, avgScore: 0 });
  const [riskDist, setRiskDist] = useState<RiskDist[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);

  useEffect(() => {
    const load = async () => {
      const [cRes, dRes, rRes, scoresRes, risksRes] = await Promise.all([
        supabase.from('companies').select('id, company_name, sector, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('credit_scores').select('company_id, total_score, credit_grade'),
        supabase.from('risk_signals').select('severity'),
      ]);

      const companies = cRes.data ?? [];
      const scores = scoresRes.data ?? [];
      const risks = risksRes.data ?? [];

      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + (s.total_score || 0), 0) / scores.length)
        : 0;

      setStats({
        companies: companies.length,
        documents: dRes.count ?? 0,
        reports: rRes.count ?? 0,
        avgScore,
      });

      const low = risks.filter(r => r.severity === 'low').length;
      const medium = risks.filter(r => r.severity === 'medium').length;
      const high = risks.filter(r => r.severity === 'high').length;
      setRiskDist([
        { name: 'Low Risk', value: low, color: 'hsl(160, 84%, 39%)' },
        { name: 'Medium Risk', value: medium, color: 'hsl(38, 92%, 50%)' },
        { name: 'High Risk', value: high, color: 'hsl(0, 72%, 51%)' },
      ].filter(r => r.value > 0));

      const scoreMap = new Map(scores.map(s => [s.company_id, s]));
      setRecentCompanies(companies.map(c => ({
        ...c,
        credit_grade: scoreMap.get(c.id)?.credit_grade,
        total_score: scoreMap.get(c.id)?.total_score,
      })));
    };
    load();
  }, []);

  const statCards = [
    { label: 'Companies Analyzed', value: stats.companies, icon: Building2, accent: true },
    { label: 'Documents Processed', value: stats.documents, icon: FileText },
    { label: 'Reports Generated', value: stats.reports, icon: FileText },
    { label: 'Avg Credit Score', value: stats.avgScore || '—', icon: Shield, highlight: true },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent mb-2">Command Center</p>
          <h1 className="text-3xl font-display font-bold tracking-tight">Credit Intelligence Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Real-time overview of your underwriting pipeline and portfolio health.</p>
        </div>
        <Button onClick={() => navigate('/companies/new')} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg" style={{ boxShadow: 'var(--shadow-glow-sm)' }}>
          <Plus className="w-4 h-4 mr-2" /> New Company
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`glow-card shimmer ${card.accent ? 'ring-1 ring-accent/20' : ''}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.accent ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-3xl font-display font-bold ${card.highlight && typeof card.value === 'number' ? (card.value >= 70 ? 'text-risk-low' : card.value >= 55 ? 'text-risk-medium' : 'text-risk-high') : ''}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Risk Distribution */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-risk-medium" /> Risk Distribution
            </h2>
          </div>
          {riskDist.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={riskDist} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} strokeWidth={0}>
                    {riskDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {riskDist.map(r => (
                  <div key={r.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}40` }} />
                      <span className="text-sm text-muted-foreground">{r.name}</span>
                    </div>
                    <span className="text-sm font-display font-bold">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No risk signals detected yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Run the analysis pipeline to detect risks.</p>
            </div>
          )}
        </div>

        {/* Recent Companies */}
        <div className="metric-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" /> Recent Entities
            </h2>
            <button onClick={() => navigate('/companies')} className="text-xs text-accent hover:underline font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {recentCompanies.length > 0 ? (
            <div className="space-y-1">
              {recentCompanies.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/companies/${c.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Building2 className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-accent transition-colors">{c.company_name}</p>
                      <p className="text-xs text-muted-foreground">{c.sector}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {c.credit_grade ? (
                      <span className={`risk-badge-${(c.total_score ?? 0) >= 70 ? 'low' : (c.total_score ?? 0) >= 55 ? 'medium' : 'high'}`}>
                        {c.credit_grade} • {c.total_score}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pending</span>
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-accent/10 mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm font-medium mb-1">No companies yet</p>
              <p className="text-xs text-muted-foreground mb-4">Start by onboarding your first borrower entity.</p>
              <Button onClick={() => navigate('/companies/new')} variant="outline" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Onboard Company
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
