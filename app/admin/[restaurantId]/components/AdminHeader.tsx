'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface AdminHeaderProps {
  currentPage?: string
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '' },
  { id: 'tables', label: 'Tables', href: '/tables' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
  { id: 'settings', label: 'Settings', href: '/settings' },
]

export default function AdminHeader({ currentPage }: AdminHeaderProps) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const restaurantId = params.restaurantId as string
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // Determine active nav item
  const getActiveNav = () => {
    if (pathname.includes('/settings')) return 'settings'
    if (pathname.includes('/tables')) return 'tables'
    if (pathname.includes('/analytics')) return 'analytics'
    return 'dashboard'
  }

  const activeNav = getActiveNav()

  function handleLogout() {
    fetch('/api/auth/admin/logout', { method: 'POST' })
      .then(() => router.push('/auth/admin'))
      .catch(() => router.push('/auth/admin'))
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand & Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <button
              onClick={() => router.push(`/admin/${restaurantId}`)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-semibold text-gray-900">WaiterCall</span>
            </button>

            {/* Primary Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const href = `/admin/${restaurantId}${item.href}`
                const isActive = activeNav === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(href)}
                    className={`relative text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-primary'
                        : 'text-gray-600 hover:text-primary'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Center/Right Section - Search & Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden lg:block">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search settings..."
                  className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-primary transition-colors duration-200">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                <span className="text-sm font-medium text-gray-700">A</span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      router.push(`/admin/${restaurantId}/settings`)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Account
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      router.push(`/admin/${restaurantId}/settings`)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden px-6 pb-3">
        <button className="p-2 text-gray-600 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
      </div>

      {/* Click outside handler for profile menu */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileMenuOpen(false)}
        />
      )}
    </header>
  )
}
