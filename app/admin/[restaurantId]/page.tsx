'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
    <div className="relative flex min-h-screen w-full flex-row bg-background-light dark:bg-background-dark">
      {/* SideNavBar */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-background-dark dark:border-r dark:border-primary/20">
        <div className="flex flex-col gap-4 p-4 h-full justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">table_restaurant</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                  {restaurant?.name || 'Restaurant'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                  Admin Panel
                </p>
              </div>
            </div>
            <nav className="flex flex-col gap-2 mt-4">
              <button
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-primary/20 text-gray-900 dark:text-white'
                    : 'hover:bg-primary/10 text-gray-900 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                <span className="material-symbols-outlined text-gray-900 dark:text-gray-300">
                  dashboard
                </span>
                <p className="text-sm font-medium leading-normal">Dashboard</p>
              </button>
              <button
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'tables'
                    ? 'bg-primary/20 text-gray-900 dark:text-white'
                    : 'hover:bg-primary/10 text-gray-900 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('tables')}
              >
                <span className="material-symbols-outlined text-gray-900 dark:text-gray-300">
                  table_restaurant
                </span>
                <p className="text-gray-900 dark:text-gray-300 text-sm font-medium leading-normal">
                  Tables
                </p>
              </button>
              <button
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'waiters'
                    ? 'bg-primary/20 text-gray-900 dark:text-white'
                    : 'hover:bg-primary/10 text-gray-900 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('waiters')}
              >
                <span className="material-symbols-outlined text-gray-900 dark:text-gray-300">
                  badge
                </span>
                <p className="text-gray-900 dark:text-gray-300 text-sm font-medium leading-normal">
                  Waiters
                </p>
              </button>
              <button
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'promotions'
                    ? 'bg-primary/20 text-gray-900 dark:text-white'
                    : 'hover:bg-primary/10 text-gray-900 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('promotions')}
              >
                <span className="material-symbols-outlined text-gray-900 dark:text-gray-300">
                  campaign
                </span>
                <p className="text-gray-900 dark:text-gray-300 text-sm font-medium leading-normal">
                  Promotions
                </p>
              </button>
              <button
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'calls'
                    ? 'bg-primary/20 text-gray-900 dark:text-white'
                    : 'hover:bg-primary/10 text-gray-900 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('calls')}
              >
                <span className="material-symbols-outlined text-gray-900 dark:text-gray-300">
                  bar_chart
                </span>
                <p className="text-gray-900 dark:text-gray-300 text-sm font-medium leading-normal">
                  Analytics
                </p>
              </button>
            </nav>
          </div>
          <div className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors duration-200">
              <span className="material-symbols-outlined text-gray-900 dark:text-gray-300">
                settings
              </span>
              <p className="text-gray-900 dark:text-gray-300 text-sm font-medium leading-normal">
                Settings
              </p>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors duration-200">
              <span className="material-symbols-outlined text-gray-900 dark:text-gray-300">
                logout
              </span>
              <p className="text-gray-900 dark:text-gray-300 text-sm font-medium leading-normal">
                Log Out
              </p>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col">
        {/* TopNavBar */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 dark:border-primary/20 bg-white dark:bg-background-dark px-4 md:px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-4 md:gap-8">
            <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              Dashboard
            </h2>
            <label className="hidden sm:flex flex-col min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-gray-500 dark:text-gray-400 flex border-none bg-background-light dark:bg-black/20 items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-background-light dark:bg-black/20 h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  placeholder="Search"
                />
              </div>
            </label>
          </div>
          <div className="flex gap-3">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-background-light dark:bg-black/20 text-gray-900 dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </button>
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-background-light dark:bg-black/20 text-gray-900 dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* Tabs (top of content area on mobile) */}
        <div className="px-4 md:px-6 py-4 border-b md:hidden bg-white dark:bg-background-dark">
          <div className="flex gap-3 overflow-x-auto">
            {(['overview', 'tables', 'waiters', 'promotions', 'calls'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-primary text-background-dark'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900">{totalCalls}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{pendingCalls}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Handled</p>
                <p className="text-3xl font-bold text-green-600">{handledCalls}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Avg Response</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {avgResponseTime}s
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Calls</h3>
              <div className="space-y-2">
                {calls.slice(0, 10).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">Table {call.table.number}</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        call.status === 'PENDING'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {call.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(call.requestedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tables</h2>
              <button
                onClick={() => {
                  setSelectedTable(null)
                  setTableModalOpen(true)
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add Table
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      QR Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tables.map((table) => (
                    <tr key={table.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {table.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {table.qrCode}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            table.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {table.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <a
                            href={`/table/${table.qrCode}`}
                            target="_blank"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View QR
                          </a>
                          <button
                            onClick={() => {
                              setSelectedTable(table)
                              setTableModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="text-red-600 hover:text-red-900"
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Waiters</h2>
              <button
                onClick={() => {
                  setSelectedWaiter(null)
                  setWaiterModalOpen(true)
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add Waiter
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Assigned Tables
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waiters.map((waiter) => (
                    <tr key={waiter.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {waiter.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {waiter.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {waiter.assignedTables && waiter.assignedTables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {waiter.assignedTables.map((at) => (
                              <span
                                key={at.table.id}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {at.table.number}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No tables assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            waiter.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {waiter.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/waiter/${waiter.id}`}
                            target="_blank"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Dashboard
                          </a>
                          <button
                            onClick={() => {
                              setSelectedWaiterForAssignment(waiter)
                              setAssignmentModalOpen(true)
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="Assign Tables"
                          >
                            Assign Tables
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWaiter(waiter)
                              setWaiterModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetAccessCode(waiter)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Reset access code"
                          >
                            Reset Access Code
                          </button>
                          <button
                            onClick={() => handleDeleteWaiter(waiter.id)}
                            className="text-red-600 hover:text-red-900"
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Promotions</h2>
              <button
                onClick={() => {
                  setSelectedPromotion(null)
                  setPromotionModalOpen(true)
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add Promotion
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotions.map((promo) => (
                    <tr key={promo.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {promo.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {promo.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            promo.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPromotion(promo)
                              setPromotionModalOpen(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="text-red-600 hover:text-red-900"
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
          <div>
            <h2 className="text-xl font-semibold mb-4">All Calls</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Response Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {call.table.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            call.status === 'PENDING'
                              ? 'bg-orange-100 text-orange-700'
                              : call.status === 'HANDLED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(call.requestedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.responseTime ? `${call.responseTime}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
            <div className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">Access Code</span>
              <span className="text-2xl font-mono font-bold tracking-widest text-indigo-700">
                {accessCodeInfo.code}
              </span>
            </div>
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
              Save this code securely. Reset to generate a new one.
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setAccessCodeInfo(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}

