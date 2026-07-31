import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Event {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  location?: string;
  attendees?: string[];
  status: string;
  createdAt: string;
}

export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [newEvent, setNewEvent] = useState({
    clientId: '',
    title: '',
    eventType: 'meeting',
    startDate: '',
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchEvents();
  }, [router, activeTab]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const query = new URLSearchParams({
        page: '1',
        limit: '20',
      });

      if (activeTab === 'upcoming') {
        query.append('status', 'scheduled');
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communications/events?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to fetch events');

      const json = await res.json();
      setEvents(json.data.events || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/communications/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      });

      if (!res.ok) throw new Error('Failed to create event');

      setNewEvent({ clientId: '', title: '', eventType: 'meeting', startDate: '' });
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateEventStatus = async (eventId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communications/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) throw new Error('Failed to update event');

      fetchEvents();
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

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-blue-100 text-blue-700',
      review: 'bg-purple-100 text-purple-700',
      reminder: 'bg-yellow-100 text-yellow-700',
      milestone: 'bg-green-100 text-green-700',
      deadline: 'bg-red-100 text-red-700',
      anniversary: 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-50 border-blue-200',
      completed: 'bg-green-50 border-green-200',
      cancelled: 'bg-red-50 border-red-200',
      rescheduled: 'bg-yellow-50 border-yellow-200',
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
            <h2 className="text-3xl font-bold text-gray-900">Events</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-primary px-4 py-2"
            >
              + New Event
            </button>
          </div>

          {/* Create Event Form */}
          {showForm && (
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-4">Create Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newEvent.clientId}
                    onChange={(e) => setNewEvent({ ...newEvent, clientId: e.target.value })}
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
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="review">Review</option>
                    <option value="reminder">Reminder</option>
                    <option value="milestone">Milestone</option>
                    <option value="deadline">Deadline</option>
                    <option value="anniversary">Anniversary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn btn-primary px-4 py-2">
                    Create Event
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
              { id: 'completed', label: 'Completed' },
              { id: 'all', label: 'All Events' },
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
        ) : events.length === 0 ? (
          <div className="card text-center py-12 text-gray-600">
            <p>No events found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={`card border-l-4 border-blue-500 ${getStatusColor(event.status)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Date:</strong> {formatDate(event.startDate)}</p>
                      {event.location && <p><strong>Location:</strong> {event.location}</p>}
                      {event.attendees && event.attendees.length > 0 && (
                        <p><strong>Attendees:</strong> {event.attendees.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleUpdateEventStatus(event.id, 'completed')}
                          className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdateEventStatus(event.id, 'cancelled')}
                          className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
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
