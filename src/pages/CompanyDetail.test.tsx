import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CompanyDetail from './CompanyDetail';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ companyId: 'company-1' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'analyst-1' } }) }));
vi.mock('@/components/company/FiveCsChart', () => ({ default: () => null }));
vi.mock('@/components/company/FinancialSignalsChart', () => ({ default: () => null }));
vi.mock('@/components/company/RiskRadar', () => ({ default: () => null }));
vi.mock('@/components/company/SchemaEditor', () => ({ default: () => null }));
vi.mock('@/components/company/TriangulationView', () => ({ default: () => null }));
vi.mock('@/components/company/PipelineProgress', () => ({ default: () => null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const result = { data: table === 'companies' ? {
        id: 'company-1', company_name: 'Example Manufacturing', sector: 'Manufacturing',
        annual_turnover: 1000000, total_assets: 2000000, revenue: 1000000,
        ebitda: 100000, debt_levels: 200000, created_at: '2026-01-01',
      } : [], error: null };
      const query = {
        select: () => query, eq: () => query, order: () => query,
        limit: () => query, single: () => Promise.resolve(result),
        then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
      };
      return query;
    },
  },
}));

describe('company detail loading', () => {
  it('shows the company returned by the backend instead of the not-found state', async () => {
    render(<CompanyDetail />);
    expect(await screen.findByText('Example Manufacturing')).toBeTruthy();
    expect(screen.queryByText('Company not found.')).toBeNull();
  });
});
