import { useMemo } from 'react'
import Globe from 'r3f-globe'
import { useR2Images } from '../hooks/useR2Images'
import type { ImageData } from '../services/r2Service'

// Transform image data for globe visualization
const transformImageDataForGlobe = (images: ImageData[]) => {
  return images.map((image, index) => ({
    lat: image.lat,
    lng: image.lng,
    size: image.size,
    color: ['red', 'white', 'blue', 'green', 'yellow', 'cyan'][index % 6],
    url: image.url,
    key: image.key
  }))
}

export default function Scene() {
  const { images, loading, error } = useR2Images()
  
  const pointsData = useMemo(() => {
    return transformImageDataForGlobe(images)
  }, [images])
  
  // Show a simple loading indicator
  if (loading && pointsData.length === 0) {
    return (
      <>
        <ambientLight intensity={0.1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Globe pointsData={[]} />
      </>
    )
  }
  
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Globe
        pointsData={pointsData}
        pointAltitude="size"
        pointColor="color"
      />
      {error && (
        <mesh position={[0, 0, 150]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="red" opacity={0.5} transparent />
        </mesh>
      )}
    </>
  )
}