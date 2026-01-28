'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  buttonClass, 
  mobileButtonClass, 
  sidebarNavClass, 
  iconClass,
  inputClass,
  mobileInputClass,
  cardClass 
} from '@/lib/ui/styles'

interface Restaurant {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  logoUrl?: string
  menuUrl?: string
}

interface SettingsForm {
  restaurantName: string
  supportEmail: string
  timezone: string
  currency: string
  autoRefresh: boolean
  menuUrl: string
}

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
]

type SettingsSection = 'general' | 'tables' | 'account' | 'team' | 'notifications' | 'billing' | 'integrations'

const settingsSections = [
  { id: 'general', label: 'General', icon: 'settings', description: 'Basic restaurant information' },
  { id: 'tables', label: 'Tables', icon: 'table_restaurant', description: 'Table management and QR codes' },
  { id: 'account', label: 'Account', icon: 'person', description: 'Account settings and preferences' },
  { id: 'team', label: 'Team', icon: 'group', description: 'Team members and permissions' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', description: 'Alert and notification preferences' },
  { id: 'billing', label: 'Billing', icon: 'payments', description: 'Subscription and billing information' },
  { id: 'integrations', label: 'Integrations', icon: 'integration_instructions', description: 'Third-party integrations' },
]

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [sessionRestaurantId, setSessionRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [form, setForm] = useState<SettingsForm>({
    restaurantName: '',
    supportEmail: '',
    timezone: 'America/New_York',
    currency: 'USD',
    autoRefresh: true,
    menuUrl: '',
  })

  const [originalForm, setOriginalForm] = useState<SettingsForm>(form)

  useEffect(() => {
    // CRITICAL: Get restaurant ID from session, not URL params
    async function getRestaurantFromSession() {
      try {
        const response = await fetch('/api/restaurants/user')
        if (response.ok) {
          const data = await response.json()
          setSessionRestaurantId(data.id)
          fetchRestaurant(data.id)
          loadLocalSettings(data.id)
        } else {
          console.error('Failed to get restaurant from session')
          setLoading(false)
        }
      } catch (error) {
        console.error('Error getting restaurant from session:', error)
        setLoading(false)
      }
    }

    getRestaurantFromSession()
  }, [])

  function loadLocalSettings(restaurantId: string) {
    const localKey = `restaurant-settings-${restaurantId}`
    const localSettings = localStorage.getItem(localKey)
    
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings)
        setForm(prev => ({
          ...prev,
          timezone: parsed.timezone || 'America/New_York',
          currency: parsed.currency || 'USD',
          autoRefresh: parsed.autoRefresh !== false,
        }))
      } catch (error) {
        console.error('Failed to load local settings:', error)
      }
    }
  }

  function saveLocalSettings() {
    if (!sessionRestaurantId) return
    const localKey = `restaurant-settings-${sessionRestaurantId}`
    const settingsToSave = {
      timezone: form.timezone,
      currency: form.currency,
      autoRefresh: form.autoRefresh,
    }
    localStorage.setItem(localKey, JSON.stringify(settingsToSave))
  }

  useEffect(() => {
    const hasFormChanges = JSON.stringify(form) !== JSON.stringify(originalForm)
    setHasChanges(hasFormChanges)
  }, [form, originalForm])

  async function fetchRestaurant(restaurantId: string) {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        setRestaurant(data)
        
        const newForm: SettingsForm = {
          restaurantName: data.name || '',
          supportEmail: data.email || '',
          timezone: form.timezone, // Keep from localStorage
          currency: form.currency, // Keep from localStorage
          autoRefresh: form.autoRefresh, // Keep from localStorage
          menuUrl: data.menuUrl || '',
        }
        
        setForm(newForm)
        setOriginalForm(newForm)
      } else {
        console.error('Failed to fetch restaurant:', response.statusText)
        setSaveError('Failed to load restaurant data')
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
      setSaveError('Failed to load restaurant data')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: keyof SettingsForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!sessionRestaurantId) {
      setSaveError('No restaurant session found')
      return
    }

    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    
    try {
      // Save API data (name, email, menuUrl, and logoUrl)
      const response = await fetch(`/api/restaurants/${sessionRestaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.restaurantName,
          email: form.supportEmail,
          menuUrl: form.menuUrl,
          logoUrl: logoPreview || restaurant?.logoUrl,
        }),
      })

      if (response.ok) {
        const updatedRestaurant = await response.json()
        setRestaurant(updatedRestaurant)
        saveLocalSettings()
        setOriginalForm(form)
        setSaveSuccess(true)
        setSaveError(null)
        
        // Clear logo preview after successful save
        if (logoPreview) {
          setLogoPreview(null)
        }
        
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setSaveError(errorData.error || 'Failed to save settings')
        setSaveSuccess(false)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveError('Failed to save settings. Please try again.')
      setSaveSuccess(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(file: File) {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setSaveError('Please upload a PNG, JPG, or SVG file')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('File size must be less than 2MB')
      return
    }

    setUploadingLogo(true)
    setSaveError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Logo uploaded successfully:', data)
        setLogoPreview(data.logoUrl)
        setSaveError(null)
      } else {
        const errorData = await response.json()
        setSaveError(errorData.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Failed to upload logo:', error)
      setSaveError('Failed to upload logo. Please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  function handleLogoRemove() {
    setLogoPreview(null)
    // In a real implementation, you would also delete from storage
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      handleLogoUpload(file)
    }
  }

  function handleDiscard() {
    setForm(originalForm)
    setHasChanges(false)
  }

  function renderSectionContent() {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Restaurant Logo */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Restaurant Logo</h3>
                <p className="text-sm font-medium text-gray-900">Upload Restaurant Logo</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  {/* Logo Preview/Upload Area */}
                  <div
                    onClick={() => !uploadingLogo && document.getElementById('logo-upload')?.click()}
                    className={`relative w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      uploadingLogo ? 'cursor-not-allowed opacity-60' : 'hover:border-green-500 hover:bg-green-50'
                    }`}
                  >
                    {logoPreview || restaurant?.logoUrl ? (
                      <img
                        src={logoPreview || restaurant?.logoUrl}
                        alt="Restaurant Logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="material-symbols-outlined text-3xl text-gray-400 mb-1">cloud_upload</span>
                        <span className="text-xs text-gray-500">Upload</span>
                      </div>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-3">Click the upload area or choose file below</p>
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                          onChange={handleLogoChange}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                        <label
                          htmlFor="logo-upload"
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 ${
                            uploadingLogo
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">upload_file</span>
                          {uploadingLogo ? 'Uploading...' : 'Choose File'}
                        </label>
                        {(logoPreview || restaurant?.logoUrl) && (
                          <button
                            onClick={handleLogoRemove}
                            className="ml-3 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>💡 <strong>Tip:</strong> Click the dashed box above to quickly upload</p>
                        <p>📁 Formats: PNG, JPG, SVG (max 2MB)</p>
                        <p>📐 Recommended: Square image, at least 200x200px</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Information */}
            <div className={cardClass + ' p-6'}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Restaurant Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={form.restaurantName}
                    onChange={(e) => handleChange('restaurantName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={form.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Regional Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    {currencies.map(curr => (
                      <option key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name} ({curr.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Menu */}
            <div className={cardClass + ' p-6'}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Menu</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu URL
                  </label>
                  <input
                    type="url"
                    value={form.menuUrl}
                    onChange={(e) => handleChange('menuUrl', e.target.value)}
                    className={inputClass}
                    placeholder="https://restaurant.com/menu"
                  />
                  <p className="mt-1 text-sm text-gray-500">Customers can view this menu from the QR code landing page</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'tables':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl text-gray-400">table_restaurant</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Table Management</h3>
              <p className="text-gray-600 mb-6">Manage your restaurant tables and generate QR codes</p>
              <button
                onClick={() => router.push(`/admin/${restaurantId}`)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Tables
              </button>
            </div>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                  <p className="text-sm text-gray-600">Manage your account details and security settings</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Password</h4>
                  <p className="text-sm text-gray-600">Change your password and enable two-factor authentication</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'team':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl text-gray-400">group</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Team Management</h3>
              <p className="text-gray-600 mb-6">Add team members and manage their permissions</p>
              <button
                onClick={() => router.push(`/admin/${restaurantId}`)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Manage Team
              </button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive email updates about your restaurant</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Get instant alerts for waiter calls</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl text-gray-400">payments</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Billing & Subscription</h3>
              <p className="text-gray-600 mb-6">Manage your subscription and payment methods</p>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Current Plan: Free</p>
                  <p className="text-xs text-green-600 mt-1">Upgrade to unlock premium features</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        )

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Integrations</h3>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">POS Systems</h4>
                      <p className="text-sm text-gray-600">Connect with your existing POS system</p>
                    </div>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                      Connect
                    </button>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Payment Processors</h4>
                      <p className="text-sm text-gray-600">Integrate with payment providers</p>
                    </div>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant settings and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as SettingsSection)}
                  className={sidebarNavClass(activeSection === section.id)}
                >
                  <span className="material-symbols-outlined text-lg">
                    {section.icon}
                  </span>
                  <div className="text-left">
                    <div>{section.label}</div>
                    <div className={`text-xs ${activeSection === section.id ? 'text-white/80' : 'text-gray-500'}`}>
                      {section.description}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderSectionContent()}

            {/* Save Button (only show for general settings) */}
            {activeSection === 'general' && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  {saveSuccess && (
                    <p className="text-sm text-green-600">✅ Settings saved successfully!</p>
                  )}
                  {saveError && (
                    <p className="text-sm text-red-600">❌ {saveError}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
                  {hasChanges && (
                    <button
                      onClick={handleDiscard}
                      disabled={saving}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={buttonClass(hasChanges, true)}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>© {new Date().getFullYear()} WaiterCall. All rights reserved.</p>
            <div className="flex items-center justify-center gap-6">
              <Link href="/privacy" className="hover:text-green-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-green-600 transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact-sales" className="hover:text-green-600 transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
