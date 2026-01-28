// Centralized UI styling utilities for consistent design

export const colors = {
  ACTIVE_GREEN: '#16a34a',    // Tailwind green-600
  HOVER_GREEN: '#15803d',    // Tailwind green-700
  DISABLED_GRAY: '#9ca3af',  // Tailwind gray-400
  HOVER_GRAY: '#6b7280',     // Tailwind gray-500
  DESTRUCTIVE_RED: '#dc2626' // Tailwind red-600
}

// Icon styling based on state
export const iconClass = (active: boolean = true, clickable: boolean = true) => {
  if (!clickable || !active) {
    return 'text-gray-400 cursor-not-allowed'
  }
  return 'text-green-600 hover:text-green-700 cursor-pointer transition-colors'
}

// Button styling based on state
export const buttonClass = (enabled: boolean = true, isPrimary: boolean = true) => {
  const base = 'font-medium rounded-lg transition-all duration-200'
  
  if (!enabled) {
    return `${base} bg-gray-300 text-gray-500 cursor-not-allowed`
  }
  
  if (isPrimary) {
    return `${base} bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md`
  }
  
  return `${base} border border-green-600 text-green-600 hover:bg-green-50`
}

// Mobile-optimized button (full width, larger touch targets)
export const mobileButtonClass = (enabled: boolean = true, isPrimary: boolean = true) => {
  const base = 'w-full py-3 text-base font-medium rounded-lg transition-all duration-200'
  
  if (!enabled) {
    return `${base} bg-gray-300 text-gray-500 cursor-not-allowed`
  }
  
  if (isPrimary) {
    return `${base} bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md`
  }
  
  return `${base} border border-green-600 text-green-600 hover:bg-green-50`
}

// Mobile-optimized icon button (minimum 44px tap target)
export const mobileIconButtonClass = (active: boolean = true) => {
  return `min-w-[44px] min-h-[44px] flex items-center justify-center ${iconClass(active)}`
}

// Sidebar navigation styling
export const sidebarNavClass = (isActive: boolean) => {
  const base = 'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200'
  
  if (isActive) {
    return `${base} bg-green-600 text-white shadow-sm`
  }
  
  return `${base} text-gray-700 hover:bg-green-50 hover:text-green-700`
}

// Table action button styling
export const tableActionClass = (enabled: boolean = true) => {
  const base = 'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200'
  
  if (!enabled) {
    return `${base} text-gray-400 cursor-not-allowed`
  }
  
  return `${base} text-green-600 hover:bg-green-50 hover:text-green-700`
}

// Mobile table action styling (stacked vertically)
export const mobileTableActionClass = (enabled: boolean = true) => {
  const base = 'w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200'
  
  if (!enabled) {
    return `${base} text-gray-400 cursor-not-allowed`
  }
  
  return `${base} text-green-600 border border-green-200 hover:bg-green-50 hover:text-green-700`
}

// Form input styling
export const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200'

// Mobile form input styling (larger for touch)
export const mobileInputClass = 'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200'

// Card styling
export const cardClass = 'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200'

// Mobile card styling (more touch-friendly spacing)
export const mobileCardClass = 'bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4'
