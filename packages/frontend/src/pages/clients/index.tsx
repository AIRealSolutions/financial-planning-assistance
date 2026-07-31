import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Client {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: string;
  householdIncome?: number;
  netWorth?: number;
  lastContactAt?: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientsList() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchClients = async (page = 1, searchTerm = '', selectedStatus = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crm/clients?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data.data.clients);
      setPagination(data.data.pagination);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchClients();
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(1, search, status);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    fetchClients(1, search, newStatus);
  };

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.get('fullName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          householdIncome: formData.get('householdIncome') ? parseFloat(formData.get('householdIncome') as string) : undefined,
          netWorth: formData.get('netWorth') ? parseFloat(formData.get('netWorth') as string) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create client');

      setShowAddForm(false);
      fetchClients(pagination.page, search, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      prospect: 'bg-blue-100 text-blue-800',
      dormant: 'bg-yellow-100 text-yellow-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
            <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary px-4 py-2"
            >
              + Add Client
            </button>
          </div>

          {/* Add Client Form */}
          {showAddForm && (
            <div className="card mb-6">
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      className="form-input"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="form-label">Household Income</label>
                    <input
                      type="number"
                      name="householdIncome"
                      className="form-input"
                      placeholder="150000"
                    />
                  </div>
                  <div>
                    <label className="form-label">Net Worth</label>
                    <input
                      type="number"
                      name="netWorth"
                      className="form-input"
                      placeholder="500000"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary px-4 py-2">
                    Create Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="card mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input"
                    placeholder="Search by name or email..."
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select value={status} onChange={handleStatusChange} className="form-input">
                    <option value="">All Statuses</option>
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="dormant">Dormant</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="btn btn-primary w-full">
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Clients Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">No clients found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Net Worth</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Last Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{client.email || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {client.netWorth ? `$${(client.netWorth / 1000).toFixed(0)}k` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {client.lastContactAt
                        ? new Date(client.lastContactAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchClients(page, search, status)}
                    className={`px-3 py-1 rounded ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
