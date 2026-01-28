'use client'

import Link from 'next/link'

export default function PrivacyPolicyPage() {
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

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-[#111813] mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">Last Updated: January 28, 2024</h2>
              <p className="leading-relaxed">
                WaiterCall ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our restaurant service management platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">1. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Name, email address, phone number</li>
                    <li>Restaurant name and location</li>
                    <li>Job title and company information</li>
                    <li>Payment information for billing</li>
                    <li>Login credentials and authentication data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Usage Data</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Service request patterns and frequency</li>
                    <li>Staff performance metrics</li>
                    <li>Table turnover rates</li>
                    <li>Response times and service analytics</li>
                    <li>Device and browser information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Technical Data</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>IP address and location data</li>
                    <li>Cookies and tracking technologies</li>
                    <li>System performance and error logs</li>
                    <li>Mobile device identifiers</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain the WaiterCall service</li>
                <li>Process transactions and manage billing</li>
                <li>Send service notifications and updates</li>
                <li>Analyze usage patterns to improve our services</li>
                <li>Provide customer support and technical assistance</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Communicate about new features and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">3. Information Sharing</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">We Do Not Sell Your Personal Information</h3>
                  <p>We never sell, rent, or trade your personal information to third parties for marketing purposes.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Limited Sharing</h3>
                  <p>We may share information only in the following circumstances:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>Service Providers:</strong> Third-party vendors who help operate our service (payment processors, hosting providers)</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                    <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                    <li><strong>Safety:</strong> To protect our rights, property, or safety, or that of our users</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">4. Data Security</h2>
              <p className="mb-4">We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure data centers with restricted access</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection</li>
                <li>Access controls and authentication systems</li>
                <li>Data backup and disaster recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">5. Data Retention</h2>
              <p className="mb-4">We retain your information only as long as necessary for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing our services to you</li>
                <li>Complying with legal obligations</li>
                <li>Resolving disputes and enforcing our agreements</li>
                <li>Fulfilling legitimate business purposes</li>
              </ul>
              <p>When data is no longer needed, we securely delete or anonymize it.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">6. Your Rights</h2>
              <p className="mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to certain uses of your information</li>
                <li><strong>Restriction:</strong> Limit how we process your information</li>
              </ul>
              <p>To exercise these rights, contact us at servicesmart541@gmail.com</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content and features</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p>You can control cookie settings through your browser preferences.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">8. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">9. Children's Privacy</h2>
              <p>
                WaiterCall is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website and sending you an email notification for significant changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">11. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Email:</strong> servicesmart541@gmail.com</p>
                <p className="mb-2"><strong>Phone:</strong> +254 741 485 512</p>
                <p><strong>Address:</strong> Nairobi, Kenya</p>
              </div>
              <p className="mt-4">
                If you have questions about this Privacy Policy or how we handle your information, please contact us using the details above.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <Link
                href="/terms"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ← View Terms & Conditions
              </Link>
              <Link
                href="/"
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
