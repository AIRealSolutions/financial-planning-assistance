import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  clientId?: string;
  isVirtual: boolean;
  location?: string;
}

export default function Calendar() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get upcoming meetings for the next 7 days
      const upcomingRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/operations/meetings/upcoming?days=7`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!upcomingRes.ok) throw new Error('Failed to fetch meetings');

      const upcomingData = await upcomingRes.json();
      setUpcomingMeetings(upcomingData.data);

      // Get all meetings for the current month
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const listRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/operations/meetings?` +
        `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=100`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!listRes.ok) throw new Error('Failed to fetch meetings');

      const listData = await listRes.json();
      setMeetings(listData.data.meetings);
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
    fetchMeetings();
  }, [router, currentMonth]);

  const handleAddMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/operations/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.get('title'),
          type: formData.get('type'),
          startTime: formData.get('startTime'),
          endTime: formData.get('endTime'),
          location: formData.get('location'),
          isVirtual: formData.get('isVirtual') === 'on',
        }),
      });

      if (!response.ok) throw new Error('Failed to create meeting');

      setShowAddForm(false);
      fetchMeetings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMeetingsForDate = (day: number) => {
    return meetings.filter((m) => {
      const meetingDate = new Date(m.startTime);
      return (
        meetingDate.getDate() === day &&
        meetingDate.getMonth() === currentMonth.getMonth() &&
        meetingDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  const monthDays = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: monthDays }, (_, i) => i + 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

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
            <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary px-4 py-2"
            >
              + New Meeting
            </button>
          </div>

          {/* Add Meeting Form */}
          {showAddForm && (
            <div className="card mb-6">
              <form onSubmit={handleAddMeeting} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="form-input"
                      placeholder="Meeting title"
                    />
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select name="type" className="form-input">
                      <option value="review">Portfolio Review</option>
                      <option value="planning">Financial Planning</option>
                      <option value="prospecting">Prospecting</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Start Time *</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      required
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">End Time *</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      required
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-input"
                      placeholder="Office location or video link"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isVirtual"
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-gray-700">Virtual Meeting</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary px-4 py-2">
                    Create Meeting
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
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  className="btn btn-secondary px-3 py-1"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="btn btn-secondary px-3 py-1"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="btn btn-secondary px-3 py-1"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-bold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-24 p-2 border rounded ${
                    day
                      ? 'bg-white hover:bg-blue-50 cursor-pointer'
                      : 'bg-gray-50'
                  }`}
                >
                  {day && (
                    <>
                      <div className="font-bold text-gray-900 mb-1">{day}</div>
                      <div className="space-y-1">
                        {getMeetingsForDate(day).slice(0, 2).map((meeting) => (
                          <div
                            key={meeting.id}
                            className="text-xs bg-blue-100 text-blue-800 rounded p-1 truncate cursor-pointer hover:bg-blue-200"
                          >
                            {meeting.title}
                          </div>
                        ))}
                        {getMeetingsForDate(day).length > 2 && (
                          <div className="text-xs text-gray-600">
                            +{getMeetingsForDate(day).length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Upcoming (7 days)</h3>
            {loading ? (
              <div className="text-center py-6">
                <div className="inline-flex animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <p className="text-gray-600">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="border-l-4 border-blue-600 pl-3 py-2">
                    <p className="font-bold text-gray-900 text-sm">{meeting.title}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(meeting.startTime).toLocaleDateString()} {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{meeting.type}</p>
                    {meeting.isVirtual && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded mt-1 inline-block">Virtual</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
