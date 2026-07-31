import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Automation {
  id: string;
  name: string;
  description?: string;
  automationType: string;
  trigger?: string;
  enabled: boolean;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
}

interface AutomationStats {
  total: number;
  enabled: number;
  disabled: number;
  totalExecutions: number;
  byType: Record<string, number>;
}

export default function Automations() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('enabled');
  const [showForm, setShowForm] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    automationType: 'email_sequence',
    enabled: true,
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchAutomations();
    fetchStats();
  }, [router, activeTab]);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const query = new URLSearchParams({
        page: '1',
        limit: '20',
      });

      if (activeTab === 'enabled') {
        query.append('enabled', 'true');
      } else if (activeTab === 'disabled') {
        query.append('enabled', 'false');
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketing/automations?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to fetch automations');

      const json = await res.json();
      setAutomations(json.data.automations || []);
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/automations/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch stats');

      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/automations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAutomation),
      });

      if (!res.ok) throw new Error('Failed to create automation');

      setNewAutomation({ name: '', automationType: 'email_sequence', enabled: true });
      setShowForm(false);
      fetchAutomations();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggle = async (automationId: string) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketing/automations/${automationId}/toggle`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to toggle automation');

      fetchAutomations();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleExecute = async (automationId: string) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketing/automations/${automationId}/execute`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to execute automation');

      fetchAutomations();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getAutomationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      email_sequence: 'bg-blue-100 text-blue-700',
      nurture_campaign: 'bg-green-100 text-green-700',
      drip_campaign: 'bg-purple-100 text-purple-700',
      behavioral: 'bg-orange-100 text-orange-700',
      scheduled: 'bg-yellow-100 text-yellow-700',
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Marketing Automations</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary px-4 py-2"
            >
              + New Automation
            </button>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card">
                <p className="text-gray-600 text-sm">Total Automations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Enabled</p>
                <p className="text-3xl font-bold text-green-600">{stats.enabled}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Disabled</p>
                <p className="text-3xl font-bold text-red-600">{stats.disabled}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Total Executions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalExecutions.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Create Automation Form */}
          {showForm && (
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-4">Create Automation</h3>
              <form onSubmit={handleCreateAutomation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Automation Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAutomation.name}
                    onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Automation Type
                  </label>
                  <select
                    value={newAutomation.automationType}
                    onChange={(e) => setNewAutomation({ ...newAutomation, automationType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email_sequence">Email Sequence</option>
                    <option value="nurture_campaign">Nurture Campaign</option>
                    <option value="drip_campaign">Drip Campaign</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary px-4 py-2">
                    Create Automation
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
              { id: 'enabled', label: 'Enabled' },
              { id: 'disabled', label: 'Disabled' },
              { id: 'all', label: 'All Automations' },
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
        ) : automations.length === 0 ? (
          <div className="card text-center py-12 text-gray-600">
            <p>No automations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className={`card border-l-4 ${
                  automation.enabled ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{automation.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getAutomationTypeColor(automation.automationType)}`}>
                        {automation.automationType.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        automation.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {automation.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {automation.description && (
                      <p className="text-gray-600 text-sm mb-3">{automation.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Executions</p>
                        <p className="font-bold text-gray-900">{automation.executionCount.toLocaleString()}</p>
                      </div>
                      {automation.lastExecuted && (
                        <div>
                          <p className="text-gray-600">Last Executed</p>
                          <p className="font-bold text-gray-900">
                            {new Date(automation.lastExecuted).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {automation.trigger && (
                        <div>
                          <p className="text-gray-600">Trigger</p>
                          <p className="font-bold text-gray-900">{automation.trigger}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(automation.id)}
                      className={`btn btn-sm ${
                        automation.enabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {automation.enabled ? 'Disable' : 'Enable'}
                    </button>
                    {automation.enabled && (
                      <button
                        onClick={() => handleExecute(automation.id)}
                        className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Execute
                      </button>
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
