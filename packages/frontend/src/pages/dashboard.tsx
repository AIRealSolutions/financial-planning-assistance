import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Financial Advisor AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.fullName}</span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary px-4 py-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <div className="flex">
        <aside className="w-64 bg-white shadow-md">
          <nav className="py-8">
            <ul className="space-y-2 px-4">
              <li>
                <Link href="/dashboard" className="block px-4 py-2 bg-blue-100 text-blue-600 rounded font-medium">
                  Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  👥 Clients
                </a>
              </li>
              <li>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  📅 Calendar
                </a>
              </li>
              <li>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  💰 Planning
                </a>
              </li>
              <li>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  📧 Marketing
                </a>
              </li>
              <li>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  🔔 Communications
                </a>
              </li>
              <li>
                <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                  ⚙️ Settings
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container py-8">
            {/* Welcome Section */}
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.fullName}!
              </h2>
              <p className="text-gray-600">
                Your financial advisor assistant is ready to help you manage your practice.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="card">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Feature Cards */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="card hover:shadow-lg transition-shadow">
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                      Learn more →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Development Status */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Development Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Phase 1: Foundation & Authentication ✓</span>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-gray-300"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Phase 2: CRM Foundation</span>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-gray-300"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Phase 3: Back Office Operations</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const stats = [
  { icon: '👥', label: 'Clients', value: '0' },
  { icon: '📅', label: 'Meetings This Week', value: '0' },
  { icon: '💼', label: 'Active Plans', value: '0' },
  { icon: '📧', label: 'Campaigns', value: '0' },
];

const features = [
  {
    icon: '👥',
    title: 'Add Your First Client',
    description: 'Start building your client base and track all interactions in one place.',
  },
  {
    icon: '💰',
    title: 'Create a Financial Plan',
    description: 'Use AI-powered tools to generate comprehensive financial plans.',
  },
  {
    icon: '📅',
    title: 'Sync Your Calendar',
    description: 'Connect your calendar for intelligent meeting scheduling.',
  },
];
