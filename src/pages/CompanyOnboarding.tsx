import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, BarChart3, CreditCard, Check } from 'lucide-react';

const steps = [
  { label: 'Entity Details', icon: Building2 },
  { label: 'Financial Snapshot', icon: BarChart3 },
  { label: 'Loan Request', icon: CreditCard },
];

const sectors = ['Banking', 'Manufacturing', 'IT & Services', 'Pharmaceuticals', 'Energy', 'Infrastructure', 'FMCG', 'Telecom', 'Automotive', 'Real Estate', 'Other'];

export default function CompanyOnboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    company_name: '', cin: '', pan: '', sector: '', subsector: '', headquarters: '', annual_turnover: '',
    total_assets: '', revenue: '', ebitda: '', debt_levels: '',
    loan_type: '', loan_amount: '', loan_tenure: '', interest_rate: '', purpose_of_loan: '',
  });

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('companies').insert({
        ...form,
        annual_turnover: parseFloat(form.annual_turnover) || 0,
        total_assets: parseFloat(form.total_assets) || 0,
        revenue: parseFloat(form.revenue) || 0,
        ebitda: parseFloat(form.ebitda) || 0,
        debt_levels: parseFloat(form.debt_levels) || 0,
        loan_amount: parseFloat(form.loan_amount) || 0,
        loan_tenure: parseInt(form.loan_tenure) || 0,
        interest_rate: parseFloat(form.interest_rate) || 0,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('Company onboarded successfully!');
      navigate('/companies');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Onboard Company</h1>
      <p className="text-muted-foreground text-sm mb-8">Enter borrower details to begin credit analysis</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                i < step ? 'bg-accent text-accent-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="metric-card">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="section-title mb-4">Entity Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Company Name *</Label><Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Acme Corp Ltd" /></div>
              <div><Label>CIN</Label><Input value={form.cin} onChange={e => set('cin', e.target.value)} placeholder="L17110MH1973PLC019786" /></div>
              <div><Label>PAN</Label><Input value={form.pan} onChange={e => set('pan', e.target.value)} placeholder="AAACR1234A" /></div>
              <div>
                <Label>Sector *</Label>
                <Select value={form.sector} onValueChange={v => set('sector', v)}>
                  <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                  <SelectContent>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subsector</Label><Input value={form.subsector} onChange={e => set('subsector', e.target.value)} placeholder="Specialty Chemicals" /></div>
              <div><Label>Headquarters</Label><Input value={form.headquarters} onChange={e => set('headquarters', e.target.value)} placeholder="Mumbai, India" /></div>
              <div><Label>Annual Turnover (₹)</Label><Input type="number" value={form.annual_turnover} onChange={e => set('annual_turnover', e.target.value)} placeholder="50000000" /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="section-title mb-4">Financial Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Total Assets (₹)</Label><Input type="number" value={form.total_assets} onChange={e => set('total_assets', e.target.value)} placeholder="100000000" /></div>
              <div><Label>Revenue (₹)</Label><Input type="number" value={form.revenue} onChange={e => set('revenue', e.target.value)} placeholder="50000000" /></div>
              <div><Label>EBITDA (₹)</Label><Input type="number" value={form.ebitda} onChange={e => set('ebitda', e.target.value)} placeholder="8000000" /></div>
              <div><Label>Debt Levels (₹)</Label><Input type="number" value={form.debt_levels} onChange={e => set('debt_levels', e.target.value)} placeholder="20000000" /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="section-title mb-4">Loan Request</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Loan Type *</Label>
                <Select value={form.loan_type} onValueChange={v => set('loan_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term_loan">Term Loan</SelectItem>
                    <SelectItem value="working_capital">Working Capital</SelectItem>
                    <SelectItem value="project_finance">Project Finance</SelectItem>
                    <SelectItem value="trade_finance">Trade Finance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Loan Amount (₹) *</Label><Input type="number" value={form.loan_amount} onChange={e => set('loan_amount', e.target.value)} placeholder="10000000" /></div>
              <div><Label>Tenure (months)</Label><Input type="number" value={form.loan_tenure} onChange={e => set('loan_tenure', e.target.value)} placeholder="36" /></div>
              <div><Label>Interest Rate (%)</Label><Input type="number" step="0.1" value={form.interest_rate} onChange={e => set('interest_rate', e.target.value)} placeholder="9.5" /></div>
              <div className="md:col-span-2"><Label>Purpose of Loan</Label><Input value={form.purpose_of_loan} onChange={e => set('purpose_of_loan', e.target.value)} placeholder="Expansion of manufacturing capacity" /></div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            Previous
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={step === 0 && (!form.company_name || !form.sector)}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading || !form.loan_type || !form.loan_amount}>
              {loading ? 'Submitting...' : 'Create Company'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
