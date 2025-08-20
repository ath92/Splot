import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
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
      
      // Use PMTiles with improved style configuration
      const mapStyle = {
        version: 8 as const,
        name: "Improved PMTiles Style",
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        sources: {
          "protomaps": {
            type: "vector" as const,
            url: PMTILES_URL
          }
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#0f172a" }
          },
          // Earth/land base layer - this should render everywhere
          {
            id: "earth",
            type: "fill",
            source: "protomaps",
            "source-layer": "earth",
            paint: {
              "fill-color": "#1e293b",
              "fill-opacity": 1
            }
          },
          // Water layer on top of earth
          {
            id: "water",
            type: "fill",
            source: "protomaps",
            "source-layer": "water",
            paint: {
              "fill-color": "#1e40af",
              "fill-opacity": 0.9
            }
          },
          // Landuse areas
          {
            id: "landuse",
            type: "fill",
            source: "protomaps",
            "source-layer": "landuse",
            minzoom: 4,
            filter: ["has", "pmap:kind"],
            paint: {
              "fill-color": [
                "case",
                ["==", ["get", "pmap:kind"], "park"], "#065f46",
                ["==", ["get", "pmap:kind"], "forest"], "#064e3b", 
                ["==", ["get", "pmap:kind"], "residential"], "#1f2937",
                "#1e293b"
              ],
              "fill-opacity": 0.7
            }
          },
          // Natural features  
          {
            id: "natural",
            type: "fill",
            source: "protomaps",
            "source-layer": "natural",
            minzoom: 4,
            filter: ["has", "pmap:kind"],
            paint: {
              "fill-color": [
                "case",
                ["==", ["get", "pmap:kind"], "forest"], "#064e3b",
                ["==", ["get", "pmap:kind"], "wood"], "#064e3b",
                "#374151"
              ],
              "fill-opacity": 0.6
            }
          },
          // Country boundaries
          {
            id: "boundaries-countries",
            type: "line",
            source: "protomaps",
            "source-layer": "boundaries",
            filter: ["<=", ["get", "pmap:min_admin_level"], 2],
            paint: {
              "line-color": "#64748b",
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                0, 0.5,
                4, 1,
                8, 2
              ],
              "line-opacity": 0.8
            }
          },
          // Major roads
          {
            id: "roads-major",
            type: "line",
            source: "protomaps",
            "source-layer": "roads",
            minzoom: 5,
            filter: [
              "in",
              ["get", "pmap:kind"],
              ["literal", ["highway", "trunk", "primary", "motorway"]]
            ],
            paint: {
              "line-color": "#94a3b8",
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                5, 0.5,
                10, 2,
                15, 6
              ]
            }
          },
          // Place labels - countries
          {
            id: "places-countries",
            type: "symbol",
            source: "protomaps",
            "source-layer": "places",
            maxzoom: 6,
            filter: ["==", ["get", "pmap:kind"], "country"],
            layout: {
              "text-field": ["get", "name"],
              "text-size": [
                "interpolate", ["linear"], ["zoom"],
                2, 10,
                6, 14
              ],
              "text-anchor": "center",
              "text-transform": "uppercase"
            },
            paint: {
              "text-color": "#f1f5f9",
              "text-halo-color": "#0f172a", 
              "text-halo-width": 2
            }
          },
          // Place labels - cities
          {
            id: "places-cities",
            type: "symbol",
            source: "protomaps",
            "source-layer": "places",
            minzoom: 4,
            filter: [
              "in",
              ["get", "pmap:kind"],
              ["literal", ["city", "town", "village"]]
            ],
            layout: {
              "text-field": ["get", "name"],
              "text-size": [
                "interpolate", ["linear"], ["zoom"],
                4, 10,
                8, 12,
                12, 16
              ],
              "text-anchor": "center"
            },
            paint: {
              "text-color": "#e2e8f0",
              "text-halo-color": "#1e293b",
              "text-halo-width": 1.5
            }
          }
        ]
      };
      console.log('Basic map using improved PMTiles style');
      
      console.log('About to create MapLibre map with style:', mapStyle);
      console.log('Container element:', mapContainer.current);
      
      // Initialize MapLibre map with basic configuration
      try {
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle as any,
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
        console.log('Basic map data event:', e.type)
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