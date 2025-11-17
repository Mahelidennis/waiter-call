'use client'

import { useState, useEffect } from 'react'

interface Table {
  id: string
  number: string
  qrCode: string
  isActive: boolean
}

interface Waiter {
  id: string
  name: string
  assignedTables?: Array<{
    table: {
      id: string
      number: string
    }
  }>
}

interface WaiterAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  waiter: Waiter | null
  tables: Table[]
  restaurantId: string
  onSave: (waiterId: string, tableIds: string[]) => Promise<void>
}

export default function WaiterAssignmentModal({
  isOpen,
  onClose,
  waiter,
  tables,
  restaurantId,
  onSave,
}: WaiterAssignmentModalProps) {
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (waiter && waiter.assignedTables) {
      setSelectedTableIds(waiter.assignedTables.map((at) => at.table.id))
    } else {
      setSelectedTableIds([])
    }
  }, [waiter, isOpen])

  if (!isOpen || !waiter) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!waiter) return
    setLoading(true)
    try {
      await onSave(waiter.id, selectedTableIds)
      onClose()
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Failed to save assignment')
    } finally {
      setLoading(false)
    }
  }

  function toggleTable(tableId: string) {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId]
    )
  }

  const activeTables = tables.filter((t) => t.isActive)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Assign Tables to {waiter.name}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Select the tables this waiter will be responsible for. When customers at these tables call for a waiter, this waiter will be notified.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Tables
            </label>
            {activeTables.length === 0 ? (
              <p className="text-gray-500 text-sm">No active tables available</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {activeTables.map((table) => {
                  const isSelected = selectedTableIds.includes(table.id)
                  return (
                    <label
                      key={table.id}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTable(table.id)}
                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {table.number}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {selectedTableIds.length > 0 && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-indigo-900 mb-1">
                Selected: {selectedTableIds.length} table(s)
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTableIds.map((tableId) => {
                  const table = tables.find((t) => t.id === tableId)
                  return (
                    <span
                      key={tableId}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {table?.number}
                    </span>
                  )
                })}
              </div>
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
              {loading ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

