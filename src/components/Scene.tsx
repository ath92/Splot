import { useRef, useMemo } from 'react'
import { Mesh, MeshBasicMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import ThreeGlobe from 'three-globe'

function RotatingGlobe() {
  const meshRef = useRef<Mesh>(null!)

  // Create the globe instance with proper setup
  const globe = useMemo(() => {
    const globe = new ThreeGlobe()
    
    // Set a basic blue color for the globe
    const material = globe.globeMaterial() as MeshBasicMaterial
    material.color.setHex(0x4477ff)
    
    // Scale it appropriately
    globe.scale.set(1.5, 1.5, 1.5)
    
    return globe
  }, [])

  // Add gentle rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  // First try using the three-globe with primitive
  return <primitive ref={meshRef} object={globe} />
}

export default function Scene() {
  return (
    <>
      {/* Add lighting for better globe visibility */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <RotatingGlobe />
    </>
  )
}