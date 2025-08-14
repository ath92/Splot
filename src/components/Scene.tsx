import { useRef } from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

function RotatingCube() {
  const meshRef = useRef<Mesh>(null!)

  // Add gentle rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#ff6b6b" />
    </mesh>
  )
}

export default function Scene() {
  return (
    <>
      <RotatingCube />
    </>
  )
}