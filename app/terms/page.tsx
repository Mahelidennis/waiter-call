'use client'

import Link from 'next/link'

export default function TermsAndConditionsPage() {
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
          <h1 className="text-4xl font-bold text-[#111813] mb-8">Terms & Conditions</h1>
          
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">Last Updated: January 28, 2024</h2>
              <p className="leading-relaxed">
                These Terms & Conditions ("Terms") govern your use of WaiterCall, a restaurant service management platform operated by WaiterCall ("we," "our," or "us"). By accessing or using our service, you agree to be bound by these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using WaiterCall, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">2. Service Description</h2>
              <p className="mb-4">WaiterCall is a restaurant service management platform that includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>QR-based customer service requests</li>
                <li>Real-time staff dashboard and notifications</li>
                <li>Table management and analytics</li>
                <li>Performance metrics and reporting</li>
                <li>Customer experience optimization tools</li>
                <li>Multi-location management capabilities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">3. Account Registration and Security</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Registration Requirements</h3>
                  <p>To use WaiterCall, you must:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Be at least 18 years of age</li>
                    <li>Provide accurate, complete, and current information</li>
                    <li>Have authority to bind your restaurant or business</li>
                    <li>Maintain and update your account information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Account Security</h3>
                  <p>You are responsible for:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Maintaining the confidentiality of your login credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of unauthorized access</li>
                    <li>Using strong, unique passwords</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">4. Subscription Plans and Payment</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Subscription Tiers</h3>
                  <p>We offer the following subscription plans:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong>Starter ($49/month):</strong> Up to 15 tables, basic features</li>
                    <li><strong>Professional ($99/month):</strong> Up to 50 tables, advanced features</li>
                    <li><strong>Enterprise (Custom):</strong> Unlimited tables, premium features</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Payment Terms</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Payments are processed monthly or annually</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>We reserve the right to change pricing with 30 days notice</li>
                    <li>Failed payments may result in service suspension</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Free Trial</h3>
                  <p>New customers may receive a 14-day free trial with full access to Professional features. No credit card is required for the trial period.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">5. Acceptable Use</h2>
              <p className="mb-4">You agree to use WaiterCall only for lawful purposes and in accordance with these Terms. You must not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service to transmit malicious code or viruses</li>
                <li>Impersonate any person or entity</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Use the service to harass, abuse, or harm others</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">6. User Content and Data</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Your Content</h3>
                  <p>You retain ownership of any content you upload or create using WaiterCall. However, you grant us a license to:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Store, process, and analyze your data to provide the service</li>
                    <li>Use anonymized data for service improvement and analytics</li>
                    <li>Create aggregated insights that don't identify individual restaurants</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Data Backup and Recovery</h3>
                  <p>We maintain regular backups of your data but recommend you also keep independent backups of critical information.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">7. Service Availability and Support</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Service Level</h3>
                  <p>We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance when possible.</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Customer Support</h3>
                  <p>Support is available via:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Email: servicesmart541@gmail.com</li>
                    <li>Phone: +254 741 485 512</li>
                    <li>Response times vary by subscription tier</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">8. Intellectual Property</h2>
              <p className="mb-4">WaiterCall and all related content, features, and functionality are owned by WaiterCall and protected by copyright, trademark, and other intellectual property laws.</p>
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Copy, modify, or distribute our proprietary materials</li>
                <li>Use our trademarks without permission</li>
                <li>Create derivative works based on our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">9. Confidentiality</h2>
              <p>
                Both parties agree to keep confidential all proprietary information, trade secrets, and business information learned during the use of WaiterCall. This obligation survives termination of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">10. Termination</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Termination by You</h3>
                  <p>You may terminate your account at any time by:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Contacting customer support</li>
                    <li>Cancelling your subscription in account settings</li>
                    <li>No refunds for unused time, except as required by law</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Termination by Us</h3>
                  <p>We may suspend or terminate your account for:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Violation of these Terms</li>
                    <li>Non-payment of fees</li>
                    <li>Illegal or harmful use of the service</li>
                    <li>Extended inactivity (after 12 months)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">11. Disclaimers and Limitations</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Service Disclaimer</h3>
                  <p>WaiterCall is provided "as is" without warranties of any kind. We do not guarantee:</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Uninterrupted or error-free service</li>
                    <li>Specific business results or outcomes</li>
                    <li>Compatibility with all devices or systems</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#111813] mb-2">Limitation of Liability</h3>
                  <p>
                    To the maximum extent permitted by law, WaiterCall shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless WaiterCall, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law principles. Any disputes shall be resolved in the courts of Nairobi, Kenya.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">14. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our website and sending you an email notification. Continued use of the service constitutes acceptance of the changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">15. General Provisions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and WaiterCall</li>
                <li><strong>Severability:</strong> If any provision is invalid, the remaining terms remain in effect</li>
                <li><strong>No Waiver:</strong> Failure to enforce any provision does not waive our right to enforce it later</li>
                <li><strong>Assignment:</strong> You may not assign these Terms without our written consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#111813] mb-4">16. Contact Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Email:</strong> servicesmart541@gmail.com</p>
                <p className="mb-2"><strong>Phone:</strong> +254 741 485 512</p>
                <p><strong>Address:</strong> Nairobi, Kenya</p>
              </div>
              <p className="mt-4">
                If you have questions about these Terms & Conditions, please contact us using the details above.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <Link
                href="/privacy"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                ← View Privacy Policy
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
