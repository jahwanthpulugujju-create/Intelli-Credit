import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FiveCsChart from '@/components/company/FiveCsChart';
import FinancialSignalsChart from '@/components/company/FinancialSignalsChart';
import RiskRadar from '@/components/company/RiskRadar';
import SchemaEditor from '@/components/company/SchemaEditor';
import TriangulationView from '@/components/company/TriangulationView';
import PipelineProgress from '@/components/company/PipelineProgress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  FileText,
  Upload,
  TrendingUp,
  IndianRupee,
  BarChart3,
  Brain,
  Shield,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
  cin: string | null;
  pan: string | null;
  sector: string;
  subsector: string | null;
  headquarters: string | null;
  annual_turnover: number | null;
  total_assets: number | null;
  revenue: number | null;
  ebitda: number | null;
  debt_levels: number | null;
  loan_type: string | null;
  loan_amount: number | null;
  loan_tenure: number | null;
  interest_rate: number | null;
  purpose_of_loan: string | null;
  created_at: string;
}

interface DocStats {
  total: number;
  pending: number;
  approved: number;
  corrected: number;
  rejected: number;
  unclassified: number;
}

interface FinancialSignal {
  id: string;
  signal_name: string;
  signal_value: number | null;
  unit: string | null;
  source: string | null;
  period: string | null;
}

interface RiskSignal {
  id: string;
  risk_type: string;
  severity: string;
  category: string;
  description: string | null;
  source: string | null;
}

interface CreditScore {
  total_score: number | null;
  credit_grade: string | null;
  character_score: number | null;
  capacity_score: number | null;
  capital_score: number | null;
  collateral_score: number | null;
  conditions_score: number | null;
  reasoning: any;
}

interface Report {
  id: string;
  report_type: string;
  recommendation: string | null;
  content: any;
  created_at: string;
}

const formatCurrency = (val: number | null) => {
  if (!val) return '—';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const loanTypeLabels: Record<string, string> = {
  working_capital: 'Working Capital',
  term_loan: 'Term Loan',
  project_finance: 'Project Finance',
  trade_finance: 'Trade Finance',
  other: 'Other',
};

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [docStats, setDocStats] = useState<DocStats>({ total: 0, pending: 0, approved: 0, corrected: 0, rejected: 0, unclassified: 0 });
  const [signals, setSignals] = useState<FinancialSignal[]>([]);
  const [risks, setRisks] = useState<RiskSignal[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [researching, setResearching] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    fetchAll();
  }, [companyId]);

  const fetchAll = async () => {
    if (!companyId) return;
    const [companyRes, docsRes, signalsRes, risksRes, scoreRes, reportsRes, researchRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('documents').select('id').eq('company_id', companyId),
      supabase.from('financial_signals').select('*').eq('company_id', companyId),
      supabase.from('risk_signals').select('*').eq('company_id', companyId),
      supabase.from('credit_scores').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1),
      supabase.from('reports').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('secondary_research').select('*').eq('company_id', companyId),
    ]);

    // Deduplicate signals by signal_name (keep latest)
    const rawSignals = signalsRes.data ?? [];
    const signalMap = new Map<string, typeof rawSignals[0]>();
    for (const s of rawSignals) {
      const existing = signalMap.get(s.signal_name);
      if (!existing || s.created_at > existing.created_at) {
        signalMap.set(s.signal_name, s);
      }
    }
    setSignals(Array.from(signalMap.values()));
    setRisks(risksRes.data ?? []);
    setResearch(researchRes.data ?? []);
    setCreditScore(scoreRes.data?.[0] ?? null);
    setReports(reportsRes.data ?? []);

    // Doc stats
    const docs = docsRes.data ?? [];
    const docIds = docs.map(d => d.id);
    let classifications: { document_id: string; status: string }[] = [];
    if (docIds.length > 0) {
      const { data } = await supabase.from('document_classifications').select('document_id, status').in('document_id', docIds);
      classifications = data ?? [];
    }
    const classMap = new Map(classifications.map(c => [c.document_id, c.status]));
    setDocStats({
      total: docs.length,
      pending: classifications.filter(c => c.status === 'pending').length,
      approved: classifications.filter(c => c.status === 'approved').length,
      corrected: classifications.filter(c => c.status === 'corrected').length,
      rejected: classifications.filter(c => c.status === 'rejected').length,
      unclassified: docs.filter(d => !classMap.has(d.id)).length,
    });

    setLoading(false);
  };

  const handleExtract = async () => {
    if (!companyId) return;
    setExtracting(true); setActiveStep('extract');
    try {
      // Get approved docs
      const { data: docs } = await supabase.from('documents').select('id').eq('company_id', companyId);
      const docIds = docs?.map(d => d.id) ?? [];
      if (docIds.length === 0) { toast.error('No documents uploaded yet.'); setExtracting(false); return; }

      const { data: approved } = await supabase.from('document_classifications')
        .select('document_id').in('document_id', docIds).in('status', ['approved', 'corrected']);

      const approvedIds = approved?.map(a => a.document_id) ?? [];
      if (approvedIds.length === 0) { toast.error('No approved documents. Please review classifications first.'); setExtracting(false); return; }

      for (const docId of approvedIds) {
        await supabase.functions.invoke('extract-financial-data', {
          body: { documentId: docId, companyId },
        });
      }
      toast.success('Financial data extracted successfully.');
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || 'Extraction failed');
    }
    setExtracting(false); setActiveStep(null);
  };

  const handleResearch = async () => {
    if (!companyId) return;
    setResearching(true); setActiveStep('research');
    try {
      const { error } = await supabase.functions.invoke('research-company', { body: { companyId } });
      if (error) throw error;
      toast.success('Secondary research completed.');
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || 'Research failed');
    }
    setResearching(false); setActiveStep(null);
  };

  const handleScore = async () => {
    if (!companyId) return;
    setScoring(true); setActiveStep('score');
    try {
      const { error } = await supabase.functions.invoke('calculate-credit-score', { body: { companyId } });
      if (error) throw error;
      toast.success('Credit score calculated.');
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || 'Scoring failed');
    }
    setScoring(false); setActiveStep(null);
  };

  const handleGenerateReport = async () => {
    if (!companyId) return;
    setGenerating(true); setActiveStep('report');
    try {
      const { data, error } = await supabase.functions.invoke('generate-investment-report', {
        body: { companyId, generatedBy: user?.id },
      });
      if (error) throw error;
      toast.success('Investment report generated.');
      await fetchAll();
      if (data?.reportId) navigate(`/companies/${companyId}/report/${data.reportId}`);
    } catch (e: any) {
      toast.error(e.message || 'Report generation failed');
    }
    setGenerating(false); setActiveStep(null);
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading…</div>;
  if (!company) return <div className="text-center py-16 text-muted-foreground">Company not found.</div>;

  const debtEquity = company.debt_levels && company.total_assets
    ? (company.debt_levels / (company.total_assets - company.debt_levels)).toFixed(2) : null;
  const ebitdaMargin = company.ebitda && company.revenue
    ? ((company.ebitda / company.revenue) * 100).toFixed(1) : null;

  const reasoning = creditScore?.reasoning as Record<string, string> | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/companies')} className="shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-bold">{company.company_name}</h1>
            <Badge variant="secondary" className="text-xs">{company.sector}</Badge>
            {creditScore?.credit_grade && (
              <Badge className={`text-xs ${
                creditScore.credit_grade === 'A' ? 'bg-risk-low/15 text-risk-low border-0' :
                creditScore.credit_grade === 'B' ? 'bg-risk-medium/15 text-risk-medium border-0' :
                'bg-risk-high/15 text-risk-high border-0'
              }`}>
                Grade {creditScore.credit_grade}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[company.subsector, company.headquarters].filter(Boolean).join(' • ') || 'No details'}
            {company.cin && <span className="ml-3 text-xs opacity-60">CIN: {company.cin}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/companies/${companyId}/documents`)}>
            <Upload className="w-4 h-4 mr-2" /> Documents
          </Button>
          {reports.length > 0 && (
            <Button variant="outline" onClick={() => navigate(`/companies/${companyId}/report/${reports[0].id}`)}>
              <FileText className="w-4 h-4 mr-2" /> View Report
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Progress */}
      <PipelineProgress
        docsCount={docStats.total}
        signalsCount={signals.length}
        risksCount={risks.length}
        hasScore={!!creditScore}
        reportsCount={reports.length}
        activeStep={activeStep}
      />

      {/* Pipeline Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button onClick={handleExtract} disabled={extracting} variant="outline" className="h-auto py-3 flex-col gap-1">
          {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          <span className="text-xs">Extract Financials</span>
          {signals.length > 0 && <span className="text-[10px] text-risk-low">✓ {signals.length} signals</span>}
        </Button>
        <Button onClick={handleResearch} disabled={researching} variant="outline" className="h-auto py-3 flex-col gap-1">
          {researching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="text-xs">Secondary Research</span>
          {risks.length > 0 && <span className="text-[10px] text-risk-low">✓ {risks.length} risks</span>}
        </Button>
        <Button onClick={handleScore} disabled={scoring} variant="outline" className="h-auto py-3 flex-col gap-1">
          {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          <span className="text-xs">Credit Score</span>
          {creditScore && <span className="text-[10px] text-risk-low">✓ {creditScore.total_score}/100</span>}
        </Button>
        <Button onClick={handleGenerateReport} disabled={generating} className="h-auto py-3 flex-col gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          <span className="text-xs">Generate Report</span>
          {reports.length > 0 && <span className="text-[10px]">✓ {reports.length} report(s)</span>}
        </Button>
      </div>

      {/* Document Stats */}
      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Document Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Uploaded', value: docStats.total, color: '' },
            { label: 'Needs Review', value: docStats.pending + docStats.unclassified, color: 'text-risk-medium' },
            { label: 'Approved', value: docStats.approved, color: 'text-risk-low' },
            { label: 'Corrected', value: docStats.corrected, color: 'text-accent' },
            { label: 'Rejected', value: docStats.rejected, color: 'text-risk-high' },
          ].map(s => (
            <div key={s.label} className="metric-card text-center">
              <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        {docStats.total === 0 && (
          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> No documents uploaded yet.{' '}
            <button onClick={() => navigate(`/companies/${companyId}/documents`)} className="text-accent hover:underline font-medium">
              Upload now →
            </button>
          </p>
        )}
      </div>

      {/* Dynamic Schema Editor */}
      {companyId && <SchemaEditor companyId={companyId} />}

      {/* Credit Score */}
      {creditScore && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Credit Score — Five Cs Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="metric-card text-center md:col-span-1">
              <div className={`text-4xl font-display font-bold ${
                (creditScore.total_score ?? 0) >= 70 ? 'text-risk-low' :
                (creditScore.total_score ?? 0) >= 55 ? 'text-risk-medium' : 'text-risk-high'
              }`}>
                {creditScore.total_score}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Score</p>
              <Badge className={`mt-2 text-xs ${
                creditScore.credit_grade === 'A' ? 'bg-risk-low/15 text-risk-low border-0' :
                creditScore.credit_grade === 'B' ? 'bg-risk-medium/15 text-risk-medium border-0' :
                'bg-risk-high/15 text-risk-high border-0'
              }`}>
                {reasoning?.recommendation || creditScore.credit_grade}
              </Badge>
            </div>
            {[
              { label: 'Character', score: creditScore.character_score, max: 25 },
              { label: 'Capacity', score: creditScore.capacity_score, max: 25 },
              { label: 'Capital', score: creditScore.capital_score, max: 20 },
              { label: 'Collateral', score: creditScore.collateral_score, max: 15 },
              { label: 'Conditions', score: creditScore.conditions_score, max: 15 },
            ].map(c => {
              const pct = c.score && c.max ? (c.score / c.max) * 100 : 0;
              return (
                <div key={c.label} className="metric-card">
                  <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                  <p className="text-lg font-display font-bold">{c.score ?? 0}<span className="text-xs text-muted-foreground font-normal">/{c.max}</span></p>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${pct >= 70 ? 'bg-risk-low' : pct >= 50 ? 'bg-risk-medium' : 'bg-risk-high'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <FiveCsChart score={creditScore} />
          {reasoning && (
            <div className="metric-card mt-3">
              <p className="text-xs text-muted-foreground mb-2">AI Reasoning</p>
              <p className="text-sm">{reasoning.overall}</p>
            </div>
          )}
        </div>
      )}

      {/* Financial Signals */}
      {signals.length > 0 && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Extracted Financial Signals
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Our AI analyzed the uploaded financial documents and generated the following financial signals. Please review before finalizing the credit assessment.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {signals.map(s => (
              <div key={s.id} className="metric-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{s.signal_name}</span>
                  <span className="text-[10px] text-muted-foreground">{s.period}</span>
                </div>
                <p className="text-lg font-display font-bold">
                  {s.unit === 'INR' ? formatCurrency(s.signal_value) :
                   s.unit === 'percentage' ? `${s.signal_value}%` :
                   s.signal_value?.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.source}</p>
              </div>
            ))}
          </div>
          <FinancialSignalsChart signals={signals} />
        </div>
      )}

      {/* Risk Signals */}
      {risks.length > 0 && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Risk Signals
          </h2>
          <div className="space-y-2">
            {risks.map(r => (
              <div key={r.id} className="metric-card flex items-start gap-3">
                <div className={`mt-0.5 ${r.severity === 'high' ? 'text-risk-high' : r.severity === 'medium' ? 'text-risk-medium' : 'text-risk-low'}`}>
                  {r.severity === 'high' ? <XCircle className="w-4 h-4" /> : r.severity === 'medium' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold">{r.category}</span>
                    <span className={`risk-badge-${r.severity}`}>{r.severity}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  {r.source && <p className="text-[10px] text-muted-foreground mt-1">{r.source}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* AI Risk Radar */}
      {(risks.length > 0 || signals.length > 0) && company && (
        <RiskRadar risks={risks} signals={signals} company={company} />
      )}

      {/* Data Triangulation */}
      {(signals.length > 0 || risks.length > 0) && (
        <TriangulationView signals={signals} risks={risks} research={research} />
      )}

      {/* Financial Snapshot */}
      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Financial Snapshot
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Annual Turnover', value: formatCurrency(company.annual_turnover) },
            { label: 'Revenue', value: formatCurrency(company.revenue) },
            { label: 'EBITDA', value: formatCurrency(company.ebitda) },
            { label: 'Total Assets', value: formatCurrency(company.total_assets) },
          ].map(item => (
            <div key={item.label} className="metric-card">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <p className="text-lg font-display font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          <div className="metric-card">
            <span className="text-xs text-muted-foreground">Debt Levels</span>
            <p className="text-lg font-display font-bold mt-1">{formatCurrency(company.debt_levels)}</p>
          </div>
          <div className="metric-card">
            <span className="text-xs text-muted-foreground">Debt/Equity Ratio</span>
            <p className="text-lg font-display font-bold mt-1">{debtEquity ?? '—'}</p>
          </div>
          <div className="metric-card">
            <span className="text-xs text-muted-foreground">EBITDA Margin</span>
            <p className="text-lg font-display font-bold mt-1">{ebitdaMargin ? `${ebitdaMargin}%` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Loan Request */}
      {company.loan_type && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <IndianRupee className="w-4 h-4" /> Loan Request
          </h2>
          <div className="metric-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Loan Type</span>
                <p className="text-sm font-semibold mt-0.5">{loanTypeLabels[company.loan_type] || company.loan_type}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Amount</span>
                <p className="text-sm font-semibold mt-0.5">{formatCurrency(company.loan_amount)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Tenure</span>
                <p className="text-sm font-semibold mt-0.5">{company.loan_tenure ? `${company.loan_tenure} months` : '—'}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Interest Rate</span>
                <p className="text-sm font-semibold mt-0.5">{company.interest_rate ? `${company.interest_rate}%` : '—'}</p>
              </div>
            </div>
            {company.purpose_of_loan && (
              <div className="mt-3">
                <span className="text-xs text-muted-foreground">Purpose</span>
                <p className="text-sm mt-0.5">{company.purpose_of_loan}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
