'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TableModal from './components/TableModal'
import WaiterModal from './components/WaiterModal'
import PromotionModal from './components/PromotionModal'
import WaiterAssignmentModal from './components/WaiterAssignmentModal'

interface Restaurant {
  id: string
  name: string
  slug: string
  email: string
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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

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

  useEffect(() => {
    fetchData()
  }, [restaurantId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuOpen) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [accountMenuOpen])

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">●</span>
            </div>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
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
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-xl">settings</span>
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  search
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">account_circle</span>
                </button>
                
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{restaurant?.name || 'Admin'}</p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <button
                      onClick={() => {
                        setAccountMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
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
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tables</h3>
              <button
                onClick={() => {
                  setSelectedTable(null)
                  setTableModalOpen(true)
                }}
                className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
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
                        <div className="flex items-center gap-2">
                          <a
                            href={`/table/${table.qrCode}`}
                            target="_blank"
                            className="text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            View
                          </a>
                          <button
                            onClick={() => {
                              setSelectedTable(table)
                              setTableModalOpen(true)
                            }}
                            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                          >
                            Delete
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
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Waiters</h3>
              <button
                onClick={() => {
                  setSelectedWaiter(null)
                  setWaiterModalOpen(true)
                }}
                className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
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
                        <div className="flex items-center gap-2">
                          <a
                            href={`/waiter/${waiter.id}`}
                            target="_blank"
                            className="text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            View
                          </a>
                          <button
                            onClick={() => {
                              setSelectedWaiterForAssignment(waiter)
                              setAssignmentModalOpen(true)
                            }}
                            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWaiter(waiter)
                              setWaiterModalOpen(true)
                            }}
                            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteWaiter(waiter.id)}
                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                          >
                            Delete
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
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Promotions</h3>
              <button
                onClick={() => {
                  setSelectedPromotion(null)
                  setPromotionModalOpen(true)
                }}
                className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPromotion(promo)
                              setPromotionModalOpen(true)
                            }}
                            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="text-red-600 hover:text-red-900 font-medium text-sm"
                          >
                            Delete
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
        </main>

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
      </div>
    </div>
  )
}

