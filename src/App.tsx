import { useState, useEffect } from 'react'
import BasicMapLibreScene from './components/BasicMapLibreScene'
import PhotoOverlay from './components/PhotoOverlay'
import DebugConsole from './components/DebugConsole'
import { type Photo } from './services/photoService'
import { shouldShowDebugConsole } from './utils/debugUtils'
import { setupPMTilesNetworkLogging } from './utils/networkMonitor'

function App() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const isDebugMode = shouldShowDebugConsole()
  
  // Setup network monitoring for PMTiles when in debug mode
  useEffect(() => {
    if (!isDebugMode) return
    
    console.log('[Debug] Setting up PMTiles network monitoring...')
    const cleanup = setupPMTilesNetworkLogging()
    
    return cleanup
  }, [isDebugMode])

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo)
  }

  const handleCloseOverlay = () => {
    setSelectedPhoto(null)
  }

  return (
    <div className="canvas-container">
      <DebugConsole isVisible={isDebugMode} />
      
      <BasicMapLibreScene onPhotoClick={handlePhotoClick} />
      
      <PhotoOverlay 
        photo={selectedPhoto} 
        onClose={handleCloseOverlay} 
      />
    </div>
  )
}

export default App
