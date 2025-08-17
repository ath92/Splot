import { useState, useEffect, useRef } from 'react'
import ThreeGlobe from 'three-globe'
import * as THREE from 'three'
import { 
  fetchPhotos, 
  transformPhotosToGlobePoints, 
  type GlobePoint,
  type Photo 
} from '../services/photoService'

function Globe({ pointsData, onPhotoClick }: { pointsData: GlobePoint[], onPhotoClick: (photo: Photo) => void }) {
  const globeRef = useRef<ThreeGlobe | null>(null)
  const groupRef = useRef<THREE.Group>(null!)

  useEffect(() => {
    // Create the globe instance
    const globe = new ThreeGlobe()
      .showAtmosphere(true)
      .atmosphereColor('#ffffff')
      .atmosphereAltitude(0.1)
      .showGlobe(true)
    
    // Add points data
    globe
      .pointsData(pointsData)
      .pointLat((d: any) => d.lat)
      .pointLng((d: any) => d.lng)
      .pointColor((d: any) => d.color)
      .pointRadius((d: any) => d.size * 0.5)
      .pointResolution(8)
      .pointsMerge(false) // Keep points separate for click detection

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
  }, [pointsData, onPhotoClick])

  // Simple click handler that tries to find the nearest point
  const handleClick = (event: any) => {
    event.stopPropagation()
    
    if (!globeRef.current || pointsData.length === 0) return

    console.log('Globe clicked, checking for nearby points...')
    
    // Get the intersection point from the event
    const intersectionPoint = event.intersections?.[0]?.point
    if (!intersectionPoint) {
      console.log('No intersection point found')
      return
    }

    console.log('Intersection point:', intersectionPoint)
    
    // Account for the globe's scale factor (100x)
    const normalizedPoint = intersectionPoint.clone().divideScalar(100)
    
    // Convert to spherical coordinates
    const spherical = new THREE.Spherical()
    spherical.setFromVector3(normalizedPoint)
    
    // Convert to lat/lng
    const lat = (Math.PI / 2 - spherical.phi) * 180 / Math.PI
    const lng = (spherical.theta) * 180 / Math.PI
    
    console.log('Click coordinates:', { lat, lng })
    
    // Find the closest point with a reasonable threshold
    let closestPoint: GlobePoint | null = null
    let minDistance = Infinity
    const clickThreshold = 15 // Increased threshold to 15 degrees for easier clicking
    
    pointsData.forEach((point: GlobePoint, index: number) => {
      // Calculate great circle distance
      const deltaLat = (point.lat - lat) * Math.PI / 180
      const deltaLng = (point.lng - lng) * Math.PI / 180
      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
      const distance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 180 / Math.PI
      
      console.log(`Point ${index} (${point.lat}, ${point.lng}) distance: ${distance} degrees`)
      
      if (distance < minDistance && distance < clickThreshold) {
        minDistance = distance
        closestPoint = point
      }
    })
    
    if (closestPoint && 'photo' in closestPoint && (closestPoint as GlobePoint).photo) {
      console.log('Found closest point, opening photo overlay:', closestPoint)
      onPhotoClick((closestPoint as GlobePoint).photo!)
    } else {
      console.log('No point found within threshold. Closest distance:', minDistance)
    }
  }

  return (
    <group ref={groupRef} onClick={handleClick} />
  )
}

interface SceneProps {
  onPhotoClick: (photo: Photo) => void
}

export default function Scene({ onPhotoClick }: SceneProps) {
  const [pointsData, setPointsData] = useState<GlobePoint[]>([])

  useEffect(() => {
    async function loadPhotoData() {
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
          // No photos with GPS data, show nothing
          console.log('No photos with GPS data found')
          setPointsData([])
        }
      } catch (err) {
        console.error('Failed to load photos:', err)
        setPointsData([])
      }
    }

    loadPhotoData()
  }, [])

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Globe pointsData={pointsData} onPhotoClick={onPhotoClick} />
    </>
  )
}