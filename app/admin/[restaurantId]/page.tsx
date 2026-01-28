'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TableModal from './components/TableModal'
import WaiterModal from './components/WaiterModal'
import PromotionModal from './components/PromotionModal'
import WaiterAssignmentModal from './components/WaiterAssignmentModal'
import AdminHeader from './components/AdminHeader'
import QRModal from './components/QRModal'
import { 
  iconClass, 
  buttonClass, 
  mobileButtonClass, 
  sidebarNavClass, 
  tableActionClass, 
  mobileTableActionClass,
  cardClass 
} from '@/lib/ui/styles'

interface Restaurant {
  id: string
  name: string
  slug: string
  email: string
  logoUrl?: string
}

interface Table {
  id: string
  number: string
  qrCode: string
  isActive: boolean
}

interface Waiter {
  id: string
  name: string
  email: string | null
  phone: string | null
  isActive: boolean
  assignedTables?: Array<{
    table: {
      id: string
      number: string
    }
  }>
}

interface Call {
  id: string
  tableId: string
  status: string
  requestedAt: string
  handledAt: string | null
  responseTime: number | null
  table: {
    number: string
  }
}

export default function AdminPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [waiters, setWaiters] = useState<Waiter[]>([])
  const [calls, setCalls] = useState<Call[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'waiters' | 'promotions' | 'calls'>('overview')
  const [accessCodeInfo, setAccessCodeInfo] = useState<{ code: string; waiterName: string } | null>(null)
  
  // Modal states
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [waiterModalOpen, setWaiterModalOpen] = useState(false)
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null)
  const [promotionModalOpen, setPromotionModalOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [selectedWaiterForAssignment, setSelectedWaiterForAssignment] = useState<Waiter | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedTableForQR, setSelectedTableForQR] = useState<Table | null>(null)

  async function handleLogout() {
    try {
      await fetch('/api/auth/admin/logout', {
        method: 'POST',
      })
      router.push('/auth/admin')
    } catch (error) {
      // Even if the API call fails, redirect to login
      router.push('/auth/admin')
    }
  }

  function handleViewQR(table: Table) {
    setSelectedTableForQR(table)
    setQrModalOpen(true)
  }

  function handleDownloadQR(table: Table) {
    const baseUrl = window.location.origin
    const qrUrl = `${baseUrl}/api/qr/${table.qrCode}`
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${table.number.replace(/\s+/g, '-').toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    fetchData()
  }, [restaurantId])

  async function fetchData() {
    try {
      const [restaurantRes, tablesRes, waitersRes, promotionsRes, callsRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}`),
        fetch(`/api/restaurants/${restaurantId}/tables`),
        fetch(`/api/restaurants/${restaurantId}/waiters`),
        fetch(`/api/restaurants/${restaurantId}/promotions`),
        fetch(`/api/calls?restaurantId=${restaurantId}`),
      ])

      if (restaurantRes.ok) {
        const data = await restaurantRes.json()
        setRestaurant(data)
      }

      if (tablesRes.ok) {
        const data = await tablesRes.json()
        setTables(data)
      }

      if (waitersRes.ok) {
        const data = await waitersRes.json()
        setWaiters(data)
      }

      if (promotionsRes.ok) {
        const data = await promotionsRes.json()
        setPromotions(data)
      }

      if (callsRes.ok) {
        const data = await callsRes.json()
        setCalls(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Table CRUD functions
  async function handleCreateTable(data: { number: string; isActive: boolean }) {
    const response = await fetch(`/api/restaurants/${restaurantId}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create table')
    fetchData()
  }

  async function handleUpdateTable(data: { number: string; isActive: boolean }) {
    if (!selectedTable) return
    const response = await fetch(`/api/tables/${selectedTable.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update table')
    fetchData()
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm('Are you sure you want to delete this table?')) return
    const response = await fetch(`/api/tables/${tableId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete table')
    fetchData()
  }

  // Waiter CRUD functions
  async function handleCreateWaiter(data: { name: string; email?: string; phone?: string; isActive: boolean }) {
    const response = await fetch(`/api/restaurants/${restaurantId}/waiters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create waiter')
    const payload = await response.json()
    if (payload?.accessCode) {
      setAccessCodeInfo({
        code: payload.accessCode,
        waiterName: payload.waiter?.name || 'Waiter',
      })
    }
    fetchData()
  }

  async function handleUpdateWaiter(data: { name: string; email?: string; phone?: string; isActive: boolean }) {
    if (!selectedWaiter) return
    const response = await fetch(`/api/waiters/${selectedWaiter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update waiter')
    fetchData()
  }

  async function handleDeleteWaiter(waiterId: string) {
    if (!confirm('Are you sure you want to delete this waiter?')) return
    const response = await fetch(`/api/waiters/${waiterId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete waiter')
    fetchData()
  }

  // Promotion CRUD functions
  async function handleCreatePromotion(data: any) {
    const response = await fetch(`/api/restaurants/${restaurantId}/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create promotion')
    fetchData()
  }

  async function handleUpdatePromotion(data: any) {
    if (!selectedPromotion) return
    const response = await fetch(`/api/promotions/${selectedPromotion.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update promotion')
    fetchData()
  }

  async function handleDeletePromotion(promotionId: string) {
    if (!confirm('Are you sure you want to delete this promotion?')) return
    const response = await fetch(`/api/promotions/${promotionId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete promotion')
    fetchData()
  }

  // Waiter assignment function
  async function handleAssignTables(waiterId: string, tableIds: string[]) {
    const response = await fetch(`/api/waiters/${waiterId}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableIds }),
    })
    if (!response.ok) throw new Error('Failed to assign tables')
    fetchData()
  }

  async function handleResetAccessCode(waiter: Waiter) {
    if (!confirm(`Reset access code for ${waiter.name}?`)) return
    const response = await fetch(`/api/waiters/${waiter.id}/access-code`, {
      method: 'POST',
    })
    if (!response.ok) {
      alert('Failed to reset access code')
      return
    }
    const payload = await response.json()
    if (payload?.accessCode) {
      setAccessCodeInfo({
        code: payload.accessCode,
        waiterName: waiter.name,
      })
    }
    fetchData()
  }

  // Calculate analytics
  const totalCalls = calls.length
  const pendingCalls = calls.filter(c => c.status === 'PENDING').length
  const handledCalls = calls.filter(c => c.status === 'HANDLED').length
  const avgResponseTime = handledCalls > 0
    ? Math.round(
        calls
          .filter(c => c.responseTime)
          .reduce((sum, c) => sum + (c.responseTime || 0), 0) / handledCalls
      )
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="WaiterCall Logo" 
              className="h-8 w-auto"
            />
            <span className="font-semibold text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => router.push(`/admin/${restaurantId}/settings`)}
            className="p-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
              { id: 'tables', label: 'Tables', icon: 'table_restaurant' },
              { id: 'waiters', label: 'Waiters', icon: 'badge' },
              { id: 'promotions', label: 'Promos', icon: 'campaign' },
              { id: 'calls', label: 'Analytics', icon: 'bar_chart' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center gap-1 px-4 py-3 min-w-[80px] transition-colors ${
                  activeTab === item.id
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <img 
                src="/logo.png" 
                alt="WaiterCall Logo" 
                className="h-10 w-auto"
              />
            <div>
              <h1 className="font-semibold text-gray-900">{restaurant?.name || 'Restaurant'}</h1>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {[
                { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
                { id: 'tables', label: 'Tables', icon: 'table_restaurant' },
                { id: 'waiters', label: 'Waiters', icon: 'badge' },
                { id: 'promotions', label: 'Promotions', icon: 'campaign' },
                { id: 'calls', label: 'Analytics', icon: 'bar_chart' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={sidebarNavClass(activeTab === item.id)}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-1">
              <button 
                onClick={() => router.push(`/admin/${restaurantId}/settings`)}
                className={sidebarNavClass(false)}
              >
                <span className="material-symbols-outlined text-xl">settings</span>
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-xl">phone_in_talk</span>
                  </div>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalCalls}</p>
                <p className="text-sm text-gray-600">Service Calls</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 text-xl">pending</span>
                  </div>
                  <span className="text-sm text-gray-500">Active</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{pendingCalls}</p>
                <p className="text-sm text-gray-600">Pending Calls</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
                  </div>
                  <span className="text-sm text-gray-500">Completed</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{handledCalls}</p>
                <p className="text-sm text-gray-600">Handled Calls</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 text-xl">timer</span>
                  </div>
                  <span className="text-sm text-gray-500">Average</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{avgResponseTime}s</p>
                <p className="text-sm text-gray-600">Response Time</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {calls.slice(0, 10).map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          call.status === 'PENDING' ? 'bg-orange-500' : 'bg-green-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">Table {call.table.number}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(call.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        call.status === 'PENDING'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {call.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className={cardClass}>
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Tables</h3>
              <button
                onClick={() => {
                  setSelectedTable(null)
                  setTableModalOpen(true)
                }}
                className={buttonClass(true, true)}
              >
                Add Table
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tables.map((table) => (
                    <tr key={table.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600 text-sm">table_restaurant</span>
                          </div>
                          <span className="font-medium text-gray-900">{table.number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">{table.qrCode}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          table.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {table.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Desktop: Inline actions */}
                        <div className="hidden sm:flex items-center gap-2">
                          <button
                            onClick={() => handleViewQR(table)}
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                            View QR
                          </button>
                          <button
                            onClick={() => handleDownloadQR(table)}
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Download
                          </button>
                          <a
                            href={`/table/${table.qrCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            Test
                          </a>
                          <button
                            onClick={() => {
                              setSelectedTable(table)
                              setTableModalOpen(true)
                            }}
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Delete
                          </button>
                        </div>
                        
                        {/* Mobile: Stacked actions */}
                        <div className="sm:hidden space-y-2">
                          <button
                            onClick={() => handleViewQR(table)}
                            className={mobileTableActionClass(true)}
                          >
                            <span className="material-symbols-outlined">qr_code_scanner</span>
                            View QR Code
                          </button>
                          <button
                            onClick={() => handleDownloadQR(table)}
                            className={mobileTableActionClass(true)}
                          >
                            <span className="material-symbols-outlined">download</span>
                            Download QR
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTable(table)
                              setTableModalOpen(true)
                            }}
                            className={mobileTableActionClass(true)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                            Edit Table
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 border border-red-200 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined">delete</span>
                            Delete Table
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'waiters' && (
          <div className={cardClass}>
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Waiters</h3>
              <button
                onClick={() => {
                  setSelectedWaiter(null)
                  setWaiterModalOpen(true)
                }}
                className={buttonClass(true, true)}
              >
                Add Waiter
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tables</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waiters.map((waiter) => (
                    <tr key={waiter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600 text-sm">person</span>
                          </div>
                          <span className="font-medium text-gray-900">{waiter.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{waiter.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {waiter.assignedTables && waiter.assignedTables.length > 0 ? (
                          <div className="flex gap-1">
                            {waiter.assignedTables.map((at) => (
                              <span key={at.table.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {at.table.number}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No tables</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          waiter.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {waiter.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Desktop: Inline actions */}
                        <div className="hidden sm:flex items-center gap-2">
                          <a
                            href={`/waiter/${waiter.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">person</span>
                            View
                          </a>
                          <button
                            onClick={() => {
                              setSelectedWaiterForAssignment(waiter)
                              setAssignmentModalOpen(true)
                            }}
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">table_restaurant</span>
                            Assign
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWaiter(waiter)
                              setWaiterModalOpen(true)
                            }}
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteWaiter(waiter.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Delete
                          </button>
                        </div>
                        
                        {/* Mobile: Stacked actions */}
                        <div className="sm:hidden space-y-2">
                          <a
                            href={`/waiter/${waiter.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={mobileTableActionClass(true)}
                          >
                            <span className="material-symbols-outlined">person</span>
                            View Waiter
                          </a>
                          <button
                            onClick={() => {
                              setSelectedWaiterForAssignment(waiter)
                              setAssignmentModalOpen(true)
                            }}
                            className={mobileTableActionClass(true)}
                          >
                            <span className="material-symbols-outlined">table_restaurant</span>
                            Assign Tables
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWaiter(waiter)
                              setWaiterModalOpen(true)
                            }}
                            className={mobileTableActionClass(true)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                            Edit Waiter
                          </button>
                          <button
                            onClick={() => handleDeleteWaiter(waiter.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 border border-red-200 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined">delete</span>
                            Delete Waiter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className={cardClass}>
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Promotions</h3>
              <button
                onClick={() => {
                  setSelectedPromotion(null)
                  setPromotionModalOpen(true)
                }}
                className={buttonClass(true, true)}
              >
                Add Promotion
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promotions.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{promo.title}</td>
                      <td className="px-6 py-4 text-gray-600">{promo.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Desktop: Inline actions */}
                        <div className="hidden sm:flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPromotion(promo)
                              setPromotionModalOpen(true)
                            }}
                            className={tableActionClass(true)}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Delete
                          </button>
                        </div>
                        
                        {/* Mobile: Stacked actions */}
                        <div className="sm:hidden space-y-2">
                          <button
                            onClick={() => {
                              setSelectedPromotion(promo)
                              setPromotionModalOpen(true)
                            }}
                            className={mobileTableActionClass(true)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                            Edit Promotion
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 border border-red-200 hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined">delete</span>
                            Delete Promotion
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'calls' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Call Analytics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-600 text-sm">table_restaurant</span>
                          </div>
                          <span className="font-medium text-gray-900">{call.table.number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          call.status === 'PENDING'
                            ? 'bg-orange-100 text-orange-700'
                            : call.status === 'HANDLED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(call.requestedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {call.responseTime ? `${call.responseTime}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        <TableModal
          isOpen={tableModalOpen}
          onClose={() => {
            setTableModalOpen(false)
            setSelectedTable(null)
          }}
          onSave={selectedTable ? handleUpdateTable : handleCreateTable}
          table={selectedTable}
          restaurantId={restaurantId}
        />

        <WaiterModal
          isOpen={waiterModalOpen}
          onClose={() => {
            setWaiterModalOpen(false)
            setSelectedWaiter(null)
          }}
          onSave={selectedWaiter ? handleUpdateWaiter : handleCreateWaiter}
          waiter={selectedWaiter}
          restaurantId={restaurantId}
        />

        <PromotionModal
          isOpen={promotionModalOpen}
          onClose={() => {
            setPromotionModalOpen(false)
            setSelectedPromotion(null)
          }}
          onSave={selectedPromotion ? handleUpdatePromotion : handleCreatePromotion}
          promotion={selectedPromotion}
          restaurantId={restaurantId}
        />

        <WaiterAssignmentModal
          isOpen={assignmentModalOpen}
          onClose={() => {
            setAssignmentModalOpen(false)
            setSelectedWaiterForAssignment(null)
          }}
          waiter={selectedWaiterForAssignment}
          tables={tables}
          restaurantId={restaurantId}
          onSave={handleAssignTables}
        />

        {accessCodeInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Waiter Access Code</h3>
              <p className="text-gray-600 text-sm">
                Provide this code to <span className="font-medium text-gray-900">{accessCodeInfo.waiterName}</span>.
                It will not be shown again.
              </p>
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700">Access Code</span>
                <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                  {accessCodeInfo.code}
                </span>
              </div>
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
                Save this code securely. Reset to generate a new one.
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setAccessCodeInfo(null)}
                  className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {selectedTableForQR && (
          <QRModal
            isOpen={qrModalOpen}
            onClose={() => {
              setQrModalOpen(false)
              setSelectedTableForQR(null)
            }}
            table={selectedTableForQR}
            restaurantName={restaurant?.name || 'Restaurant'}
          />
        )}
        </div>
      </main>
      </div>
    </div>
  )
}
