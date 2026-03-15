import { Upload, TrendingUp, Search, Shield, Brain, CheckCircle2, Loader2 } from 'lucide-react';

interface PipelineStep {
  key: string;
  label: string;
  sublabel: string;
  icon: typeof Upload;
  completed: boolean;
  active: boolean;
}

interface Props {
  docsCount: number;
  signalsCount: number;
  risksCount: number;
  hasScore: boolean;
  reportsCount: number;
  activeStep: string | null;
}

export default function PipelineProgress({ docsCount, signalsCount, risksCount, hasScore, reportsCount, activeStep }: Props) {
  const steps: PipelineStep[] = [
    { key: 'upload', label: 'Upload', sublabel: `${docsCount} docs`, icon: Upload, completed: docsCount > 0, active: activeStep === 'upload' },
    { key: 'extract', label: 'Extract', sublabel: `${signalsCount} signals`, icon: TrendingUp, completed: signalsCount > 0, active: activeStep === 'extract' },
    { key: 'research', label: 'Research', sublabel: `${risksCount} insights`, icon: Search, completed: risksCount > 0, active: activeStep === 'research' },
    { key: 'score', label: 'Score', sublabel: hasScore ? 'Completed' : 'Pending', icon: Shield, completed: hasScore, active: activeStep === 'score' },
    { key: 'report', label: 'Report', sublabel: `${reportsCount} generated`, icon: Brain, completed: reportsCount > 0, active: activeStep === 'report' },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = (completedCount / steps.length) * 100;

  return (
    <div className="metric-card relative overflow-hidden">
      {/* Shimmer effect when active */}
      {activeStep && <div className="shimmer absolute inset-0 pointer-events-none" />}

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Underwriting Pipeline</p>
        <span className="text-xs font-display font-bold text-accent">{completedCount}/{steps.length} Complete</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-muted/60 mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
          style={{ width: `${progressPct}%`, boxShadow: '0 0 10px hsl(var(--accent) / 0.4)' }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-start justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-px bg-border/60" />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  step.active
                    ? 'bg-accent/20 ring-2 ring-accent ring-offset-2 ring-offset-background'
                    : step.completed
                      ? 'bg-accent/15'
                      : 'bg-muted/60'
                }`}
              >
                {step.active ? (
                  <Loader2 className="w-4.5 h-4.5 text-accent animate-spin" />
                ) : step.completed ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-accent" />
                ) : (
                  <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                )}
              </div>
              <span className={`text-[11px] font-medium ${step.completed || step.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
              <span className={`text-[10px] ${step.active ? 'text-accent' : 'text-muted-foreground'}`}>
                {step.active ? 'Processing...' : step.sublabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
