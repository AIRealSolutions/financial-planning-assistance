import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  rationale: string;
  suggestedAction?: string;
  estimatedImpact?: string;
}

export default function Recommendations() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('portfolio');
  const [clientProfile, setClientProfile] = useState({
    age: '',
    income: '',
    netWorth: '',
    riskTolerance: 'moderate',
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const handleGenerateRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const endpoint =
        selectedType === 'portfolio'
          ? '/api/ai/recommendations/portfolio'
          : selectedType === 'retirement'
            ? '/api/ai/recommendations/retirement'
            : '/api/ai/recommendations/upsell';

      const payload =
        selectedType === 'upsell'
          ? {
              id: 'client_1',
              age: parseInt(clientProfile.age),
              netWorth: parseInt(clientProfile.netWorth),
              riskTolerance: clientProfile.riskTolerance,
            }
          : {
              id: 'client_1',
              age: parseInt(clientProfile.age),
              income: parseInt(clientProfile.income),
              netWorth: parseInt(clientProfile.netWorth),
              riskTolerance: clientProfile.riskTolerance,
            };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to generate recommendations');

      const json = await res.json();
      setRecommendations(json.data.recommendations || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset_allocation: 'bg-blue-100 text-blue-700',
      growth_strategy: 'bg-purple-100 text-purple-700',
      engagement: 'bg-green-100 text-green-700',
      retirement_savings: 'bg-orange-100 text-orange-700',
      retirement_planning: 'bg-indigo-100 text-indigo-700',
      decumulation_strategy: 'bg-pink-100 text-pink-700',
      client_engagement: 'bg-teal-100 text-teal-700',
      goal_planning: 'bg-cyan-100 text-cyan-700',
      service_offering: 'bg-lime-100 text-lime-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">AI Recommendations</h2>

          {/* Input Form */}
          <div className="card mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generate Recommendations</h3>
            <form onSubmit={handleGenerateRecommendations} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendation Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="portfolio">Portfolio Recommendations</option>
                  <option value="retirement">Retirement Recommendations</option>
                  <option value="upsell">Cross-Sell Opportunities</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    required
                    value={clientProfile.age}
                    onChange={(e) => setClientProfile({ ...clientProfile, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income
                  </label>
                  <input
                    type="number"
                    value={clientProfile.income}
                    onChange={(e) => setClientProfile({ ...clientProfile, income: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Net Worth</label>
                  <input
                    type="number"
                    value={clientProfile.netWorth}
                    onChange={(e) => setClientProfile({ ...clientProfile, netWorth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Tolerance
                  </label>
                  <select
                    value={clientProfile.riskTolerance}
                    onChange={(e) =>
                      setClientProfile({ ...clientProfile, riskTolerance: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary px-6 py-2 w-full">
                Generate Recommendations
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Generating recommendations...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="card text-center py-12 text-gray-600">
            <p>No recommendations generated yet. Fill in your profile and generate recommendations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {recommendations.length} Recommendations
              </h3>
            </div>
            {recommendations.map((rec) => (
              <div key={rec.id} className="card border-l-4 border-blue-500">
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{rec.title}</h4>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getTypeColor(rec.type)}`}>
                          {rec.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700">
                          {(rec.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{rec.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">Rationale</p>
                      <p className="text-sm text-gray-600">{rec.rationale}</p>
                    </div>
                    {rec.suggestedAction && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Suggested Action</p>
                        <p className="text-sm text-gray-600">{rec.suggestedAction}</p>
                      </div>
                    )}
                    {rec.estimatedImpact && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Estimated Impact</p>
                        <p className="text-sm text-gray-600">{rec.estimatedImpact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
