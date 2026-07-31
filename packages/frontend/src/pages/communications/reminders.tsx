import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Reminder {
  id: string;
  clientId: string;
  title: string;
  message: string;
  reminderType: string;
  scheduledDate: string;
  status: string;
  createdAt: string;
}

export default function Reminders() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [newReminder, setNewReminder] = useState({
    clientId: '',
    title: '',
    message: '',
    reminderType: 'meeting',
    scheduledDate: '',
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchReminders();
  }, [router, activeTab]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let endpoint = '/api/communications/reminders';
      if (activeTab === 'upcoming') {
        endpoint = '/api/communications/reminders/upcoming';
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch reminders');

      const json = await res.json();
      setReminders(json.data.reminders || json.data.reminders || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/communications/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReminder),
      });

      if (!res.ok) throw new Error('Failed to create reminder');

      setNewReminder({
        clientId: '',
        title: '',
        message: '',
        reminderType: 'meeting',
        scheduledDate: '',
      });
      setShowForm(false);
      fetchReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCancelReminder = async (reminderId: string) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communications/reminders/${reminderId}/cancel`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to cancel reminder');

      fetchReminders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReminderTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      event: 'bg-blue-100 text-blue-700',
      review: 'bg-purple-100 text-purple-700',
      meeting: 'bg-green-100 text-green-700',
      birthday: 'bg-pink-100 text-pink-700',
      anniversary: 'bg-red-100 text-red-700',
      deadline: 'bg-orange-100 text-orange-700',
      task: 'bg-yellow-100 text-yellow-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-blue-50 border-blue-200',
      sent: 'bg-green-50 border-green-200',
      cancelled: 'bg-red-50 border-red-200',
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  const isUpcoming = (scheduledDate: string) => {
    return new Date(scheduledDate) > new Date();
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
            <h2 className="text-3xl font-bold text-gray-900">Reminders</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary px-4 py-2"
            >
              + New Reminder
            </button>
          </div>

          {/* Create Reminder Form */}
          {showForm && (
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-4">Create Reminder</h3>
              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newReminder.clientId}
                    onChange={(e) => setNewReminder({ ...newReminder, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newReminder.message}
                    onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Type
                  </label>
                  <select
                    value={newReminder.reminderType}
                    onChange={(e) => setNewReminder({ ...newReminder, reminderType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="review">Review</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="deadline">Deadline</option>
                    <option value="task">Task</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newReminder.scheduledDate}
                    onChange={(e) => setNewReminder({ ...newReminder, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary px-4 py-2">
                    Create Reminder
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
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'all', label: 'All Reminders' },
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
        ) : reminders.length === 0 ? (
          <div className="card text-center py-12 text-gray-600">
            <p>No reminders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`card border-l-4 border-green-500 ${getStatusColor(reminder.status)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{reminder.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getReminderTypeColor(reminder.reminderType)}`}>
                        {reminder.reminderType}
                      </span>
                      {isUpcoming(reminder.scheduledDate) && (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700">
                          Upcoming
                        </span>
                      )}
                    </div>
                    {reminder.message && (
                      <p className="text-gray-600 text-sm mb-2">{reminder.message}</p>
                    )}
                    <div className="text-sm text-gray-600">
                      <p><strong>Scheduled:</strong> {formatDate(reminder.scheduledDate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {reminder.status === 'pending' && isUpcoming(reminder.scheduledDate) && (
                      <button
                        onClick={() => handleCancelReminder(reminder.id)}
                        className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                      >
                        Cancel
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
