'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background-light text-[#111813]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="WaiterCall Logo" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl text-[#111813]">WaiterCall</span>
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-[#111813] transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#111813] mb-6">
            Transforming Restaurant
            <span className="text-green-600"> Service</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to revolutionize restaurant service management through innovative technology 
            that connects customers with staff instantly, improving efficiency and enhancing dining experiences.
          </p>
        </section>

        {/* Our Story */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#111813] mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  WaiterCall was born from a simple observation: restaurant service inefficiencies were costing 
                  businesses revenue and customers frustration. Our founders, experienced restaurant industry 
                  professionals, witnessed firsthand how missed service requests and slow response times impacted 
                  both staff morale and customer satisfaction.
                </p>
                <p className="leading-relaxed">
                  In 2023, we set out to create a solution that would bridge the communication gap between 
                  customers and restaurant staff. What started as a simple QR-based request system has evolved 
                  into a comprehensive restaurant management platform trusted by hundreds of establishments across 
                  Kenya and beyond.
                </p>
                <p className="leading-relaxed">
                  Today, WaiterCall continues to innovate, adding new features and capabilities based on real 
                  feedback from restaurant owners, managers, and staff who use our platform daily.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-4xl font-bold">WC</span>
              </div>
              <h3 className="text-2xl font-bold text-[#111813] mb-4">Founded in 2023</h3>
              <p className="text-gray-600">Based in Nairobi, Kenya</p>
              <div className="mt-6 space-y-2">
                <div className="text-3xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-600">Restaurants Served</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-green-600 text-2xl">rocket_launch</span>
              </div>
              <h3 className="text-2xl font-bold text-[#111813] mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To empower restaurants with innovative technology that enhances service efficiency, 
                improves customer satisfaction, and drives business growth through seamless communication 
                between customers and staff.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-green-600 text-2xl">visibility</span>
              </div>
              <h3 className="text-2xl font-bold text-[#111813] mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To become the leading restaurant service management platform in Africa, transforming 
                how restaurants operate and creating exceptional dining experiences through technology 
                that's simple, powerful, and accessible to all.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#111813] mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: 'speed',
                title: 'Speed & Efficiency',
                description: 'We believe fast service is great service. Our platform is designed for maximum efficiency.'
              },
              {
                icon: 'support_agent',
                title: 'Customer Focus',
                description: 'Every feature we build is centered on improving the customer and staff experience.'
              },
              {
                icon: 'trending_up',
                title: 'Continuous Innovation',
                description: 'We constantly evolve our platform based on customer feedback and industry needs.'
              },
              {
                icon: 'handshake',
                title: 'Partnership',
                description: 'We see our clients as partners in success, providing support every step of the way.'
              }
            ].map((value, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-600 text-2xl">{value.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#111813] mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#111813] mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The passionate people behind WaiterCall</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Maheli Shavanga',
                role: 'CEO & Co-Founder',
                description: 'Visionary leader with expertise in restaurant technology and business innovation, driving WaiterCall\'s mission to transform restaurant service.',
                initials: 'MS'
              },
              {
                name: 'David Kimani',
                role: 'CTO & Co-Founder',
                description: 'Software engineer specializing in restaurant technology solutions and platform architecture.',
                initials: 'DK'
              },
              {
                name: 'Amina Hassan',
                role: 'Head of Customer Success',
                description: 'Customer experience expert passionate about restaurant operations and client satisfaction.',
                initials: 'AH'
              }
            ].map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">{member.initials}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#111813] mb-2">{member.name}</h3>
                <p className="text-green-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Impact Metrics */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-8">Our Impact</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { number: '60%', label: 'Faster Service Times' },
                { number: '40%', label: 'Staff Efficiency Increase' },
                { number: '25%', label: 'Revenue Growth for Clients' },
                { number: '500+', label: 'Happy Restaurant Partners' }
              ].map((metric, index) => (
                <div key={index}>
                  <div className="text-4xl font-bold mb-2">{metric.number}</div>
                  <div className="text-green-100">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-[#111813] mb-4">Ready to Transform Your Restaurant?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of restaurants already using WaiterCall to enhance their service and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/request-demo"
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
            >
              Schedule a Demo
            </Link>
            <Link
              href="/contact-sales"
              className="px-8 py-4 bg-white border-2 border-gray-300 text-[#111813] font-semibold rounded-full hover:border-green-600 hover:text-green-600 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
