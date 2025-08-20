import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createProtomapsStyle } from '../services/mapStyleService'
import { type Photo } from '../services/photoService'

interface BasicMapLibreSceneProps {
  onPhotoClick: (photo: Photo) => void
}

export default function BasicMapLibreScene({ onPhotoClick: _ }: BasicMapLibreSceneProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('Initializing Basic MapLibre map, container:', mapContainer.current)
    console.log('Container dimensions:', mapContainer.current.offsetWidth, 'x', mapContainer.current.offsetHeight)

    try {
      // Configuration for custom pmtiles - use worker endpoint instead of direct R2
      const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://splot-photo-worker.tomhutman.workers.dev';
      const PMTILES_URL = import.meta.env.VITE_PMTILES_URL || 
        `${WORKER_URL}/tiles/world-tiles.json`;
      
      console.log('Basic map using pmtiles TileJSON URL:', PMTILES_URL);
      
      // For debugging, let's use a known working MapLibre style
      const mapStyle = 'https://demotiles.maplibre.org/style.json';
      console.log('Basic map using MapLibre demo style for debugging');
      
      console.log('About to create MapLibre map with style:', mapStyle);
      console.log('Container element:', mapContainer.current);
      
      // Initialize MapLibre map with basic configuration
      try {
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle,
          center: [0, 0],
          zoom: 2
        })

        console.log('Basic MapLibre map created successfully:', map.current);
        
        // Expose to window for debugging
        (window as any).debugMap = map.current;
        
      } catch (mapError) {
        console.error('Failed to create MapLibre map:', mapError);
        setError(`Failed to create map: ${mapError instanceof Error ? mapError.message : 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      // Force the map to render by triggering a resize
      setTimeout(() => {
        if (map.current) {
          map.current.resize()
          console.log('Basic map resized')
        }
      }, 100)

      // Add a timeout fallback in case load event doesn't fire (for network issues)
      const loadTimeout = setTimeout(() => {
        console.log('Basic map load timeout - forcing loaded state')
        setIsLoading(false)
      }, 5000) // 5 second timeout

      // Simple load handler - just set loading to false
      map.current.on('load', () => {
        clearTimeout(loadTimeout)
        console.log('Basic map load event fired')
        setIsLoading(false)
        
        // Try to trigger repaint and check if canvas appears
        setTimeout(() => {
          if (map.current) {
            console.log('Triggering map repaint...');
            map.current.triggerRepaint();
            
            // Check for canvas
            const canvases = mapContainer.current?.querySelectorAll('canvas');
            console.log('Canvas count after repaint:', canvases?.length || 0);
          }
        }, 1000);
      })

      // Add more detailed error handling
      map.current.on('error', (e: maplibregl.ErrorEvent) => {
        clearTimeout(loadTimeout)
        console.error('Basic map error:', e)
        setError(`Basic map error: ${e.error?.message || 'Unknown error'}`)
        setIsLoading(false)
      })

      map.current.on('styledata', () => {
        console.log('Basic map style data loaded')
      })

      map.current.on('sourcedata', (e) => {
        console.log('Basic map source data loaded:', e.sourceId, e.isSourceLoaded)
      })

      map.current.on('data', (e) => {
        console.log('Basic map data event:', e.type, e.sourceId)
      })

    } catch (err) {
      console.error('Failed to initialize Basic MapLibre:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize basic map')
      setIsLoading(false)
    }

    return () => {
      map.current?.remove();
    }
  }, [])

  return (
    <div 
      ref={mapContainer} 
      className="map-container"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      {isLoading && (
        <div className="loading-overlay">
          <div>Loading Basic Map...</div>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <div>Error: {error}</div>
        </div>
      )}
    </div>
  )
}