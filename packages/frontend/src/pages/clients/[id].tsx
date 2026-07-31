import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Client {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status: string;
  householdIncome?: number;
  netWorth?: number;
  riskProfile?: string;
  occupation?: string;
  lastContactAt?: string;
  nextReviewDate?: string;
  createdAt: string;
}

interface Interaction {
  id: string;
  type: string;
  content?: string;
  createdAt: string;
}

export default function ClientDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [showInteractionForm, setShowInteractionForm] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchClientData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/crm/clients/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error('Failed to fetch client');

        const data = await response.json();
        setClient(data.data.client);
        setInteractions(data.data.recentInteractions || []);
        setFormData(data.data.client);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }

    fetchClientData();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crm/clients/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) throw new Error('Failed to update client');

      const data = await response.json();
      setClient(data.data);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
    }
  };

  const handleAddInteraction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const formElData = new FormData(formEl);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: id,
          type: formElData.get('type'),
          content: formElData.get('content'),
          outcome: formElData.get('outcome'),
        }),
      });

      if (!response.ok) throw new Error('Failed to add interaction');

      formEl.reset();
      setShowInteractionForm(false);

      // Refresh interactions
      const listResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crm/clients/${id}/interactions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (listResponse.ok) {
        const data = await listResponse.json();
        setInteractions(data.data.interactions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add interaction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="card text-center">
            <p className="text-red-600">Client not found</p>
            <Link href="/clients" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Financial Advisor AI</h1>
            <Link href="/clients" className="text-gray-600 hover:text-gray-900">
              ← Back to Clients
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client Info */}
          <div className="md:col-span-2">
            <div className="card">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{client.fullName}</h2>
                  <p className="text-gray-600 mt-1">{client.occupation || 'No occupation listed'}</p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn btn-primary px-4 py-2"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Status</label>
                      <select
                        className="form-input"
                        value={formData.status || ''}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="prospect">Prospect</option>
                        <option value="active">Active</option>
                        <option value="dormant">Dormant</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Net Worth</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.netWorth || ''}
                        onChange={(e) => setFormData({ ...formData, netWorth: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Risk Profile</label>
                      <select
                        className="form-input"
                        value={formData.riskProfile || ''}
                        onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value })}
                      >
                        <option value="">Select Risk Profile</option>
                        <option value="conservative">Conservative</option>
                        <option value="moderate">Moderate</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary px-4 py-2">
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-medium text-gray-900">{client.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-lg font-medium text-gray-900">{client.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-medium text-gray-900 capitalize">{client.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Worth</p>
                    <p className="text-lg font-medium text-gray-900">
                      {client.netWorth ? `$${(client.netWorth / 1000).toFixed(0)}k` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Profile</p>
                    <p className="text-lg font-medium text-gray-900 capitalize">{client.riskProfile || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Contact</p>
                    <p className="text-lg font-medium text-gray-900">
                      {client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Interactions Timeline */}
            <div className="mt-6 card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Activity Timeline</h3>
                <button
                  onClick={() => setShowInteractionForm(!showInteractionForm)}
                  className="btn btn-primary px-3 py-1"
                >
                  + Log Interaction
                </button>
              </div>

              {showInteractionForm && (
                <form onSubmit={handleAddInteraction} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Type</label>
                      <select name="type" required className="form-input">
                        <option value="">Select Type</option>
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="note">Note</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Outcome</label>
                      <input
                        type="text"
                        name="outcome"
                        className="form-input"
                        placeholder="What was discussed/decided"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Notes</label>
                    <textarea
                      name="content"
                      className="form-input"
                      rows={3}
                      placeholder="Add any details about the interaction..."
                    ></textarea>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary px-4 py-2">
                      Log Interaction
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInteractionForm(false)}
                      className="btn btn-secondary px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {interactions.length === 0 ? (
                <p className="text-gray-600">No interactions logged yet</p>
              ) : (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="pb-4 border-b last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{interaction.type}</p>
                          {interaction.content && (
                            <p className="text-gray-600 text-sm mt-1">{interaction.content}</p>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(interaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Client Since</p>
                  <p className="font-medium text-gray-900">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Review</p>
                  <p className="font-medium text-gray-900">
                    {client.nextReviewDate ? new Date(client.nextReviewDate).toLocaleDateString() : 'Not scheduled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full btn btn-secondary py-2 text-left">📅 Schedule Meeting</button>
                <button className="w-full btn btn-secondary py-2 text-left">📧 Send Email</button>
                <button className="w-full btn btn-secondary py-2 text-left">📊 View Portfolio</button>
                <button className="w-full btn btn-secondary py-2 text-left">📋 Create Plan</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
