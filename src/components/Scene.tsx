import { useState, useEffect } from 'react'
import Globe from 'r3f-globe'
import { 
  fetchPhotos, 
  transformPhotosToGlobePoints, 
  generateFallbackData,
  type GlobePoint 
} from '../services/photoService'

export default function Scene() {
  const [pointsData, setPointsData] = useState<GlobePoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPhotoData() {
      try {
        setIsLoading(true)
        setError(null)
        
        const photosResponse = await fetchPhotos()
        
        if (photosResponse.photos.length > 0) {
          const globePoints = transformPhotosToGlobePoints(photosResponse.photos)
          setPointsData(globePoints)
          console.log(`Loaded ${photosResponse.count} photos with GPS data`)
        } else {
          // No photos with GPS data, use fallback
          console.log('No photos with GPS data found, using fallback data')
          setPointsData(generateFallbackData())
        }
      } catch (err) {
        console.error('Failed to load photos, using fallback data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load photos')
        setPointsData(generateFallbackData())
      } finally {
        setIsLoading(false)
      }
    }

    loadPhotoData()
  }, [])

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Globe
        pointsData={pointsData}
        pointAltitude="size"
        pointColor="color"
      />
      {/* Display loading/error state in console - could be enhanced with UI feedback */}
      {isLoading && console.log('Loading photos...')}
      {error && console.log('Error loading photos:', error)}
    </>
  )
}