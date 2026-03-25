import React, { useEffect, useState, useRef } from 'react'
import { Camera, X } from 'lucide-react'
interface Props {
  firstName: string
  lastName: string
  currentPhotoUrl?: string
  onPhotoUpdate: (url: string) => void
}
export function ProfilePictureUpload({
  firstName,
  lastName,
  currentPhotoUrl,
  onPhotoUpdate,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedFile(reader.result as string)
      }
      reader.readAsDataURL(e.target.files[0])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const initials =
    `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() ||
    'U'
  return (
    <>
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md ring-4 ring-white">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all duration-200 group-hover:scale-110"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 mb-0.5 truncate">
            {firstName || 'User'} {lastName || 'Name'}
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Manage your account information
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Change photo
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
      </div>

      {selectedFile && (
        <CropModal
          imageSrc={selectedFile}
          onClose={() => setSelectedFile(null)}
          onCrop={(croppedUrl) => {
            onPhotoUpdate(croppedUrl)
            setSelectedFile(null)
          }}
        />
      )}
    </>
  )
}
function CropModal({
  imageSrc,
  onClose,
  onCrop,
}: {
  imageSrc: string
  onClose: () => void
  onCrop: (url: string) => void
}) {
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cropPos, setCropPos] = useState({
    x: 0,
    y: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  })
  const CROP_SIZE = 240
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({
      x: clientX - cropPos.x,
      y: clientY - cropPos.y,
    })
  }
  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    if (imageRef.current && containerRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      let newX = clientX - dragStart.x
      let newY = clientY - dragStart.y
      const imgLeft = (containerRect.width - imgRect.width) / 2
      const imgTop = (containerRect.height - imgRect.height) / 2
      const minX = imgLeft
      const maxX = imgLeft + imgRect.width - CROP_SIZE
      const minY = imgTop
      const maxY = imgTop + imgRect.height - CROP_SIZE
      if (imgRect.width < CROP_SIZE)
        newX = imgLeft - (CROP_SIZE - imgRect.width) / 2
      else newX = Math.max(minX, Math.min(newX, maxX))
      if (imgRect.height < CROP_SIZE)
        newY = imgTop - (CROP_SIZE - imgRect.height) / 2
      else newY = Math.max(minY, Math.min(newY, maxY))
      setCropPos({
        x: newX,
        y: newY,
      })
    }
  }
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleMouseMove, {
        passive: false,
      })
      window.addEventListener('touchend', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, dragStart])
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const container = containerRef.current
    if (container) {
      const containerRect = container.getBoundingClientRect()
      setCropPos({
        x: (containerRect.width - CROP_SIZE) / 2,
        y: (containerRect.height - CROP_SIZE) / 2,
      })
    }
  }
  const handleSave = () => {
    if (!imageRef.current || !containerRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = CROP_SIZE
    canvas.height = CROP_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = imageRef.current
    const containerRect = containerRef.current.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()
    const imgLeft = (containerRect.width - imgRect.width) / 2
    const imgTop = (containerRect.height - imgRect.height) / 2
    const relativeX = cropPos.x - imgLeft
    const relativeY = cropPos.y - imgTop
    const scaleX = img.naturalWidth / imgRect.width
    const scaleY = img.naturalHeight / imgRect.height
    ctx.drawImage(
      img,
      relativeX * scaleX,
      relativeY * scaleY,
      CROP_SIZE * scaleX,
      CROP_SIZE * scaleY,
      0,
      0,
      CROP_SIZE,
      CROP_SIZE,
    )
    onCrop(canvas.toDataURL('image/jpeg', 0.9))
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Crop Profile Picture
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative bg-gray-900 flex justify-center items-center overflow-hidden"
          style={{
            height: '450px',
          }}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="To crop"
            className="max-h-[420px] max-w-[90%] object-contain pointer-events-none select-none"
            onLoad={handleImageLoad}
          />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute border-4 border-white rounded-full pointer-events-auto cursor-move shadow-2xl"
              style={{
                width: CROP_SIZE,
                height: CROP_SIZE,
                transform: `translate(${cropPos.x}px, ${cropPos.y}px)`,
                boxShadow:
                  '0 0 0 9999px rgba(0,0,0,0.75), 0 8px 32px rgba(0,0,0,0.4)',
                touchAction: 'none',
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <p className="text-sm text-gray-600">
            Drag the circle to adjust your photo
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-white border border-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
