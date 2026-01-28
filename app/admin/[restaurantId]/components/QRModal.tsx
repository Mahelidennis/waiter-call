'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Download, Settings } from 'lucide-react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

interface QRModalProps {
  isOpen: boolean
  onClose: () => void
  table: {
    id: string
    number: string
    qrCode: string
  }
  restaurantName: string
  restaurantLogo?: string | null
}

interface PrintSettings {
  showLogo: boolean
  showTableNumber: boolean
  highResolution: boolean
  format: 'A6' | 'BusinessCard' | 'Square'
  accentColor: string
}

export default function QRModal({ isOpen, onClose, table, restaurantName, restaurantLogo }: QRModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [settings, setSettings] = useState<PrintSettings>({
    showLogo: true,
    showTableNumber: true,
    highResolution: true,
    format: 'A6',
    accentColor: '#10b981' // system green
  })
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      generateQRCode()
    }
  }, [isOpen, table.qrCode, settings.highResolution])

  const generateQRCode = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}` 
        : 'https://waiter-call.vercel.app'
      
      const tableUrl = `${baseUrl}/table/${table.qrCode}`
      const size = settings.highResolution ? 512 : 256
      
      const qrDataUrl = await QRCode.toDataURL(tableUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrDataUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const getCardDimensions = () => {
    switch (settings.format) {
      case 'A6':
        return { width: 148, height: 105 } // mm
      case 'BusinessCard':
        return { width: 90, height: 50 } // mm
      case 'Square':
        return { width: 105, height: 105 } // mm
      default:
        return { width: 148, height: 105 }
    }
  }

  const downloadPDF = async () => {
    setIsDownloading(true)
    try {
      const pdf = new jsPDF({
        orientation: settings.format === 'Square' ? 'portrait' : 'landscape',
        unit: 'mm',
        format: settings.format === 'BusinessCard' ? [90, 50] : settings.format
      })

      const dimensions = getCardDimensions()
      
      // Add subtle border
      pdf.setDrawColor(settings.accentColor)
      pdf.setLineWidth(0.5)
      pdf.roundedRect(5, 5, dimensions.width - 10, dimensions.height - 10, 3, 3)
      
      let currentY = 15

      // Restaurant logo
      if (settings.showLogo && restaurantLogo) {
        try {
          pdf.addImage(restaurantLogo, 'PNG', dimensions.width / 2 - 15, currentY, 30, 15)
          currentY += 20
        } catch (error) {
          console.log('Could not load logo')
        }
      }

      // Restaurant name
      pdf.setFontSize(settings.format === 'BusinessCard' ? 12 : 16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(restaurantName, dimensions.width / 2, currentY, { align: 'center' })
      currentY += settings.format === 'BusinessCard' ? 8 : 12

      // Table number
      if (settings.showTableNumber) {
        pdf.setFontSize(settings.format === 'BusinessCard' ? 10 : 14)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`TABLE ${table.number.toUpperCase()}`, dimensions.width / 2, currentY, { align: 'center' })
        currentY += settings.format === 'BusinessCard' ? 8 : 10
      }

      // QR Code
      if (qrDataUrl) {
        const qrSize = settings.format === 'BusinessCard' ? 25 : 40
        pdf.addImage(qrDataUrl, 'PNG', dimensions.width / 2 - qrSize / 2, currentY, qrSize, qrSize)
        currentY += qrSize + 8
      }

      // Caption
      pdf.setFontSize(settings.format === 'BusinessCard' ? 8 : 10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Scan to Call a Waiter', dimensions.width / 2, currentY, { align: 'center' })

      // Save PDF
      pdf.save(`qr-card-${table.number.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (!isOpen) return null

  const dimensions = getCardDimensions()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">QR Card Designer</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Left Panel - Print Settings */}
          <div className="w-full lg:w-80 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Print Settings
                </h3>
                
                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showLogo}
                      onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-600"
                    />
                    <span className="text-gray-700">Show restaurant logo</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showTableNumber}
                      onChange={(e) => setSettings({ ...settings, showTableNumber: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-600"
                    />
                    <span className="text-gray-700">Include table number/name</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.highResolution}
                      onChange={(e) => setSettings({ ...settings, highResolution: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-600"
                    />
                    <span className="text-gray-700">High-resolution QR code</span>
                  </label>
                </div>
              </div>

              {/* Format Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select
                  value={settings.format}
                  onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="A6">A6 Card (148 × 105 mm)</option>
                  <option value="BusinessCard">Business Card (90 × 50 mm)</option>
                  <option value="Square">Square (105 × 105 mm)</option>
                </select>
              </div>

              {/* Color Customization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: settings.accentColor }}
                    />
                    <span className="text-sm">Customize Colors</span>
                  </button>
                </div>
                
                {showColorPicker && (
                  <div className="mt-2 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="w-full h-10 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Download Button */}
              <button
                onClick={downloadPDF}
                disabled={isDownloading || !qrDataUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Generating PDF...' : 'Download PDF'}
              </button>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Printing Tips</h4>
                <p className="text-sm text-blue-800">
                  Use glossy cardstock (250gsm+) for best results. Lamination helps protect from spills.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Live Print Preview</h3>
              
              {/* Card Preview */}
              <div className="flex justify-center">
                <div 
                  ref={previewRef}
                  className="relative bg-white border-2 rounded-lg shadow-lg p-6"
                  style={{ 
                    borderColor: settings.accentColor,
                    width: '400px',
                    height: '280px',
                    aspectRatio: `${dimensions.width}/${dimensions.height}`
                  }}
                >
                  {/* Restaurant Logo */}
                  {settings.showLogo && restaurantLogo && (
                    <div className="flex justify-center mb-3">
                      <img 
                        src={restaurantLogo} 
                        alt={restaurantName}
                        className="h-12 w-auto max-w-[80px] object-contain"
                      />
                    </div>
                  )}

                  {/* Restaurant Name */}
                  <div className="text-center mb-2">
                    <h4 className="font-bold text-gray-900 text-lg">{restaurantName}</h4>
                  </div>

                  {/* Table Number */}
                  {settings.showTableNumber && (
                    <div className="text-center mb-4">
                      <p className="text-gray-700 font-semibold">TABLE {table.number.toUpperCase()}</p>
                    </div>
                  )}

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code"
                        className="border-2 border-gray-300 rounded-lg"
                        style={{ width: '120px', height: '120px' }}
                      />
                    ) : (
                      <div className="w-[120px] h-[120px] border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-100">
                        <span className="text-gray-500 text-sm">Loading...</span>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Scan to Call a Waiter</p>
                  </div>
                </div>
              </div>

              {/* Format Info */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Format: {settings.format} ({dimensions.width} × {dimensions.height} mm)</p>
                <p>Resolution: {settings.highResolution ? 'High (512px)' : 'Standard (256px)'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
