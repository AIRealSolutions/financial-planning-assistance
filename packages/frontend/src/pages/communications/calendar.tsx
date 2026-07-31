import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Event {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  status: string;
}

export default function AnnualCalendar() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [eventsByMonth, setEventsByMonth] = useState<Record<string, Event[]>>({});

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/auth/login');
      return;
    }
    fetchAnnualEvents();
  }, [router, selectedYear]);

  const fetchAnnualEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/communications/calendar/annual?year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error('Failed to fetch events');

      const json = await res.json();
      const allEvents = json.data.events || [];
      setEvents(allEvents);

      // Group events by month
      const grouped: Record<string, Event[]> = {};
      allEvents.forEach((event: Event) => {
        const date = new Date(event.startDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(event);
      });

      setEventsByMonth(grouped);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-blue-100 text-blue-700 border-blue-300',
      review: 'bg-purple-100 text-purple-700 border-purple-300',
      reminder: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      milestone: 'bg-green-100 text-green-700 border-green-300',
      deadline: 'bg-red-100 text-red-700 border-red-300',
      anniversary: 'bg-pink-100 text-pink-700 border-pink-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const monthEvents = eventsByMonth[`${selectedYear}-${selectedMonth}`] || [];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const eventsForDay = (day: number | null) => {
    if (!day) return [];
    const date = new Date(selectedYear, selectedMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    return monthEvents.filter((event) => event.startDate.startsWith(dateStr));
  };

  const yearOptions = [];
  for (let i = selectedYear - 2; i <= selectedYear + 2; i++) {
    yearOptions.push(i);
  }

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
            <h2 className="text-3xl font-bold text-gray-900">Annual Calendar</h2>
            <div className="flex gap-4 items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {monthNames.map((month, monthIndex) => {
                  const daysInCurrentMonth = getDaysInMonth(selectedYear, monthIndex);
                  const firstDayOfCurrentMonth = getFirstDayOfMonth(selectedYear, monthIndex);
                  const currentMonthDays = [];

                  for (let i = 0; i < firstDayOfCurrentMonth; i++) {
                    currentMonthDays.push(null);
                  }

                  for (let day = 1; day <= daysInCurrentMonth; day++) {
                    currentMonthDays.push(day);
                  }

                  const currentMonthEvents = eventsByMonth[`${selectedYear}-${monthIndex}`] || [];

                  return (
                    <div key={monthIndex} className="card">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        {month} {selectedYear}
                      </h3>
                      <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-xs font-bold text-gray-600 text-center py-2">
                            {day}
                          </div>
                        ))}
                        {currentMonthDays.map((day, index) => {
                          const dayEvents = day
                            ? currentMonthEvents.filter((event) => {
                                const eventDate = new Date(event.startDate);
                                return eventDate.getDate() === day;
                              })
                            : [];

                          return (
                            <div
                              key={index}
                              className={`text-xs p-1 min-h-16 border rounded ${
                                day ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-transparent bg-gray-100'
                              }`}
                            >
                              {day && <div className="font-bold text-gray-900 mb-1">{day}</div>}
                              <div className="space-y-1">
                                {dayEvents.slice(0, 2).map((event, i) => (
                                  <div
                                    key={i}
                                    className={`text-xs px-1 py-0.5 rounded truncate border ${getEventTypeColor(
                                      event.eventType,
                                    )}`}
                                    title={event.title}
                                  >
                                    {event.title.substring(0, 10)}
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-gray-600 px-1">+{dayEvents.length - 2} more</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar - Current Month Events */}
            <div>
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {monthNames[selectedMonth]} Events
                </h3>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {monthNames.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMonth(index)}
                      className={`text-xs px-2 py-1 rounded transition ${
                        index === selectedMonth
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {monthEvents.length === 0 ? (
                    <p className="text-gray-600 text-sm">No events this month</p>
                  ) : (
                    monthEvents
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                      .map((event) => (
                        <div
                          key={event.id}
                          className={`p-3 rounded border-l-4 ${getEventTypeColor(event.eventType)}`}
                        >
                          <p className="font-bold text-sm">{event.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(event.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-white ${
                              event.eventType === 'meeting' ? 'bg-blue-600' :
                              event.eventType === 'review' ? 'bg-purple-600' :
                              event.eventType === 'reminder' ? 'bg-yellow-600' :
                              event.eventType === 'milestone' ? 'bg-green-600' :
                              event.eventType === 'deadline' ? 'bg-red-600' :
                              'bg-pink-600'
                            }`}>
                              {event.eventType}
                            </span>
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="card mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Year Summary</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meetings</p>
                    <p className="text-lg font-bold text-blue-600">
                      {events.filter((e) => e.eventType === 'meeting').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reviews</p>
                    <p className="text-lg font-bold text-purple-600">
                      {events.filter((e) => e.eventType === 'review').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reminders</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {events.filter((e) => e.eventType === 'reminder').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
