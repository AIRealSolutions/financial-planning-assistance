import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">FinancialAdvisor AI</div>
            <div className="space-x-4">
              <Link href="/auth/login" className="btn btn-primary">
                Login
              </Link>
              <Link href="/auth/register" className="btn btn-secondary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Financial Advisor Assistant Powered by AI
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Streamline your practice with intelligent scheduling, CRM, planning, marketing, and communications all in one platform.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/register" className="btn btn-primary px-8 py-3 text-lg">
            Get Started Free
          </Link>
          <button className="btn btn-secondary px-8 py-3 text-lg">
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status Section */}
      <section className="container py-20">
        <div className="card">
          <h2 className="text-3xl font-bold mb-6">Development Status</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
              <span className="font-medium">Phase 1: Foundation & Auth</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
              <span className="font-medium">Phase 2: CRM Foundation</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
              <span className="font-medium">Phase 3: Back Office Operations</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
              <span className="font-medium">Phase 4-8: Additional Features</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container text-center">
          <p>&copy; 2024 Financial Advisor Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '📅',
    title: 'Smart Scheduling',
    description: 'Calendar management with intelligent scheduling and conflict detection.',
  },
  {
    icon: '👥',
    title: 'CRM Management',
    description: 'Complete client relationship management with interaction tracking.',
  },
  {
    icon: '💰',
    title: 'Financial Planning',
    description: 'Portfolio management and automated financial plan generation.',
  },
  {
    icon: '📧',
    title: 'Marketing Automation',
    description: 'Campaign management and automated marketing workflows.',
  },
  {
    icon: '🔔',
    title: 'Communications',
    description: 'Multi-channel notifications and event reminders.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Features',
    description: 'Intelligent recommendations and predictive analytics.',
  },
];
