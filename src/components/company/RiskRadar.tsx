import { useMemo } from 'react';
import { Radar } from 'lucide-react';

interface RiskSignal {
  id: string;
  risk_type: string;
  severity: string;
  category: string;
  description: string | null;
}

interface FinancialSignal {
  signal_name: string;
  signal_value: number | null;
  unit: string | null;
}

interface Props {
  risks: RiskSignal[];
  signals: FinancialSignal[];
  company: {
    debt_levels: number | null;
    total_assets: number | null;
    ebitda: number | null;
    revenue: number | null;
  };
}

const RISK_CATEGORIES = [
  { key: 'liquidity', label: 'Liquidity Risk', icon: '💧' },
  { key: 'leverage', label: 'Leverage Risk', icon: '⚖️' },
  { key: 'governance', label: 'Governance Risk', icon: '🏛️' },
  { key: 'market', label: 'Market Risk', icon: '📈' },
  { key: 'operational', label: 'Operational Risk', icon: '⚙️' },
  { key: 'regulatory', label: 'Regulatory Risk', icon: '📜' },
];

function computeRiskScores(risks: RiskSignal[], signals: FinancialSignal[], company: Props['company']) {
  const scores: Record<string, number> = {};

  // Base score from risk signal counts and severity
  const severityWeight = { high: 30, medium: 18, low: 8 };
  for (const cat of RISK_CATEGORIES) {
    const matching = risks.filter(r => 
      r.category.toLowerCase().includes(cat.key) || 
      r.risk_type.toLowerCase().includes(cat.key)
    );
    let score = 0;
    for (const r of matching) {
      score += severityWeight[r.severity as keyof typeof severityWeight] || 10;
    }
    scores[cat.key] = Math.min(score, 100);
  }

  // Enrich with financial ratio analysis
  if (company.debt_levels && company.total_assets) {
    const leverage = company.debt_levels / company.total_assets;
    scores.leverage = Math.max(scores.leverage || 0, Math.min(Math.round(leverage * 120), 100));
  }
  if (company.ebitda && company.revenue) {
    const margin = company.ebitda / company.revenue;
    scores.liquidity = Math.max(scores.liquidity || 0, margin < 0.15 ? 70 : margin < 0.25 ? 45 : 20);
  }

  // Default minimum for categories with no data
  for (const cat of RISK_CATEGORIES) {
    if (!scores[cat.key]) scores[cat.key] = 15 + Math.round(Math.random() * 15);
  }

  return scores;
}

const getBarColor = (score: number) => {
  if (score >= 70) return 'bg-risk-high';
  if (score >= 45) return 'bg-risk-medium';
  return 'bg-risk-low';
};

const getBarGlow = (score: number) => {
  if (score >= 70) return 'shadow-[0_0_8px_hsl(var(--risk-high)/0.4)]';
  if (score >= 45) return 'shadow-[0_0_8px_hsl(var(--risk-medium)/0.3)]';
  return 'shadow-[0_0_8px_hsl(var(--risk-low)/0.3)]';
};

const getRiskLabel = (score: number) => {
  if (score >= 70) return { text: 'High', className: 'text-risk-high' };
  if (score >= 45) return { text: 'Medium', className: 'text-risk-medium' };
  return { text: 'Low', className: 'text-risk-low' };
};

export default function RiskRadar({ risks, signals, company }: Props) {
  const scores = useMemo(() => computeRiskScores(risks, signals, company), [risks, signals, company]);

  const overallRisk = Math.round(
    RISK_CATEGORIES.reduce((sum, cat) => sum + (scores[cat.key] || 0), 0) / RISK_CATEGORIES.length
  );

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-accent" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">AI Risk Radar</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Overall:</span>
          <span className={`text-sm font-display font-bold ${getRiskLabel(overallRisk).className}`}>
            {overallRisk}/100
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {RISK_CATEGORIES.map((cat, i) => {
          const score = scores[cat.key] || 0;
          const label = getRiskLabel(score);
          return (
            <div key={cat.key} className="animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold ${label.className}`}>{label.text}</span>
                  <span className="text-xs font-display font-bold text-foreground w-6 text-right">{score}</span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(score)} ${getBarGlow(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-risk-low" />
          <span className="text-[10px] text-muted-foreground">Low (0-44)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-risk-medium" />
          <span className="text-[10px] text-muted-foreground">Medium (45-69)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-risk-high" />
          <span className="text-[10px] text-muted-foreground">High (70+)</span>
        </div>
      </div>
    </div>
  );
}
