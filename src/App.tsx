import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Scene from './components/Scene'

function App() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{
          position: [0, 0, 350],
          fov: 50,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
        dpr={[1, 2]} // Support for high DPI displays
      >
        {/* Mobile-friendly orbit controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.3}
          rotateSpeed={0.3}
          minDistance={101}
          maxDistance={10000}
          dampingFactor={0.1}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          touches={{
            ONE: 0, // TOUCH.ROTATE
            TWO: 3, // TOUCH.DOLLY (zoom only, no pan)
          }}
        />
        
        <Scene />
      </Canvas>
    </div>
  )
}

export default App
