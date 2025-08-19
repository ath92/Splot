import { useState } from 'react'
import MapLibreScene from './components/MapLibreScene'
import PhotoOverlay from './components/PhotoOverlay'
import DebugConsole from './components/DebugConsole'
import { type Photo } from './services/photoService'
import { shouldShowDebugConsole } from './utils/debugUtils'

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
      <DebugConsole isVisible={shouldShowDebugConsole()} />
      
      <MapLibreScene onPhotoClick={handlePhotoClick} />
      
      <PhotoOverlay 
        photo={selectedPhoto} 
        onClose={handleCloseOverlay} 
      />
    </div>
  )
}

export default App
