import Link from 'next/link'

const heroImage =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'

export default function Home() {
  return (
    <main className="bg-background-light text-[#111813] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Top navigation */}
        <nav className="flex items-center justify-between bg-white rounded-full px-8 py-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold text-sm">
              ●
            </div>
            <span className="font-bold text-xl text-[#111813]">WaiterCall</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="#features" className="hover:text-primary transition-colors duration-200">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-primary transition-colors duration-200">
              Pricing
            </Link>
            <Link href="#testimonials" className="hover:text-primary transition-colors duration-200">
              Testimonials
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/admin/signup"
              className="px-5 py-2.5 text-sm font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-all duration-200"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/admin"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#111813] rounded-full hover:bg-black transition-all duration-200 shadow-sm"
            >
              Request Demo
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-16 mt-20 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-wider text-primary font-semibold">
                Restaurant Service Platform
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight text-[#111813]">
                Transform Service
                <br />
                <span className="text-primary">Efficiency</span>
                <br />
                Instantly.
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Enterprise-grade table service management that reduces wait times by 60% and increases customer satisfaction while boosting operational revenue.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/admin/signup"
                className="px-8 py-4 bg-primary text-[#111813] font-semibold rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200 text-center"
              >
                Start Free Trial
              </Link>
              <Link
                href="/auth/admin"
                className="px-8 py-4 bg-white border-2 border-gray-200 text-[#111813] font-semibold rounded-full hover:border-primary hover:text-primary transition-all duration-200 text-center"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
            <img
              src={heroImage}
              alt="WaiterCall enterprise dashboard"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="mt-32 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-[#111813]">
              The Service Gap That Costs You Revenue
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Traditional table service creates friction points that impact customer experience and bottom line. 
              Modern restaurants need intelligent, instant communication systems.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-left max-w-5xl mx-auto">
            <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-8 space-y-4 relative">
              <div className="absolute top-6 right-6">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl font-bold">
                  ✕
                </div>
              </div>
              <div className="text-red-600 font-bold text-lg">The Traditional Approach</div>
              <h3 className="text-2xl font-semibold text-[#111813]">Manual Service Requests</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Customers wave hands or shout for attention</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Staff miss urgent requests during peak hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>15-20% average order abandonment due to poor service</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Negative reviews impact long-term revenue</span>
                </li>
              </ul>
            </div>
            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-8 space-y-4 relative">
              <div className="absolute top-6 right-6">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
              </div>
              <div className="text-green-600 font-bold text-lg">The WaiterCall Solution</div>
              <h3 className="text-2xl font-semibold text-[#111813]">Intelligent Service Management</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span>Instant QR-based requests to assigned staff</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span>Real-time dashboard prevents missed opportunities</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span>60% faster response times, 25% higher check averages</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span>Data-driven insights for operational excellence</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-32 space-y-12 text-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold">
              Enterprise Features
            </p>
            <h2 className="text-4xl font-bold text-[#111813]">Built for Restaurant Excellence</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Powerful capabilities that streamline operations, enhance customer experience, 
              and drive measurable revenue growth for modern restaurants.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
            {[
              {
                icon: '⚡',
                title: 'Instant Service Requests',
                benefit: 'Reduce customer wait time by 60%',
                desc: 'QR-powered requests connect customers directly to assigned staff, eliminating missed opportunities and improving service speed.',
              },
              {
                icon: '📊',
                title: 'Real-Time Operations Dashboard',
                benefit: 'Increase staff efficiency by 40%',
                desc: 'Live monitoring of table status, staff performance, and service metrics enables proactive management and optimal resource allocation.',
              },
              {
                icon: '📈',
                title: 'Advanced Analytics & Insights',
                benefit: 'Boost revenue by 25% through data',
                desc: 'Comprehensive reporting on peak hours, response times, and customer patterns to optimize staffing and service strategies.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 group"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#111813] mb-2">{feature.title}</h3>
                <p className="text-primary font-semibold mb-3">{feature.benefit}</p>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="mt-32 space-y-12 text-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold">
              Trusted by Industry Leaders
            </p>
            <h2 className="text-4xl font-bold text-[#111813]">Results That Speak for Themselves</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Restaurant owners and managers share their experience with measurable improvements 
              in service quality, operational efficiency, and revenue growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-left max-w-5xl mx-auto">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <blockquote className="text-gray-700 text-lg leading-relaxed italic">
                "WaiterCall transformed our operations. Service response time improved by 65%, 
                and we saw a 22% increase in average check value within the first quarter. 
                The ROI was immediate and substantial."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  SC
                </div>
                <div>
                  <p className="font-semibold text-[#111813]">Sarah Chen</p>
                  <p className="text-sm text-gray-500">Owner, The Gourmet Bistro</p>
                  <p className="text-xs text-primary font-medium">15+ tables • Fine Dining</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <blockquote className="text-gray-700 text-lg leading-relaxed italic">
                "The real-time dashboard keeps our team perfectly synchronized during rush hours. 
                Customer complaints about service delays dropped by 80%, and staff satisfaction 
                improved significantly. Essential for modern restaurant management."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                  MR
                </div>
                <div>
                  <p className="font-semibold text-[#111813]">Marco Rivera</p>
                  <p className="text-sm text-gray-500">Operations Manager, La Familia Trattoria</p>
                  <p className="text-xs text-primary font-medium">25+ tables • Casual Dining</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-32 space-y-12 text-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold">
              Transparent Pricing
            </p>
            <h2 className="text-4xl font-bold text-[#111813]">Scale with Your Business</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Flexible plans designed for restaurants of all sizes. No hidden fees, 
              no long-term contracts, and instant setup for immediate value.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-left max-w-6xl mx-auto">
            {[
              {
                title: 'Starter',
                price: '$49',
                period: '/month',
                description: 'Perfect for small cafes and bistros getting started with digital service.',
                features: [
                  'Up to 15 Tables',
                  'QR Code Service Requests',
                  'Basic Waiter Dashboard',
                  'Email Support',
                  'Mobile-Optimized Interface'
                ],
                button: 'Start Free Trial',
                highlight: false,
              },
              {
                title: 'Professional',
                price: '$99',
                period: '/month',
                description: 'Ideal for growing restaurants that need advanced analytics and priority support.',
                features: [
                  'Up to 50 Tables',
                  'All Starter Features',
                  'Advanced Analytics Dashboard',
                  'Priority Customer Support',
                  'Custom QR Code Branding',
                  'Staff Performance Tracking'
                ],
                button: 'Start Free Trial',
                highlight: true,
              },
              {
                title: 'Enterprise',
                price: 'Custom',
                period: '',
                description:
                  'Comprehensive solutions for large chains and restaurant groups with multiple locations.',
                features: [
                  'Unlimited Tables',
                  'All Professional Features',
                  'Dedicated Account Manager',
                  'Custom Integrations',
                  'Advanced Security Features',
                  'Multi-Location Management'
                ],
                button: 'Contact Sales',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.title}
                className={`rounded-2xl border p-8 bg-white shadow-sm space-y-6 relative ${
                  plan.highlight
                    ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                    : 'border-gray-200'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-[#111813] px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-[#111813]">{plan.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#111813]">{plan.price}</span>
                    <span className="text-lg text-gray-500">{plan.period}</span>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">{plan.description}</p>
                <ul className="space-y-3 text-gray-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.title === 'Enterprise' ? '/auth/admin' : '/auth/admin/signup'}
                  className={`block w-full text-center px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-primary text-[#111813] hover:bg-primary/90 shadow-md hover:shadow-lg'
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
        <section className="mt-32 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-12 text-center space-y-6 border border-primary/20">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-[#111813]">
              Ready to Transform Your Restaurant Service?
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Join hundreds of successful restaurants using WaiterCall to improve operational efficiency, 
              enhance customer satisfaction, and drive measurable revenue growth.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/admin/signup"
              className="px-8 py-4 bg-primary text-[#111813] font-semibold rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all duration-200"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/auth/admin"
              className="px-8 py-4 bg-white border-2 border-gray-300 text-[#111813] font-semibold rounded-full hover:border-primary hover:text-primary transition-all duration-200"
            >
              Schedule a Consultation
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-20 py-12 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold text-sm">
                ●
              </div>
              <span className="font-bold text-xl text-[#111813]">WaiterCall</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-600">
              <Link href="/#about" className="hover:text-primary transition-colors duration-200">
                About Us
              </Link>
              <Link href="/#contact" className="hover:text-primary transition-colors duration-200">
                Contact
              </Link>
              <Link href="/#privacy" className="hover:text-primary transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/#terms" className="hover:text-primary transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} WaiterCall. All rights reserved.</p>
            <p className="mt-2">Enterprise-grade restaurant service management platform</p>
          </div>
        </footer>
      </div>
    </main>
  )
}

