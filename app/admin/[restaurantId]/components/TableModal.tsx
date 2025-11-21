'use client'

import { useState, useEffect } from 'react'

interface Table {
  id: string
  number: string
  qrCode: string
  isActive: boolean
}

interface TableModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { number: string; isActive: boolean }) => Promise<void>
  table?: Table | null
  restaurantId: string
}

export default function TableModal({ isOpen, onClose, onSave, table, restaurantId }: TableModalProps) {
  const [number, setNumber] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (table) {
      setNumber(table.number)
      setIsActive(table.isActive)
    } else {
      setNumber('')
      setIsActive(true)
    }
  }, [table, isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ number, isActive })
      onClose()
    } catch (error) {
      console.error('Error saving table:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {table ? 'Edit Table' : 'Create New Table'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Table Number
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              placeholder="e.g., T1, Table 5"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
          {table && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">QR Code:</p>
              <code className="text-xs">{table.qrCode}</code>
              <a
                href={`/table/${table.qrCode}`}
                target="_blank"
                className="block mt-2 text-indigo-600 hover:text-indigo-800 text-sm"
              >
                View QR Page →
              </a>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : table ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}




