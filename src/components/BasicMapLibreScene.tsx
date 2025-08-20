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
      
      // For the basic component, try PMTiles first, then fallback to simple OSM tiles
      let mapStyle;
      try {
        mapStyle = createProtomapsStyle(PMTILES_URL);
        console.log('Basic map using custom protomaps style with worker endpoint');
      } catch (styleError) {
        console.warn('Basic map failed to create custom style, using OSM fallback:', styleError);
        // Simple OSM style as fallback
        mapStyle = {
          version: 8,
          name: "Basic OSM",
          sources: {
            "osm": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors"
            }
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#1a1a1a" }
            },
            {
              id: "osm-tiles",
              type: "raster",
              source: "osm"
            }
          ]
        };
      }
      
      // Initialize MapLibre map with basic configuration
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle as maplibregl.StyleSpecification,
        center: [0, 0],
        zoom: 2
      })

      console.log('Basic MapLibre map initialized:', map.current)

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
      })

      map.current.on('error', (e: maplibregl.ErrorEvent) => {
        clearTimeout(loadTimeout)
        console.error('Basic map error:', e)
        setError(`Basic map error: ${e.error?.message || 'Unknown error'}`)
        setIsLoading(false)
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