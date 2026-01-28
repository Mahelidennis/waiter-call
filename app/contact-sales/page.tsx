'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactSalesPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    jobTitle: '',
    numberOfLocations: '',
    currentSystem: '',
    annualRevenue: '',
    timeline: '',
    specificNeeds: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Send email with form data
      const emailContent = `
        New Sales Inquiry from WaiterCall Enterprise Page
        
        Company Information:
        Company Name: ${formData.companyName}
        Number of Locations: ${formData.numberOfLocations}
        Annual Revenue: ${formData.annualRevenue}
        
        Contact Information:
        Contact Name: ${formData.contactName}
        Job Title: ${formData.jobTitle}
        Email: ${formData.email}
        Phone: ${formData.phone}
        
        Requirements:
        Current System: ${formData.currentSystem}
        Implementation Timeline: ${formData.timeline}
        Specific Needs: ${formData.specificNeeds}
        
        Submitted: ${new Date().toLocaleString()}
      `
      
      // Create mailto link with email content
      const mailtoLink = `mailto:servicesmart541@gmail.com?subject=New Sales Inquiry - ${formData.companyName}&body=${encodeURIComponent(emailContent)}`
      
      // Open email client
      window.open(mailtoLink)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background-light text-[#111813]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-[#111813] mb-4">Sales Inquiry Received!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Thank you for your interest in WaiterCall Enterprise. Our sales team will contact you within 24 hours to discuss your specific needs.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#111813] mb-4">Contact Sales</h1>
          <p className="text-xl text-gray-600">
            Ready to scale your restaurant operations? Let's discuss how WaiterCall Enterprise can serve your multi-location needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111813]">Company Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Locations *
                  </label>
                  <select
                    name="numberOfLocations"
                    value={formData.numberOfLocations}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  >
                    <option value="">Select range</option>
                    <option value="1-5">1-5 locations</option>
                    <option value="6-20">6-20 locations</option>
                    <option value="21-50">21-50 locations</option>
                    <option value="51-100">51-100 locations</option>
                    <option value="100+">100+ locations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Revenue
                  </label>
                  <select
                    name="annualRevenue"
                    value={formData.annualRevenue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  >
                    <option value="">Select range</option>
                    <option value="1M-5M">$1M - $5M</option>
                    <option value="5M-20M">$5M - $20M</option>
                    <option value="20M-50M">$20M - $50M</option>
                    <option value="50M+">$50M+</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111813]">Contact Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111813]">Requirements</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Management System
                  </label>
                  <input
                    type="text"
                    name="currentSystem"
                    value={formData.currentSystem}
                    onChange={handleInputChange}
                    placeholder="e.g., Toast, Square, None"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation Timeline *
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  >
                    <option value="">Select timeline</option>
                    <option value="immediate">Immediate (within 1 month)</option>
                    <option value="1-3-months">1-3 months</option>
                    <option value="3-6-months">3-6 months</option>
                    <option value="6-months+">6+ months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Needs
                  </label>
                  <textarea
                    name="specificNeeds"
                    value={formData.specificNeeds}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe your specific requirements and challenges..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Contact Sales'}
              </button>
            </form>
          </div>

          {/* Right Column - Sales Information */}
          <div className="space-y-8">
            {/* Enterprise Features */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-[#111813] mb-4">Enterprise Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Unlimited locations and tables</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Custom integrations with existing systems</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Advanced security and compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Multi-location management dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Custom reporting and analytics</span>
                </li>
              </ul>
            </div>

            {/* Contact Methods */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-[#111813] mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">phone</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111813]">Sales Hotline</p>
                    <p className="text-sm text-gray-600">+254 741 485 512</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">email</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111813]">Email Sales</p>
                    <p className="text-sm text-gray-600">servicesmart541@gmail.com</p>
                  </div>
                </div>

                <Link
                  href="/request-demo"
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">calendar_today</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111813]">Schedule Demo</p>
                    <p className="text-sm text-gray-600">Book a personalized demo</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Success Metrics */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Proven Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">60%</div>
                  <div className="text-green-100 text-sm">Faster Service</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">40%</div>
                  <div className="text-green-100 text-sm">Staff Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">25%</div>
                  <div className="text-green-100 text-sm">Revenue Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-green-100 text-sm">Happy Clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
