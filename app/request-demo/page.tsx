'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RequestDemoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    restaurantName: '',
    restaurantType: '',
    location: '',
    currentChallenges: '',
    hearAboutUs: '',
    preferredDate: '',
    preferredTime: '',
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
        New Demo Request from WaiterCall Landing Page
        
        Personal Information:
        Name: ${formData.firstName} ${formData.lastName}
        Email: ${formData.email}
        Phone: ${formData.phone}
        
        Restaurant Information:
        Restaurant Name: ${formData.restaurantName}
        Restaurant Type: ${formData.restaurantType}
        Location: ${formData.location}
        
        Demo Preferences:
        Preferred Date: ${formData.preferredDate}
        Preferred Time: ${formData.preferredTime}
        Current Challenges: ${formData.currentChallenges}
        
        Submitted: ${new Date().toLocaleString()}
      `
      
      // Create mailto link with email content
      const mailtoLink = `mailto:servicesmart541@gmail.com?subject=New Demo Request - ${formData.restaurantName}&body=${encodeURIComponent(emailContent)}`
      
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
            <h1 className="text-3xl font-bold text-[#111813] mb-4">Demo Request Received!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Thank you for your interest in WaiterCall. Our team will contact you within 24 hours to schedule your personalized demo.
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
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Form */}
          <div>
            <h1 className="text-4xl font-bold text-[#111813] mb-4">Request a Demo</h1>
            <p className="text-xl text-gray-600 mb-8">
              See how WaiterCall can transform your restaurant operations. Schedule a personalized demo with our team.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111813]">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
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
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              {/* Restaurant Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111813]">Restaurant Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Type *
                  </label>
                  <select
                    name="restaurantType"
                    value={formData.restaurantType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  >
                    <option value="">Select type</option>
                    <option value="fine-dining">Fine Dining</option>
                    <option value="casual-dining">Casual Dining</option>
                    <option value="fast-casual">Fast Casual</option>
                    <option value="cafe">Cafe</option>
                    <option value="bar-pub">Bar/Pub</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="City, State/Country"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              {/* Demo Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#111813]">Demo Preferences</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  >
                    <option value="">Select time</option>
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="evening">Evening (5PM - 8PM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Challenges
                  </label>
                  <textarea
                    name="currentChallenges"
                    value={formData.currentChallenges}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tell us about your current service challenges..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Request Demo'}
              </button>
            </form>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-8">
            {/* Quick Contact Options */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-[#111813] mb-6">Quick Contact Options</h3>
              <div className="space-y-4">
                <Link
                  href="tel:+254741485512"
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">call</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111813]">Call Us</p>
                    <p className="text-sm text-gray-600">+254 741 485 512</p>
                  </div>
                </Link>

                <Link
                  href="mailto:servicesmart541@gmail.com"
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">email</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111813]">Email Us</p>
                    <p className="text-sm text-gray-600">servicesmart541@gmail.com</p>
                  </div>
                </Link>

                <Link
                  href="/contact-sales"
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">business</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111813]">Contact Sales</p>
                    <p className="text-sm text-gray-600">Enterprise solutions</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Why WaiterCall */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-[#111813] mb-4">Why Choose WaiterCall?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Reduce customer wait times by 60%</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Increase staff efficiency by 40%</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">Boost revenue by 25% through data insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-gray-700">14-day free trial, no credit card required</span>
                </li>
              </ul>
            </div>

            {/* Live Chat */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">Need Immediate Help?</h3>
              <p className="text-green-100 mb-4">Our team is available 24/7 to answer your questions.</p>
              <button className="w-full px-4 py-2 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors">
                Start Live Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
