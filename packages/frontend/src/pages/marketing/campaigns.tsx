import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaignType: string;
  status: string;
  budget?: number;
  expectedReach?: number;
  actualReach?: number;
  conversions?: number;
  conversionRate?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  draftCampaigns: number;
  totalBudget: number;
  totalReach: number;
  averageConversionRate: number;
  byType: Record<string, number>;
}

export default function Campaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    campaignType: 'email',
    status: 'draft',
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchCampaigns();
    fetchStats();
  }, [router, activeTab]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const query = new URLSearchParams({
        page: '1',
        limit: '20',
      });

      if (activeTab === 'active') {
        query.append('status', 'active');
      } else if (activeTab === 'draft') {
        query.append('status', 'draft');
      } else if (activeTab === 'completed') {
        query.append('status', 'completed');
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketing/campaigns?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to fetch campaigns');

      const json = await res.json();
      setCampaigns(json.data.campaigns || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/campaigns/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch stats');

      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCampaign),
      });

      if (!res.ok) throw new Error('Failed to create campaign');

      setNewCampaign({ name: '', campaignType: 'email', status: 'draft' });
      setShowForm(false);
      fetchCampaigns();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCampaignTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      email: 'bg-blue-100 text-blue-700',
      sms: 'bg-green-100 text-green-700',
      push: 'bg-purple-100 text-purple-700',
      webinar: 'bg-orange-100 text-orange-700',
      content: 'bg-yellow-100 text-yellow-700',
      event: 'bg-red-100 text-red-700',
      educational: 'bg-indigo-100 text-indigo-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-50 border-gray-200',
      scheduled: 'bg-blue-50 border-blue-200',
      active: 'bg-green-50 border-green-200',
      paused: 'bg-yellow-50 border-yellow-200',
      completed: 'bg-purple-50 border-purple-200',
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Marketing Campaigns</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary px-4 py-2"
            >
              + New Campaign
            </button>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card">
                <p className="text-gray-600 text-sm">Total Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeCampaigns}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Avg Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageConversionRate.toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {/* Create Campaign Form */}
          {showForm && (
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-4">Create Campaign</h3>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Type
                  </label>
                  <select
                    value={newCampaign.campaignType}
                    onChange={(e) => setNewCampaign({ ...newCampaign, campaignType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                    <option value="webinar">Webinar</option>
                    <option value="content">Content</option>
                    <option value="event">Event</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary px-4 py-2">
                    Create Campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b mb-6">
            {[
              { id: 'active', label: 'Active' },
              { id: 'draft', label: 'Draft' },
              { id: 'completed', label: 'Completed' },
              { id: 'all', label: 'All Campaigns' },
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card text-center py-12 text-gray-600">
            <p>No campaigns found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`card border-l-4 border-blue-500 ${getStatusColor(campaign.status)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getCampaignTypeColor(campaign.campaignType)}`}>
                        {campaign.campaignType}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        campaign.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {campaign.budget && (
                        <div>
                          <p className="text-gray-600">Budget</p>
                          <p className="font-bold text-gray-900">{formatCurrency(campaign.budget)}</p>
                        </div>
                      )}
                      {campaign.expectedReach && (
                        <div>
                          <p className="text-gray-600">Expected Reach</p>
                          <p className="font-bold text-gray-900">{campaign.expectedReach.toLocaleString()}</p>
                        </div>
                      )}
                      {campaign.actualReach && (
                        <div>
                          <p className="text-gray-600">Actual Reach</p>
                          <p className="font-bold text-gray-900">{campaign.actualReach.toLocaleString()}</p>
                        </div>
                      )}
                      {campaign.conversionRate !== undefined && (
                        <div>
                          <p className="text-gray-600">Conversion Rate</p>
                          <p className="font-bold text-gray-900">{campaign.conversionRate.toFixed(2)}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
