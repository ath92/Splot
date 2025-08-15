import { useMemo } from 'react'
import Globe from 'r3f-globe'

// Generate sample points data similar to the basic example
const generateSampleData = () => {
  const N = 30
  return [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() / 3,
    color: ['red', 'white', 'blue', 'green'][Math.floor(Math.random() * 4)]
  }))
}

export default function Scene() {
  const pointsData = useMemo(() => generateSampleData(), [])
  
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Globe
        pointsData={pointsData}
        pointAltitude="size"
        pointColor="color"
      />
    </>
  )
}