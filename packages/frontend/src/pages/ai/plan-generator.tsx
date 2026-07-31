import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface FinancialPlan {
  planId: string;
  title: string;
  executiveSummary: string;
  estimatedSuccess: number;
  projectedOutcomes: {
    projectedRetirementAge: number;
    estimatedRetirementValue: number;
    monthlySustainableIncome: number;
  };
  assetAllocation: Record<string, number>;
  goals: Array<{ title: string; targetAmount: number; priority: string }>;
  actionItems: Array<{ action: string; timeframe: string }>;
}

export default function PlanGenerator() {
  const router = useRouter();
  const [generatedPlan, setGeneratedPlan] = useState<FinancialPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    clientAge: '',
    retirementAge: '65',
    currentIncome: '',
    currentSavings: '',
    currentDebt: '',
    lifeExpectancy: '90',
    riskTolerance: 'moderate',
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const payload = {
        clientId: 'client_1',
        clientAge: parseInt(formData.clientAge),
        retirementAge: parseInt(formData.retirementAge),
        currentIncome: parseInt(formData.currentIncome),
        currentSavings: parseInt(formData.currentSavings),
        currentDebt: formData.currentDebt ? parseInt(formData.currentDebt) : undefined,
        lifeExpectancy: parseInt(formData.lifeExpectancy),
        riskTolerance: formData.riskTolerance,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/plans/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to generate plan');

      const json = await res.json();
      setGeneratedPlan(json.data);
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">AI Financial Plan Generator</h2>

          {/* Input Form */}
          <div className="card mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Client Information</h3>
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Age *</label>
                  <input
                    type="number"
                    required
                    value={formData.clientAge}
                    onChange={(e) => setFormData({ ...formData, clientAge: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retirement Age
                  </label>
                  <input
                    type="number"
                    value={formData.retirementAge}
                    onChange={(e) => setFormData({ ...formData, retirementAge: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.currentIncome}
                    onChange={(e) => setFormData({ ...formData, currentIncome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Savings *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.currentSavings}
                    onChange={(e) => setFormData({ ...formData, currentSavings: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Debt
                  </label>
                  <input
                    type="number"
                    value={formData.currentDebt}
                    onChange={(e) => setFormData({ ...formData, currentDebt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Life Expectancy
                  </label>
                  <input
                    type="number"
                    value={formData.lifeExpectancy}
                    onChange={(e) => setFormData({ ...formData, lifeExpectancy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
                <select
                  value={formData.riskTolerance}
                  onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary px-6 py-2 w-full" disabled={loading}>
                {loading ? 'Generating Plan...' : 'Generate Comprehensive Plan'}
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Generating your financial plan...</p>
          </div>
        )}

        {generatedPlan && (
          <div className="space-y-6">
            {/* Overview */}
            <div className="card">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{generatedPlan.title}</h3>
              <p className="text-gray-700 mb-4">{generatedPlan.executiveSummary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-gray-600 text-sm">Plan Success Probability</p>
                  <p className="text-3xl font-bold text-green-600">
                    {generatedPlan.estimatedSuccess.toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-gray-600 text-sm">Estimated Retirement Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(generatedPlan.projectedOutcomes.estimatedRetirementValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Projected Outcomes */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Projected Outcomes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Retirement Age</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {generatedPlan.projectedOutcomes.projectedRetirementAge}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Monthly Sustainable Income</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(generatedPlan.projectedOutcomes.monthlySustainableIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Retirement Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(generatedPlan.projectedOutcomes.estimatedRetirementValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Asset Allocation */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended Asset Allocation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(generatedPlan.assetAllocation).map(([asset, percentage]) => (
                  <div key={asset} className="p-3 bg-gray-50 rounded text-center">
                    <p className="text-gray-600 text-sm capitalize">{asset}</p>
                    <p className="text-2xl font-bold text-blue-600">{percentage}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}
            {generatedPlan.goals.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Goals</h3>
                <div className="space-y-3">
                  {generatedPlan.goals.map((goal, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{goal.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{formatCurrency(goal.targetAmount)}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                          goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {goal.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {generatedPlan.actionItems.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended Actions</h3>
                <div className="space-y-3">
                  {generatedPlan.actionItems.map((item, idx) => (
                    <div key={idx} className="p-3 border-l-4 border-blue-500 bg-blue-50">
                      <p className="font-bold text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-600 mt-1">Timeframe: {item.timeframe}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
