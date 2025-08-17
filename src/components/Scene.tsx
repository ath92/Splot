import { useState, useEffect } from 'react'
import { Sphere } from '@react-three/drei'
import { 
  fetchPhotos, 
  transformPhotosToGlobePoints, 
  type GlobePoint,
  type Photo 
} from '../services/photoService'

function Globe({ pointsData, onPhotoClick }: { pointsData: GlobePoint[], onPhotoClick: (photo: Photo) => void }) {
  return (
    <group>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[100, 64, 32]} />
        <meshStandardMaterial 
          color="#1e3a8a" 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Photo points */}
      {pointsData.map((point, index) => {
        // Convert lat/lng to 3D position
        const phi = (90 - point.lat) * (Math.PI / 180)
        const theta = (point.lng + 180) * (Math.PI / 180)
        const radius = 101 + point.size * 2 // Just above globe surface
        
        const x = -(radius * Math.sin(phi) * Math.cos(theta))
        const y = radius * Math.cos(phi)
        const z = radius * Math.sin(phi) * Math.sin(theta)
        
        return (
          <Sphere
            key={index}
            position={[x, y, z]}
            args={[1.5, 16, 16]}
            onClick={() => point.photo && onPhotoClick(point.photo)}
          >
            <meshStandardMaterial 
              color={point.color}
              emissive={point.color}
              emissiveIntensity={0.3}
            />
          </Sphere>
        )
      })}
    </group>
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