'use client'

import { useState } from 'react'
import { X, Download, Printer } from 'lucide-react'

interface QRModalProps {
  isOpen: boolean
  onClose: () => void
  table: {
    id: string
    number: string
    qrCode: string
  }
  restaurantName: string
}

export default function QRModal({ isOpen, onClose, table, restaurantName }: QRModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  if (!isOpen) return null

  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}` 
    : 'https://waiter-call.vercel.app'
  
  const qrImageUrl = `${baseUrl}/api/qr/${table.qrCode}`
  const tableUrl = `${baseUrl}/table/${table.qrCode}`

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(qrImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-${table.number.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${restaurantName} - ${table.number}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: white;
              }
              .qr-container {
                text-align: center;
                max-width: 400px;
              }
              .qr-image {
                width: 256px;
                height: 256px;
                margin: 0 auto 20px;
                border: 2px solid #000;
              }
              .restaurant-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #000;
              }
              .table-name {
                font-size: 18px;
                margin-bottom: 20px;
                color: #333;
              }
              .instruction {
                font-size: 14px;
                color: #666;
                margin-bottom: 20px;
              }
              @media print {
                body { margin: 0; }
                .qr-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="restaurant-name">${restaurantName}</div>
              <div class="table-name">${table.number}</div>
              <img src="${qrImageUrl}" alt="QR Code" class="qr-image" />
              <div class="instruction">Scan to view menu or call a waiter</div>
              <div style="font-size: 10px; color: #999; margin-top: 10px;">${tableUrl}</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
    setTimeout(() => setIsPrinting(false), 1000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Restaurant Info */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{restaurantName}</h3>
            <p className="text-gray-600">{table.number}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
              <img 
                src={qrImageUrl} 
                alt={`QR Code for ${table.number}`}
                className="w-64 h-64"
              />
            </div>
          </div>

          {/* Instruction */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Scan to view menu or call a waiter
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {tableUrl}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Downloading...' : 'Download PNG'}
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'Printing...' : 'Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
