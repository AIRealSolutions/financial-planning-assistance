import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Plan {
  id: string;
  title: string;
  planType: string;
  status: string;
  clientId: string;
  createdAt: string;
}

interface Portfolio {
  id: string;
  accountType: string;
  totalValue: number;
  riskScore?: number;
  status: string;
  createdAt: string;
}

interface Statistics {
  totalPlans: number;
  activePlans: number;
  totalPortfolios: number;
  totalAssetsUnderManagement: number;
}

export default function Planning() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stats, setStats] = useState<Statistics>({ totalPlans: 0, activePlans: 0, totalPortfolios: 0, totalAssetsUnderManagement: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch statistics
      const [plansStatsRes, portfoliosStatsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning/stats/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/planning/stats/portfolios`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (plansStatsRes.ok && portfoliosStatsRes.ok) {
        const plansStats = await plansStatsRes.json();
        const portfoliosStats = await portfoliosStatsRes.json();

        setStats({
          totalPlans: plansStats.data.totalPlans,
          activePlans: plansStats.data.activePlans,
          totalPortfolios: portfoliosStats.data.totalPortfolios,
          totalAssetsUnderManagement: portfoliosStats.data.totalAssetsUnderManagement,
        });
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Financial Advisor AI</h1>
            <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Financial Planning</h2>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b mb-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'portfolios', label: 'Portfolios' },
              { id: 'plans', label: 'Plans' },
              { id: 'simulations', label: 'Simulations' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="card">
                    <p className="text-gray-600 text-sm">Total Plans</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPlans}</p>
                    <p className="text-xs text-green-600 mt-2">{stats.activePlans} active</p>
                  </div>
                  <div className="card">
                    <p className="text-gray-600 text-sm">Total Portfolios</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPortfolios}</p>
                  </div>
                  <div className="card">
                    <p className="text-gray-600 text-sm">Assets Under Management</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAssetsUnderManagement)}</p>
                  </div>
                  <div className="card">
                    <p className="text-gray-600 text-sm">Average AUM per Portfolio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPortfolios > 0
                        ? formatCurrency(stats.totalAssetsUnderManagement / stats.totalPortfolios)
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link href="/planning/portfolios" className="btn btn-primary py-2 text-center">
                      Add Portfolio
                    </Link>
                    <Link href="/planning/plans" className="btn btn-primary py-2 text-center">
                      Create Plan
                    </Link>
                    <Link href="/planning/simulations" className="btn btn-secondary py-2 text-center">
                      Run Simulation
                    </Link>
                    <button className="btn btn-secondary py-2">Generate Report</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Portfolios Tab */}
        {activeTab === 'portfolios' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Portfolios</h3>
              <Link href="/planning/portfolios" className="btn btn-primary px-4 py-2">
                + Add Portfolio
              </Link>
            </div>
            <div className="card text-center py-12 text-gray-600">
              <p>Select a client from the clients page to manage their portfolios</p>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Financial Plans</h3>
              <Link href="/planning/plans" className="btn btn-primary px-4 py-2">
                + Create Plan
              </Link>
            </div>
            <div className="card text-center py-12 text-gray-600">
              <p>Select a client from the clients page to create their financial plan</p>
            </div>
          </div>
        )}

        {/* Simulations Tab */}
        {activeTab === 'simulations' && (
          <div>
            <h3 className="text-xl font-bold mb-6">Financial Simulations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card cursor-pointer hover:shadow-lg transition">
                <h4 className="text-lg font-bold mb-2">Monte Carlo Simulation</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Run probabilistic portfolio projections with 1000+ simulations
                </p>
                <Link href="/planning/simulations/monte-carlo" className="text-blue-600 hover:text-blue-700 font-medium">
                  Run Simulation →
                </Link>
              </div>

              <div className="card cursor-pointer hover:shadow-lg transition">
                <h4 className="text-lg font-bold mb-2">Retirement Projection</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Calculate retirement readiness and required savings
                </p>
                <Link href="/planning/simulations/retirement" className="text-blue-600 hover:text-blue-700 font-medium">
                  Calculate →
                </Link>
              </div>

              <div className="card cursor-pointer hover:shadow-lg transition">
                <h4 className="text-lg font-bold mb-2">College Savings</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Project education savings needs and funding gaps
                </p>
                <Link href="/planning/simulations/college" className="text-blue-600 hover:text-blue-700 font-medium">
                  Calculate →
                </Link>
              </div>

              <div className="card cursor-pointer hover:shadow-lg transition">
                <h4 className="text-lg font-bold mb-2">Inflation Analysis</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Analyze impact of inflation on purchasing power
                </p>
                <Link href="/planning/simulations/inflation" className="text-blue-600 hover:text-blue-700 font-medium">
                  Analyze →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
