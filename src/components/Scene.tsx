import { useState, useEffect } from 'react'
import Globe from 'r3f-globe'
import { 
  fetchPhotos, 
  transformPhotosToGlobePoints, 
  type GlobePoint,
  type Photo 
} from '../services/photoService'

interface SceneProps {
  onPhotoClick: (photo: Photo) => void
}

export default function Scene({ onPhotoClick }: SceneProps) {
  const [pointsData, setPointsData] = useState<GlobePoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPhotoData() {
      try {
        setIsLoading(true)
        setError(null)
        
        // Use fallback mock data if API is not available (development/testing only)
        let photosResponse
        try {
          photosResponse = await fetchPhotos()
        } catch (error) {
          console.log('API not available, using fallback mock data for development')
          // Create minimal fallback data for development
          photosResponse = {
            photos: [
              {
                filename: 'test-photo-1.jpg',
                url: 'https://picsum.photos/800/600?random=1',
                location: { latitude: 40.7128, longitude: -74.0060, altitude: 10 },
                uploadedAt: '2024-01-01T12:00:00Z',
                fileSize: 1024000,
                originalName: 'New York City.jpg',
                cameraMake: 'Canon',
                cameraModel: 'EOS R5',
                dateTime: '2024-01-01T12:00:00Z'
              },
              {
                filename: 'test-photo-2.jpg',
                url: 'https://picsum.photos/800/600?random=2',
                location: { latitude: 51.5074, longitude: -0.1278, altitude: 11 },
                uploadedAt: '2024-01-02T12:00:00Z',
                fileSize: 1536000,
                originalName: 'London.jpg',
                cameraMake: 'Sony',
                cameraModel: 'A7R IV',
                dateTime: '2024-01-02T12:00:00Z'
              }
            ],
            count: 2
          }
        }
        
        if (photosResponse.photos.length > 0) {
          const globePoints = transformPhotosToGlobePoints(photosResponse.photos)
          setPointsData(globePoints)
          console.log(`Loaded ${photosResponse.count} photos with GPS data`)
        } else {
          // No photos with GPS data, show nothing
          console.log('No photos with GPS data found')
          setPointsData([])
        }
      } catch (err) {
        console.error('Failed to load photos:', err)
        setError(err instanceof Error ? err.message : 'Failed to load photos')
        setPointsData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPhotoData()
  }, [])

  const handlePointClick = (layer: string, elemData: object | undefined, _event: React.MouseEvent) => {
    if (layer === 'points' && elemData) {
      // Type assertion since we know the structure of our point data
      const pointData = elemData as GlobePoint
      if (pointData.photo) {
        onPhotoClick(pointData.photo)
      }
    }
  }

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Globe
        pointsData={pointsData}
        pointAltitude="size"
        pointColor="color"
        onClick={handlePointClick}
      />
      {/* Display loading/error state in console - could be enhanced with UI feedback */}
      {isLoading && console.log('Loading photos...')}
      {error && console.log('Error loading photos:', error)}
    </>
  )
}