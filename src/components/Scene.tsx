function StaticCube() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#ff6b6b" />
    </mesh>
  )
}

export default function Scene() {
  return (
    <>
      <StaticCube />
    </>
  )
}