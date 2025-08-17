import { useState, useEffect } from 'react'
import Globe from 'r3f-globe'
import { 
  fetchPhotos, 
  transformPhotosToGlobePoints, 
  type GlobePoint,
  type Photo 
} from '../services/photoService'
// Temporary import for testing
import { mockPhotosResponse } from '../test/mockPhotoData'

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
        
        // Use mock data for testing while API is blocked
        let photosResponse
        try {
          photosResponse = await fetchPhotos()
        } catch (error) {
          console.log('API blocked, using mock data for testing')
          photosResponse = mockPhotosResponse
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