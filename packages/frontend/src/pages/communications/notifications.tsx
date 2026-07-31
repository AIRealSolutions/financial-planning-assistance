import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('unread');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchNotifications();
    fetchStats();
  }, [router, activeTab, filterPriority]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const query = new URLSearchParams({
        page: '1',
        limit: '20',
      });

      if (activeTab === 'unread') {
        query.append('read', 'false');
      } else if (activeTab === 'archived') {
        query.append('archived', 'true');
      }

      if (filterPriority) {
        query.append('priority', filterPriority);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communications/notifications?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to fetch notifications');

      const json = await res.json();
      setNotifications(json.data.notifications || []);
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/communications/notifications/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch stats');

      const json = await res.json();
      setStats(json.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communications/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to update notification');

      fetchNotifications();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communications/notifications/${notificationId}/archive`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to archive notification');

      fetchNotifications();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/communications/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to mark all as read');

      fetchNotifications();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      event: 'bg-blue-100 text-blue-700',
      reminder: 'bg-purple-100 text-purple-700',
      alert: 'bg-red-100 text-red-700',
      announcement: 'bg-green-100 text-green-700',
      message: 'bg-gray-100 text-gray-700',
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
            <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
            {stats && stats.unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="btn btn-secondary px-4 py-2"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="card">
                <p className="text-gray-600 text-sm">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Unread</p>
                <p className="text-3xl font-bold text-red-600">{stats.unread}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Read</p>
                <p className="text-3xl font-bold text-green-600">{stats.read}</p>
              </div>
              <div className="card">
                <p className="text-gray-600 text-sm">Urgent</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.byPriority.urgent || 0}
                </p>
              </div>
            </div>
          )}

          {/* Filters and Tabs */}
          <div className="flex gap-4 justify-between items-center border-b mb-6">
            <div className="flex gap-4">
              {[
                { id: 'unread', label: 'Unread' },
                { id: 'read', label: 'Read' },
                { id: 'archived', label: 'Archived' },
                { id: 'all', label: 'All' },
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
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
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
        ) : notifications.length === 0 ? (
          <div className="card text-center py-12 text-gray-600">
            <p>No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`card p-4 ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                    <p className="text-gray-500 text-xs">{formatDate(notification.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Read
                      </button>
                    )}
                    <button
                      onClick={() => handleArchive(notification.id)}
                      className="btn btn-sm bg-gray-400 text-white hover:bg-gray-500"
                    >
                      Archive
                    </button>
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
