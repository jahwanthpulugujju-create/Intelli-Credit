import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Signal {
  id: string;
  signal_name: string;
  signal_value: number | null;
  unit: string | null;
}

const formatValue = (val: number) => {
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return String(val);
};

export default function FinancialSignalsChart({ signals }: { signals: Signal[] }) {
  const currencySignals = signals.filter(s => s.unit === 'INR' && s.signal_value != null);
  if (currencySignals.length === 0) return null;

  const data = currencySignals.map(s => ({
    name: s.signal_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: s.signal_value!,
  }));

  return (
    <div className="metric-card">
      <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Financial Signals Overview (₹)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 16%)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} tickFormatter={formatValue} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} width={120} />
          <Tooltip
            contentStyle={{ background: 'hsl(225, 25%, 10%)', border: '1px solid hsl(225, 20%, 16%)', borderRadius: 10, fontSize: 12, color: 'hsl(210, 20%, 92%)' }}
            formatter={(value: number) => [formatValue(value), 'Value']}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="hsl(174, 62%, 42%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
