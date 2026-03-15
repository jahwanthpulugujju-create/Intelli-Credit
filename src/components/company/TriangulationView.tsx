import { ArrowRight, FileText, Globe, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface FinancialSignal {
  id: string;
  signal_name: string;
  signal_value: number | null;
  unit: string | null;
  source: string | null;
}

interface RiskSignal {
  id: string;
  severity: string;
  category: string;
  description: string | null;
  source: string | null;
}

interface SecondaryResearch {
  id: string;
  research_type: string;
  content: string | null;
  severity: string | null;
  source: string | null;
}

interface Props {
  signals: FinancialSignal[];
  risks: RiskSignal[];
  research: SecondaryResearch[];
}

const formatCurrency = (val: number | null) => {
  if (!val) return '—';
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
};

function matchSignalToResearch(signal: FinancialSignal, risks: RiskSignal[], research: SecondaryResearch[]) {
  const name = signal.signal_name.toLowerCase();

  // Find matching risk signals
  const matchedRisks = risks.filter(r => {
    const desc = (r.description || '').toLowerCase();
    const cat = r.category.toLowerCase();
    return desc.includes(name) || cat.includes(name) ||
      (name.includes('debt') && (desc.includes('debt') || desc.includes('leverage') || cat.includes('financial'))) ||
      (name.includes('revenue') && (desc.includes('revenue') || desc.includes('growth') || desc.includes('turnover'))) ||
      (name.includes('ebitda') && (desc.includes('ebitda') || desc.includes('margin') || desc.includes('profit'))) ||
      (name.includes('asset') && (desc.includes('asset') || cat.includes('financial'))) ||
      (name.includes('cash') && (desc.includes('cash') || desc.includes('liquidity')));
  });

  // Find matching research
  const matchedResearch = research.filter(r => {
    const content = (r.content || '').toLowerCase();
    const type = r.research_type.toLowerCase();
    return content.includes(name) ||
      (name.includes('debt') && (content.includes('debt') || content.includes('borrowing') || content.includes('leverage'))) ||
      (name.includes('revenue') && (content.includes('revenue') || content.includes('growth') || content.includes('sales'))) ||
      (name.includes('ebitda') && (content.includes('profit') || content.includes('margin'))) ||
      (name.includes('asset') && content.includes('asset')) ||
      (name.includes('cash') && (content.includes('cash') || content.includes('liquidity')));
  });

  return { matchedRisks, matchedResearch };
}

function getConfidenceLevel(hasRisks: boolean, hasResearch: boolean): { label: string; color: string; icon: typeof CheckCircle2 } {
  if (hasRisks && hasResearch) return { label: 'Triangulated', color: 'text-risk-low', icon: CheckCircle2 };
  if (hasRisks || hasResearch) return { label: 'Partially Verified', color: 'text-risk-medium', icon: AlertTriangle };
  return { label: 'Unverified', color: 'text-muted-foreground', icon: XCircle };
}

export default function TriangulationView({ signals, risks, research }: Props) {
  const currencySignals = signals.filter(s => s.unit === 'INR' && s.signal_value != null);
  if (currencySignals.length === 0 && risks.length === 0) return null;

  return (
    <div className="metric-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <Globe className="w-3.5 h-3.5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Data Triangulation</p>
          <p className="text-[10px] text-muted-foreground">Cross-referencing extracted data with secondary research</p>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_120px] gap-3 mb-2 px-3">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <FileText className="w-3 h-3" /> Extracted Data
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Globe className="w-3 h-3" /> Secondary Research
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Risk Insight
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Confidence</span>
      </div>

      <div className="space-y-1">
        {currencySignals.slice(0, 8).map((signal, i) => {
          const { matchedRisks, matchedResearch } = matchSignalToResearch(signal, risks, research);
          const confidence = getConfidenceLevel(matchedRisks.length > 0, matchedResearch.length > 0);
          const ConfIcon = confidence.icon;

          return (
            <div
              key={signal.id}
              className="grid grid-cols-[1fr_1fr_1fr_120px] gap-3 items-start px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors animate-fade-in border-b border-border/20 last:border-0"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Extracted Data */}
              <div>
                <p className="text-xs font-medium text-foreground">{signal.signal_name}</p>
                <p className="text-sm font-display font-bold text-accent mt-0.5">
                  {formatCurrency(signal.signal_value)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{signal.source}</p>
              </div>

              {/* Secondary Research */}
              <div>
                {matchedResearch.length > 0 ? (
                  matchedResearch.slice(0, 1).map(r => (
                    <div key={r.id}>
                      <p className="text-xs text-foreground line-clamp-2">{r.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.source || r.research_type}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No matching research</p>
                )}
              </div>

              {/* Risk Insight */}
              <div>
                {matchedRisks.length > 0 ? (
                  matchedRisks.slice(0, 1).map(r => (
                    <div key={r.id} className="flex items-start gap-1.5">
                      <span className={`risk-badge-${r.severity} mt-0.5 shrink-0`}>{r.severity}</span>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No risk flags</p>
                )}
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-1.5 justify-end">
                <ConfIcon className={`w-3.5 h-3.5 ${confidence.color}`} />
                <span className={`text-[10px] font-semibold ${confidence.color}`}>{confidence.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-risk-low" />
          <span className="text-[10px] text-muted-foreground">
            {currencySignals.filter(s => {
              const { matchedRisks, matchedResearch } = matchSignalToResearch(s, risks, research);
              return matchedRisks.length > 0 && matchedResearch.length > 0;
            }).length} Triangulated
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-risk-medium" />
          <span className="text-[10px] text-muted-foreground">
            {currencySignals.filter(s => {
              const { matchedRisks, matchedResearch } = matchSignalToResearch(s, risks, research);
              return (matchedRisks.length > 0) !== (matchedResearch.length > 0);
            }).length} Partial
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {currencySignals.filter(s => {
              const { matchedRisks, matchedResearch } = matchSignalToResearch(s, risks, research);
              return matchedRisks.length === 0 && matchedResearch.length === 0;
            }).length} Unverified
          </span>
        </div>
      </div>
    </div>
  );
}
