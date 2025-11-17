import Link from 'next/link'

const heroImage =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'

export default function Home() {
  return (
    <main className="bg-background-light text-[#111813] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Top navigation */}
        <nav className="flex items-center justify-between bg-white rounded-full px-6 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold">
              ●
            </span>
            <span className="font-bold text-lg">WaiterCall</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="#features" className="hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-primary">
              Pricing
            </Link>
            <Link href="#testimonials" className="hover:text-primary">
              Testimonials
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/admin/signup"
              className="px-4 py-2 text-sm font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/admin"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#111813] rounded-full hover:bg-black transition"
            >
              Request a Demo
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-12 mt-16 items-center">
          <div className="space-y-6">
            <p className="text-lg uppercase tracking-widest text-primary font-semibold">
              WaiterCall
            </p>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">
              Revolutionize Your <br />
              Restaurant Service. <br />
              Instantly.
            </h1>
            <p className="text-lg text-gray-600">
              Empower your customers to call a waiter with a simple QR scan,
              boosting efficiency and enhancing their dining experience.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth/admin/signup"
                className="px-6 py-3 bg-primary text-[#111813] font-semibold rounded-full shadow hover:bg-primary/90 transition"
              >
                Get Started Today
              </Link>
              <Link
                href="/auth/admin"
                className="px-6 py-3 bg-white border border-gray-200 font-semibold rounded-full hover:border-gray-300 transition"
              >
                Request a Free Demo
              </Link>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
            <img
              src={heroImage}
              alt="Phone with WaiterCall app"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="mt-24 text-center space-y-6">
          <h2 className="text-2xl font-bold">
            Tired of Missed Opportunities and Unhappy Diners?
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            The old way of frantic hand-waving leads to frustrated customers and
            lost revenue. The new way is a seamless, instant connection between
            your diners and your staff.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white border border-red-100 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-red-500 font-semibold">
                <span className="text-lg">✗</span>
                The Old Way
              </div>
              <p className="text-gray-600">
                Guests struggle to get attention, leading to frustration,
                negative reviews, and lost sales on that extra round of drinks
                or dessert.
              </p>
            </div>
            <div className="bg-white border border-green-100 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <span className="text-lg">✓</span>
                The New Way with WaiterCall
              </div>
              <p className="text-gray-600">
                A simple QR scan instantly notifies your staff. Service is
                prompt, customers are delighted, and your revenue grows.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-24 space-y-8 text-center">
          <div>
            <p className="uppercase text-primary font-semibold tracking-wide">
              All-in-one platform
            </p>
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-2">
              Our powerful features integrate smoothly into your workflow,
              creating a better experience for both customers and staff.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: 'Instant QR Code Calling',
                desc: 'Customers request service with a quick scan. No app download required.',
              },
              {
                title: 'Real-Time Waiter Dashboard',
                desc: 'Your team gets organized notifications showing exactly which table needs assistance.',
              },
              {
                title: 'Admin Analytics & Insights',
                desc: 'Track response times, peak hours, and staff performance to make data-driven decisions.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3"
              >
                <div className="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold">
                  ●
                </div>
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="text-gray-600">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="mt-24 space-y-8 text-center">
          <div>
            <p className="uppercase text-primary font-semibold tracking-wide">
              Loved by restaurants
            </p>
            <h2 className="text-3xl font-bold">What Owners Are Saying</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3 shadow-sm">
              <p className="text-gray-700 italic">
                “WaiterCall has been a game-changer. Our service is faster, our
                customers are happier, and we’ve seen a 15% increase in drink
                re-orders. It’s incredibly simple and effective.”
              </p>
              <div>
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-sm text-gray-500">Owner, The Gourmet Bistro</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3 shadow-sm">
              <p className="text-gray-700 italic">
                “I was skeptical at first, but the real-time dashboard keeps my
                team perfectly in sync. We’re handling rush hour with ease and
                customer complaints about wait times have vanished.”
              </p>
              <div>
                <p className="font-semibold">Marco Rivera</p>
                <p className="text-sm text-gray-500">
                  Manager, La Familia Trattoria
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-24 space-y-8 text-center">
          <div>
            <p className="uppercase text-primary font-semibold tracking-wide">
              Simple pricing
            </p>
            <h2 className="text-3xl font-bold">Transparent Plans for Every Team</h2>
            <p className="text-gray-600 mt-2">
              Choose the plan that’s right for your business. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: 'Basic',
                price: '$49',
                period: '/mo',
                description: 'Perfect for small cafes and bistros getting started.',
                features: ['Up to 15 Tables', 'QR Code Calling', 'Waiter Dashboard'],
                button: 'Choose Plan',
                highlight: false,
              },
              {
                title: 'Pro',
                price: '$99',
                period: '/mo',
                description: 'For growing restaurants that need more power and insights.',
                features: [
                  'Up to 50 Tables',
                  'All Basic Features',
                  'Performance Analytics',
                  'Priority Support',
                ],
                button: 'Choose Plan',
                highlight: true,
              },
              {
                title: 'Enterprise',
                price: 'Custom',
                period: '',
                description:
                  'Tailored solutions for large chains and restaurant groups.',
                features: ['Unlimited Tables', 'All Pro Features', 'Dedicated Account Manager'],
                button: 'Contact Us',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.title}
                className={`rounded-2xl border p-6 bg-white shadow-sm space-y-4 ${
                  plan.highlight
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.title}</h3>
                  {plan.highlight && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Most Popular
                    </span>
                  )}
                </div>
                <p className="text-4xl font-bold">
                  {plan.price}
                  <span className="text-base font-medium text-gray-500">
                    {plan.period}
                  </span>
                </p>
                <p className="text-gray-600">{plan.description}</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/admin/signup"
                  className={`block w-full text-center px-4 py-3 rounded-full font-semibold ${
                    plan.highlight
                      ? 'bg-primary text-[#111813]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.button}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-24 bg-primary/15 rounded-3xl p-10 text-center space-y-4">
          <h2 className="text-3xl font-bold text-[#111813]">
            Ready to Elevate Your Service?
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Join dozens of successful restaurants who use WaiterCall to improve
            efficiency and delight their guests.
          </p>
          <Link
            href="/auth/admin/signup"
            className="inline-flex px-8 py-3 bg-[#111813] text-white rounded-full font-semibold hover:bg-black transition"
          >
            Start Your Free Trial
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-16 py-10 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-bold">
              ●
            </span>
            <span className="font-semibold text-[#111813]">WaiterCall</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/#about" className="hover:text-primary">
              About Us
            </Link>
            <Link href="/#contact" className="hover:text-primary">
              Contact
            </Link>
            <Link href="/#privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
          </div>
          <p className="mt-4 md:mt-0">© {new Date().getFullYear()} WaiterCall. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}

