'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

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

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
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
    fetchRestaurant()
    loadLocalSettings()
  }, [restaurantId])

  function loadLocalSettings() {
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
    const localKey = `restaurant-settings-${restaurantId}`
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

  async function fetchRestaurant() {
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
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: keyof SettingsForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      // Save API data (name and email)
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.restaurantName,
          email: form.supportEmail,
          menuUrl: form.menuUrl,
        }),
      })

      if (response.ok) {
        // Save local settings
        saveLocalSettings()
        
        // Update original form to reflect saved state
        setOriginalForm(form)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    setForm(originalForm)
    setHasChanges(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">General Settings</h1>
        <p className="text-gray-600">Configure your restaurant profile and regional preferences.</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6 pb-24">
        {/* Restaurant Profile */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Restaurant Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                value={form.restaurantName}
                onChange={(e) => handleChange('restaurantName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                placeholder="Enter restaurant name"
              />
              <p className="mt-1 text-sm text-gray-500">Visible to customers on the call interface</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                placeholder="support@restaurant.com"
              />
              <p className="mt-1 text-sm text-gray-500">Used for billing notifications and system alerts</p>
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Localization</h2>
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
              <p className="mt-1 text-sm text-gray-500">Determines timestamps for calls and analytics</p>
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
              <p className="mt-1 text-sm text-gray-500">Primary currency for billing and reports</p>
            </div>
          </div>
        </div>

        {/* Dashboard Behavior */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard Behavior</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-refresh</label>
                <p className="mt-1 text-sm text-gray-500">Automatically refresh waiter dashboards every 30 seconds</p>
              </div>
              <button
                onClick={() => handleChange('autoRefresh', !form.autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  form.autoRefresh ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    form.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Customer Menu */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Menu</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Menu URL
              </label>
              <input
                type="url"
                value={form.menuUrl}
                onChange={(e) => handleChange('menuUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                placeholder="https://restaurant.com/menu"
              />
              <p className="mt-1 text-sm text-gray-500">Customers can view this menu from the QR code landing page</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              You have unsaved changes
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-3 z-50 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </span>
            Settings saved successfully
          </div>
        </div>
      )}
    </div>
  )
}
