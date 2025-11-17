import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-16">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Modern Waiter Call System
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl">
              Give guests a magical experience: they scan a QR at the table,
              tap “Call Waiter,” and your staff gets an instant alert. No app
              downloads, no awkward hand waves.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
            <Link
              href="/auth/admin/signup"
              className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow hover:bg-indigo-700"
            >
              Create Restaurant
            </Link>
            <Link
              href="/auth/admin"
              className="px-5 py-3 bg-white text-indigo-600 rounded-xl font-semibold border border-indigo-200 hover:bg-indigo-50"
            >
              Admin Login
            </Link>
            <Link
              href="/auth/waiter"
              className="px-5 py-3 bg-white text-indigo-600 rounded-xl font-semibold border border-indigo-200 hover:bg-indigo-50"
            >
              Waiter Login
            </Link>
          </div>
        </header>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Quick QR Setup
            </h3>
            <p className="text-gray-600">
              Generate unique table QR codes, customize promos, and go live in
              minutes.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Live Waiter Dashboard
            </h3>
            <p className="text-gray-600">
              Waiters see incoming calls instantly, prioritize requests, and log
              response times.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Admin Control Center
            </h3>
            <p className="text-gray-600">
              Manage tables, assign staff, and analyze performance from one
              clean dashboard.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

