import { useRef, useEffect } from 'react'
import { Object3D, MeshBasicMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import ThreeGlobe from 'three-globe'

function RotatingGlobe() {
  const globeRef = useRef<Object3D>(null!)

  // Create and setup the globe
  useEffect(() => {
    const globe = new ThreeGlobe()
    
    // Set a basic blue color for the globe
    const material = globe.globeMaterial() as MeshBasicMaterial
    material.color.setHex(0x4477ff)

    // Store ref for cleanup
    const currentRef = globeRef.current

    // Add the globe to the ref
    if (currentRef) {
      currentRef.add(globe)
    }

    return () => {
      // Cleanup
      if (currentRef) {
        currentRef.remove(globe)
      }
    }
  }, [])

  // Add gentle rotation animation
  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.x += delta * 0.2
      globeRef.current.rotation.y += delta * 0.3
    }
  })

  return <object3D ref={globeRef} />
}

export default function Scene() {
  return (
    <>
      <RotatingGlobe />
    </>
  )
}