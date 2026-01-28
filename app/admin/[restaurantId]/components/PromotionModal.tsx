'use client'

import { useState, useEffect, useRef } from 'react'

interface Promotion {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  linkUrl: string | null
  isActive: boolean
  displayOrder: number
  startDate: string | null
  endDate: string | null
}

interface PromotionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    description?: string
    imageUrl?: string
    linkUrl?: string
    isActive: boolean
    displayOrder: number
    startDate?: string
    endDate?: string
  }) => Promise<void>
  promotion?: Promotion | null
  restaurantId: string
}

export default function PromotionModal({ isOpen, onClose, onSave, promotion, restaurantId }: PromotionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [displayOrder, setDisplayOrder] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (promotion) {
      setTitle(promotion.title)
      setDescription(promotion.description || '')
      setImageUrl(promotion.imageUrl || '')
      setLinkUrl(promotion.linkUrl || '')
      setIsActive(promotion.isActive)
      setDisplayOrder(promotion.displayOrder)
      setStartDate(promotion.startDate ? promotion.startDate.split('T')[0] : '')
      setEndDate(promotion.endDate ? promotion.endDate.split('T')[0] : '')
      setImagePreview(promotion.imageUrl || '')
    } else {
      setTitle('')
      setDescription('')
      setImageUrl('')
      setLinkUrl('')
      setIsActive(true)
      setDisplayOrder(0)
      setStartDate('')
      setEndDate('')
      setImagePreview('')
      setImageFile(null)
      setUploadError('')
    }
  }, [promotion, isOpen])

  if (!isOpen) return null

  async function handleImageUpload(file: File) {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.')
      return
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 2MB')
      return
    }

    setUploadingImage(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/restaurants/${restaurantId}/promotions/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setImageUrl(data.imageUrl)
      setImagePreview(data.imageUrl)
      setImageFile(file)
      setUploadError('')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  function handleRemoveImage() {
    setImageUrl('')
    setImagePreview('')
    setImageFile(null)
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function isFormValid() {
    return title.trim() !== '' && imageUrl.trim() !== ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!isFormValid()) {
      return
    }

    setLoading(true)
    try {
      await onSave({
        title,
        description,
        imageUrl,
        linkUrl,
        isActive,
        displayOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      onClose()
    } catch (error) {
      console.error('Error saving promotion:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">
            {promotion ? 'Edit Promotion' : 'Create New Promotion'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Image *
              </label>
              
              {!imagePreview ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-600 transition-colors"
                  >
                    <div className="text-center">
                      <span className="material-symbols-outlined text-green-600 text-2xl mb-2">
                        cloud_upload
                      </span>
                      <p className="text-sm text-gray-600">
                        {uploadingImage ? 'Uploading...' : 'Click to upload promotion image'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, JPEG, PNG, WEBP (max 2MB)
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Promotion preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  {imageFile && (
                    <div className="text-sm text-gray-600">
                      <p>File: {imageFile.name}</p>
                      <p>Size: {(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="mt-2 text-sm text-red-600">
                  {uploadError}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link URL
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mr-2 text-green-600 focus:ring-green-600"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid() || uploadingImage}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : promotion ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}










