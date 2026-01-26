'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Waiter {
  id: string
  name: string
  email?: string
  phone?: string
  accessCode?: string
  isActive: boolean
  restaurantId: string
}

interface ProfileForm {
  fullName: string
  email: string
  phone: string
}

interface NotificationSettings {
  soundAlerts: boolean
  vibrationAlerts: boolean
  desktopPush: boolean
}

export default function WaiterProfilePage() {
  const params = useParams()
  const router = useRouter()
  const waiterId = params.waiterId as string
  
  const [waiter, setWaiter] = useState<Waiter | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    email: '',
    phone: '',
  })
  
  const [originalForm, setOriginalForm] = useState<ProfileForm>(form)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    soundAlerts: true,
    vibrationAlerts: true,
    desktopPush: false,
  })

  const [assignedTables] = useState([
    { id: '1', number: '12' },
    { id: '2', number: '14' },
  ])

  useEffect(() => {
    fetchWaiterData()
  }, [waiterId])

  useEffect(() => {
    const hasFormChanges = JSON.stringify(form) !== JSON.stringify(originalForm)
    setHasChanges(hasFormChanges)
  }, [form, originalForm])

  async function fetchWaiterData() {
    try {
      const response = await fetch(`/api/waiters/${waiterId}`)
      if (response.ok) {
        const data = await response.json()
        setWaiter(data)
        
        const newForm: ProfileForm = {
          fullName: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        }
        
        setForm(newForm)
        setOriginalForm(newForm)
      }
    } catch (error) {
      console.error('Failed to fetch waiter data:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: keyof ProfileForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleNotificationChange(setting: keyof NotificationSettings, value: boolean) {
    setNotifications(prev => ({ ...prev, [setting]: value }))
  }

  async function handleSave() {
    setSaving(true)
    
    try {
      // Mock save - in real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setOriginalForm(form)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    fetch('/api/auth/waiter/logout', { method: 'POST' })
      .then(() => router.push('/waiter/login'))
      .catch(() => router.push('/waiter/login'))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-semibold text-gray-900">waitercall</span>
          </div>
        </div>

        {/* User Summary */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-600">
                {waiter?.name?.charAt(0).toUpperCase() || 'W'}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{waiter?.name || 'Waiter'}</div>
              <div className="text-sm text-gray-500">Waiter</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
              <span className="material-symbols-outlined">person</span>
              Profile
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
              <span className="material-symbols-outlined">notifications</span>
              Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
              <span className="material-symbols-outlined">table_restaurant</span>
              My Tables
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

          <div className="space-y-6 max-w-4xl">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* User Identity Section */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-600">
                      {waiter?.name?.charAt(0).toUpperCase() || 'W'}
                    </span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{waiter?.name || 'Waiter'}</h2>
                  <p className="text-gray-500">{waiter?.email || 'waiter@restaurant.com'}</p>
                </div>
              </div>

              {/* Personal Information Form */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Save Action */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                  >
                    {saving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-gray-900">Sound Alerts</div>
                    <div className="text-sm text-gray-500">Play sound for new table requests</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('soundAlerts', !notifications.soundAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.soundAlerts ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        notifications.soundAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-gray-900">Vibration Alerts</div>
                    <div className="text-sm text-gray-500">Vibrate on mobile devices for alerts</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('vibrationAlerts', !notifications.vibrationAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.vibrationAlerts ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        notifications.vibrationAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-gray-900">Desktop Push Notifications</div>
                    <div className="text-sm text-gray-500">Show desktop notifications for new requests</div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('desktopPush', !notifications.desktopPush)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      notifications.desktopPush ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        notifications.desktopPush ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Shift & Tables Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-4">Shift: 4:00 PM – 10:00 PM</div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4">Currently Assigned Tables</h3>
                
                <div className="grid grid-cols-4 gap-4">
                  {assignedTables.map((table) => (
                    <div key={table.id} className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center h-24">
                      <span className="material-symbols-outlined text-2xl text-gray-600 mb-1">table_restaurant</span>
                      <span className="font-medium text-gray-900">{table.number}</span>
                    </div>
                  ))}
                  
                  {/* Add Table Card */}
                  <button className="border-2 border-dashed border-green-300 rounded-lg p-4 flex flex-col items-center justify-center h-24 hover:border-green-500 hover:bg-green-50 transition-all duration-200">
                    <span className="material-symbols-outlined text-2xl text-green-600 mb-1">add</span>
                    <span className="text-sm font-medium text-green-600">Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
