import { useState, useEffect, useRef } from 'react'
import ThreeGlobe from 'three-globe'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { 
  fetchPhotos, 
  transformPhotosToGlobePoints, 
  type GlobePoint,
  type Photo 
} from '../services/photoService'
import { 
  getFlightArcs, 
  getGroundPaths, 
  getTripPoints 
} from '../services/tripService'

function Globe({ pointsData, countriesData, onPhotoClick }: { 
  pointsData: GlobePoint[], 
  countriesData: any[], 
  onPhotoClick: (photo: Photo) => void 
}) {
  const globeRef = useRef<ThreeGlobe | null>(null)
  const groupRef = useRef<THREE.Group>(null!)
  const { camera, gl, scene } = useThree()

  useEffect(() => {
    // Create the globe instance with enhanced visuals
    const globe = new ThreeGlobe()
      .showAtmosphere(true)
      .atmosphereColor('lightblue')
      .atmosphereAltitude(0.1)
      .showGlobe(true)
      .globeImageUrl('/blue-ocean.svg')
    
    // Add countries data (polygons)
    globe
      .polygonsData(countriesData)
      .polygonCapColor(() => '#22c55e')
      .polygonSideColor(() => '#16a34a')
      .polygonStrokeColor(() => '#065f46')
      .polygonAltitude(0.01)
    
    // Add trip location points
    const tripPoints = getTripPoints()
    const combinedPoints = [...pointsData, ...tripPoints]
    
    // Add combined points data 
    globe
      .pointsData(combinedPoints)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => d.color)
      .pointRadius((d: any) => d.size * 0.5)
      .pointResolution(8)
      .pointsMerge(false) // Keep points separate for click detection

    // Add trip route visualization
    // Flight routes as arcs
    const flightArcs = getFlightArcs()
    globe
      .arcsData(flightArcs)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor((d: any) => d.color)
      .arcStroke((d: any) => d.stroke)
      .arcAltitude((d: any) => d.altitude)
      .arcDashLength(0.9)
      .arcDashGap(0.1)
      .arcDashAnimateTime(1000)

    // Ground routes as paths
    const groundPaths = getGroundPaths()
    globe
      .pathsData(groundPaths)
      .pathPoints((d: any) => d.coords)
      .pathPointLat((coord: any) => coord[1]) // lat is index 1
      .pathPointLng((coord: any) => coord[0]) // lng is index 0
      .pathColor((d: any) => d.color)
      .pathStroke((d: any) => d.stroke)
      .pathPointAlt(() => 0.01)

    // Scale the globe
    globe.scale.set(100, 100, 100)
    
    // Add to group
    if (groupRef.current) {
      groupRef.current.add(globe)
    }
    globeRef.current = globe

    return () => {
      // Cleanup
      if (groupRef.current && globe) {
        groupRef.current.remove(globe)
      }
    }
  }, [pointsData, countriesData])

  useEffect(() => {
    if (!globeRef.current || pointsData.length === 0) return

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handleClick = (event: MouseEvent) => {
      // Prevent default behavior
      event.preventDefault()
      event.stopPropagation()

      // Calculate mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Set raycaster
      raycaster.setFromCamera(mouse, camera)

      // Find intersections with the globe
      const intersects = raycaster.intersectObject(globeRef.current!, true)

      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point
        
        // Account for the globe's scale factor (100x)
        const normalizedPoint = intersectionPoint.clone().divideScalar(100)
        
        // Convert to spherical coordinates
        const spherical = new THREE.Spherical()
        spherical.setFromVector3(normalizedPoint)
        
        // Convert to lat/lng
        const lat = (Math.PI / 2 - spherical.phi) * 180 / Math.PI
        const lng = (spherical.theta) * 180 / Math.PI
        
        // Find the closest point with a reasonable threshold
        let closestPoint: GlobePoint | null = null
        let minDistance = Infinity
        const clickThreshold = 15 // 15 degrees threshold for easier clicking
        
        pointsData.forEach((point: GlobePoint) => {
          // Calculate great circle distance
          const deltaLat = (point.lat - lat) * Math.PI / 180
          const deltaLng = (point.lng - lng) * Math.PI / 180
          const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                    Math.cos(lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
          const distance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 180 / Math.PI
          
          if (distance < minDistance && distance < clickThreshold) {
            minDistance = distance
            closestPoint = point
          }
        })
        
        if (closestPoint && 'photo' in closestPoint && (closestPoint as GlobePoint).photo) {
          onPhotoClick((closestPoint as GlobePoint).photo!)
        }
      }
    }

    // Add event listener to the canvas
    gl.domElement.addEventListener('click', handleClick)

    return () => {
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [pointsData, onPhotoClick, camera, gl, scene])

  return (
    <group ref={groupRef} />
  )
}

interface SceneProps {
  onPhotoClick: (photo: Photo) => void
}

export default function Scene({ onPhotoClick }: SceneProps) {
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
      <Globe pointsData={pointsData} countriesData={countriesData} onPhotoClick={onPhotoClick} />
      {/* Display loading/error state in console - could be enhanced with UI feedback */}
      {isLoading && console.log('Loading data...')}
      {error && console.log('Error loading data:', error)}
    </>
  )
}