import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Scene from './components/Scene'
import PhotoOverlay from './components/PhotoOverlay'
import { type Photo } from './services/photoService'

function App() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
  }

  const handleCloseOverlay = () => {
    setSelectedPhoto(null)
  }

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
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.3}
          panSpeed={0.8}
          rotateSpeed={0.3}
          minDistance={101}
          maxDistance={10000}
          dampingFactor={0.1}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          touches={{
            ONE: 0, // TOUCH.ROTATE
            TWO: 2, // TOUCH.DOLLY_PAN
          }}
        />
        
        <Scene onPhotoClick={handlePhotoClick} />
      </Canvas>
      
      <PhotoOverlay 
        photo={selectedPhoto} 
        onClose={handleCloseOverlay} 
      />
    </div>
  )
}

export default App
