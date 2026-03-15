import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CreditScore {
  character_score: number | null;
  capacity_score: number | null;
  capital_score: number | null;
  collateral_score: number | null;
  conditions_score: number | null;
}

const getColor = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 70) return 'hsl(160, 84%, 39%)';
  if (pct >= 50) return 'hsl(38, 92%, 50%)';
  return 'hsl(0, 72%, 51%)';
};

export default function FiveCsChart({ score }: { score: CreditScore }) {
  const data = [
    { name: 'Character', score: score.character_score ?? 0, max: 25 },
    { name: 'Capacity', score: score.capacity_score ?? 0, max: 25 },
    { name: 'Capital', score: score.capital_score ?? 0, max: 20 },
    { name: 'Collateral', score: score.collateral_score ?? 0, max: 15 },
    { name: 'Conditions', score: score.conditions_score ?? 0, max: 15 },
  ];

  return (
    <div className="metric-card">
      <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Score vs Maximum by Component</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 16%)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(210, 20%, 92%)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(210, 20%, 92%)' }} axisLine={false} tickLine={false} domain={[0, 25]} />
          <Tooltip
            contentStyle={{ background: 'hsl(225, 25%, 10%)', border: '1px solid hsl(225, 20%, 16%)', borderRadius: 10, fontSize: 12, color: 'hsl(210, 20%, 92%)' }}
            formatter={(value: number, name: string) => [value, name === 'score' ? 'Score' : 'Max']}
            labelStyle={{ color: 'hsl(210, 20%, 92%)' }}
          />
          <Bar dataKey="max" radius={[4, 4, 0, 0]} fill="hsl(225, 20%, 16%)" name="Max" />
          <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Score">
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.score, entry.max)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
