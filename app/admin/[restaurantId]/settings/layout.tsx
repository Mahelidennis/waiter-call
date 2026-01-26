'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const settingsSections = [
  {
    id: 'general',
    label: 'General',
    href: '',
    icon: 'settings',
  },
  {
    id: 'account',
    label: 'Account',
    href: '/account',
    icon: 'person',
  },
  {
    id: 'team',
    label: 'Team',
    href: '/team',
    icon: 'group',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: 'notifications',
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/billing',
    icon: 'payments',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    href: '/integrations',
    icon: 'integration_instructions',
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const restaurantId = params.restaurantId as string
  
  const currentSection = settingsSections.find(section => 
    pathname.endsWith(section.href) || (section.href === '' && pathname.endsWith('/settings'))
  )?.id || 'general'

  return (
    <div className="flex h-full">
      {/* Settings Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        </div>
        
        <nav className="px-4 pb-6">
          <div className="space-y-1">
            {settingsSections.map((section) => {
              const href = `/admin/${restaurantId}/settings${section.href}`
              const isActive = currentSection === section.id
              
              return (
                <Link
                  key={section.id}
                  href={href}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">
                    {section.icon}
                  </span>
                  {section.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
