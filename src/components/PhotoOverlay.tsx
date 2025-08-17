import React from 'react'
import { type Photo } from '../services/photoService'

interface PhotoOverlayProps {
  photo: Photo | null
  onClose: () => void
}

export default function PhotoOverlay({ photo, onClose }: PhotoOverlayProps) {
  if (!photo) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="photo-overlay" onClick={handleOverlayClick}>
      <div className="photo-overlay-content">
        <button className="photo-overlay-close" onClick={onClose}>
          ×
        </button>
        <img 
          src={photo.url} 
          alt={photo.originalName || photo.filename}
          className="photo-overlay-image"
        />
        <div className="photo-overlay-info">
          <h3>{photo.originalName || photo.filename}</h3>
          {photo.cameraMake && photo.cameraModel && (
            <p>{photo.cameraMake} {photo.cameraModel}</p>
          )}
          {photo.dateTime && (
            <p>{new Date(photo.dateTime).toLocaleDateString()}</p>
          )}
          <p>
            {photo.location.latitude.toFixed(6)}, {photo.location.longitude.toFixed(6)}
            {photo.location.altitude && ` (${photo.location.altitude.toFixed(0)}m)`}
          </p>
        </div>
      </div>
    </div>
  )
}