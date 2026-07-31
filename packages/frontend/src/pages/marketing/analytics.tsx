import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface OrganizationAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  averageClickThroughRate: number;
  averageConversionRate: number;
  byCampaign: Record<string, any>;
}

export default function Analytics() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchAnalytics();
  }, [router, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketing/analytics/organization?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to fetch analytics');

      const json = await res.json();
      setAnalytics(json.data);
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
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Marketing Analytics</h2>

          {/* Date Filters */}
          <div className="card mb-6">
            <h3 className="text-lg font-bold mb-4">Filter by Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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
          </div>
        ) : !analytics ? (
          <div className="card text-center py-12 text-gray-600">
            <p>No analytics data available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card">
                  <p className="text-gray-600 text-sm">Total Impressions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(analytics.totalImpressions)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Total views</p>
                </div>
                <div className="card">
                  <p className="text-gray-600 text-sm">Total Clicks</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatNumber(analytics.totalClicks)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">User interactions</p>
                </div>
                <div className="card">
                  <p className="text-gray-600 text-sm">Total Conversions</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumber(analytics.totalConversions)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Completed actions</p>
                </div>
                <div className="card">
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(analytics.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">From conversions</p>
                </div>
                <div className="card">
                  <p className="text-gray-600 text-sm">Click-Through Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics.averageClickThroughRate.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Clicks per impression</p>
                </div>
                <div className="card">
                  <p className="text-gray-600 text-sm">Conversion Rate</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {analytics.averageConversionRate.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Conversions per click</p>
                </div>
              </div>
            </div>

            {/* Performance by Campaign */}
            {Object.keys(analytics.byCampaign).length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Performance by Campaign</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.byCampaign).map(([campaignId, data]: any) => (
                    <div key={campaignId} className="card">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-gray-600 text-xs">Campaign</p>
                          <p className="font-bold text-gray-900">{campaignId.substring(0, 20)}...</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Impressions</p>
                          <p className="font-bold text-gray-900">{formatNumber(data.impressions)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Clicks</p>
                          <p className="font-bold text-blue-600">{formatNumber(data.clicks)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Conversions</p>
                          <p className="font-bold text-green-600">{formatNumber(data.conversions)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Revenue</p>
                          <p className="font-bold text-gray-900">{formatCurrency(data.revenue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Insights */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Insights</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <span className="text-gray-700">Average CTR</span>
                  <span className="text-lg font-bold text-blue-600">
                    {analytics.averageClickThroughRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="text-gray-700">Conversion Efficiency</span>
                  <span className="text-lg font-bold text-green-600">
                    {analytics.averageConversionRate.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                  <span className="text-gray-700">Revenue per Impression</span>
                  <span className="text-lg font-bold text-purple-600">
                    {analytics.totalImpressions > 0
                      ? formatCurrency(analytics.totalRevenue / analytics.totalImpressions)
                      : '$0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                  <span className="text-gray-700">Cost per Conversion</span>
                  <span className="text-lg font-bold text-orange-600">
                    {analytics.totalConversions > 0
                      ? formatCurrency(analytics.totalRevenue / analytics.totalConversions)
                      : '$0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
