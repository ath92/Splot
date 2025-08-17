import { useState, useEffect } from 'react'
import Globe from 'r3f-globe'
import { 
  fetchPhotos, 
  transformPhotosToGlobePoints, 
  type GlobePoint 
} from '../services/photoService'

export default function Scene() {
  const [pointsData, setPointsData] = useState<GlobePoint[]>([])
  const [countriesData, setCountriesData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)
      
      // Load photos (optional - don't fail if this doesn't work)
      try {
        const photosResponse = await fetchPhotos()
        
        if (photosResponse.photos.length > 0) {
          const globePoints = transformPhotosToGlobePoints(photosResponse.photos)
          setPointsData(globePoints)
          console.log(`Loaded ${photosResponse.count} photos with GPS data`)
        } else {
          console.log('No photos with GPS data found')
          setPointsData([])
        }
      } catch (err) {
        console.warn('Photos could not be loaded:', err instanceof Error ? err.message : 'Failed to fetch photos')
        setPointsData([])
      }

      // Load countries GeoJSON data
      try {
        const countriesResponse = await fetch('/ne_110m_admin_0_countries.geojson')
        const countriesGeoJson = await countriesResponse.json()
        
        // Filter out Antarctica (AQ) as in the example
        const filteredCountries = countriesGeoJson.features.filter((d: any) => d.properties.ISO_A2 !== 'AQ')
        setCountriesData(filteredCountries)
        console.log(`Loaded ${filteredCountries.length} countries`)
        
      } catch (err) {
        console.error('Failed to load countries:', err)
        setError(err instanceof Error ? err.message : 'Failed to load countries')
        setCountriesData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <Globe
        showGlobe={true}
        globeImageUrl={null}
        showAtmosphere={true}
        atmosphereColor="lightblue"
        polygonsData={countriesData}
        polygonCapColor={() => '#22c55e'}
        polygonSideColor={() => '#16a34a'} 
        polygonStrokeColor={() => '#065f46'}
        polygonAltitude={0.001}
        pointsData={pointsData}
        pointAltitude="size"
        pointColor="color"
      />
      {/* Display loading/error state in console - could be enhanced with UI feedback */}
      {isLoading && console.log('Loading data...')}
      {error && console.log('Error loading data:', error)}
    </>
  )
}