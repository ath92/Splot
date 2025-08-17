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
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .showAtmosphere(true)
      .atmosphereColor('#ffffff')
      .atmosphereAltitude(0.1)
    
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
  }, [pointsData])

  // Handle click events using React Three Fiber's event system
  const handleClick = (event: any) => {
    event.stopPropagation()
    
    // Get the intersection point
    const intersectionPoint = event.intersections[0]?.point
    if (!intersectionPoint || !globeRef.current) return

    // Convert intersection point to lat/lng
    const normalized = intersectionPoint.clone().normalize()
    
    // Convert to spherical coordinates
    const lat = Math.asin(normalized.y) * 180 / Math.PI
    const lng = Math.atan2(normalized.z, -normalized.x) * 180 / Math.PI
    
    // Find the closest point to the click
    let closestPoint: GlobePoint | null = null
    let minDistance = Infinity
    
    pointsData.forEach((point: GlobePoint) => {
      const distance = Math.sqrt(
        Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2)
      )
      if (distance < minDistance && distance < 10) { // 10 degree threshold
        minDistance = distance
        closestPoint = point
      }
    })
    
    if (closestPoint && 'photo' in closestPoint && (closestPoint as GlobePoint).photo) {
      onPhotoClick((closestPoint as GlobePoint).photo!)
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