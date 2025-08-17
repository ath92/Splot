// Photo service for fetching photos from the worker API
export interface PhotoLocation {
  latitude: number
  longitude: number
  altitude?: number | null
}

export interface Photo {
  filename: string
  url: string
  location: PhotoLocation
  uploadedAt: string
  fileSize: number
  originalName: string
  cameraMake?: string
  cameraModel?: string
  dateTime?: string
}

export interface PhotosResponse {
  photos: Photo[]
  count: number
}

export interface GlobePoint {
  lat: number
  lng: number
  size: number
  color: string
  photo?: Photo // Optional reference to the original photo data
}

// Configuration for the worker API
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

/**
 * Fetch photos with location data from the worker API
 */
export async function fetchPhotos(): Promise<PhotosResponse> {
  try {
    const response = await fetch(`${WORKER_URL}/photos`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`)
    }
    
    const data: PhotosResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching photos:', error)
    throw error
  }
}

/**
 * Transform photo data to globe points format
 */
export function transformPhotosToGlobePoints(photos: Photo[]): GlobePoint[] {
  return photos.map((photo, index) => ({
    lat: photo.location.latitude,
    lng: photo.location.longitude,
    size: 0.3 + Math.random() * 0.2, // Vary size slightly for visual interest
    color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][index % 5], // Cycle through nice colors
    photo // Include original photo data for potential future use
  }))
}

/**
 * Generate fallback sample data when API is unavailable
 */
export function generateFallbackData(): GlobePoint[] {
  const N = 30
  return [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() / 3,
    color: ['red', 'white', 'blue', 'green'][Math.floor(Math.random() * 4)]
  }))
}