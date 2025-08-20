import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Feature } from 'geojson'
import { 
  fetchPhotos, 
  type Photo 
} from '../services/photoService'
import { 
  getFlightsData
} from '../services/flightsService'
import { createProtomapsStyle } from '../services/mapStyleService'
import { 
  registerPMTilesProtocol, 
  unregisterPMTilesProtocol,
  createPMTilesUrl,
  isPMTilesProtocolRegistered
} from '../services/pmtilesService'

interface MapLibreSceneProps {
  onPhotoClick: (photo: Photo) => void
}

export default function MapLibreScene({ onPhotoClick }: MapLibreSceneProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    console.log('Initializing MapLibre map, container:', mapContainer.current)
    console.log('Container dimensions:', mapContainer.current.offsetWidth, 'x', mapContainer.current.offsetHeight)

    const initializeMap = async () => {
      try {
        // Configuration for custom pmtiles
        const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://splot-photo-worker.tomhutman.workers.dev';
        
        // Register PMTiles protocol first
        registerPMTilesProtocol();
        console.log('PMTiles protocol registered');
        
        // Try PMTiles protocol approach first, fallback to TileJSON
        let mapStyle: string | object;
        let usedProtocol = 'unknown';
        
        // First check if we can access the PMTiles file directly
        const pmtilesDirectUrl = `${WORKER_URL}/tiles/world-tiles.pmtiles`;
        console.log('Checking PMTiles file availability at:', pmtilesDirectUrl);
        
        try {
          // Test if PMTiles file is accessible
          const testResponse = await fetch(pmtilesDirectUrl, { method: 'HEAD' });
          
          if (testResponse.ok) {
            // Create PMTiles URL pointing directly to the archive
            const pmtilesUrl = createPMTilesUrl(WORKER_URL, 'world-tiles');
            console.log('PMTiles file found, using protocol URL:', pmtilesUrl);
            
            mapStyle = createProtomapsStyle(pmtilesUrl, true);
            usedProtocol = 'pmtiles';
            console.log('Using PMTiles protocol approach');
          } else {
            throw new Error(`PMTiles file not accessible: ${testResponse.status}`);
          }
        } catch (pmtilesError) {
          console.warn('PMTiles protocol failed, falling back to TileJSON:', pmtilesError);
          
          try {
            // Fallback to TileJSON approach
            const PMTILES_URL = `${WORKER_URL}/tiles/world-tiles.json`;
            console.log('Using fallback TileJSON URL:', PMTILES_URL);
            
            mapStyle = createProtomapsStyle(PMTILES_URL, false);
            usedProtocol = 'tilejson';
            console.log('Using TileJSON fallback approach');
          } catch (tileJsonError) {
            console.warn('TileJSON approach also failed, using demo tiles:', tileJsonError);
            mapStyle = 'https://demotiles.maplibre.org/style.json';
            usedProtocol = 'demo';
          }
        }
      
        // Initialize MapLibre map
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle as string | maplibregl.StyleSpecification,
          center: [0, 0],
          zoom: 1
        })

        console.log(`MapLibre map initialized using ${usedProtocol} protocol:`, map.current)

        // Force the map to render by triggering a resize
        setTimeout(() => {
          if (map.current) {
            map.current.resize()
            console.log('Map resized')
          }
        }, 100)

        // Add a basic layer after the map loads
        map.current.on('load', async () => {
          console.log('Map load event fired')
          setIsLoading(false)
          
          // Set globe projection
          if (map.current) {
            map.current.setProjection({
              type: 'globe'
            })
            console.log('Globe projection set')
            
            // Load data after map is ready
            try {
              // Load photos
              let photosResponse
              try {
                photosResponse = await fetchPhotos()
              } catch {
                console.log('API not available, using fallback mock data for development')
                // Create minimal fallback data for development
                photosResponse = {
                  photos: [
                    {
                      filename: 'test-photo-1.jpg',
                      url: 'https://picsum.photos/800/600?random=1',
                      location: { latitude: 40.7128, longitude: -74.0060, altitude: 10 },
                      uploadedAt: '2024-01-01T12:00:00Z',
                      fileSize: 1024000,
                      originalName: 'New York City.jpg',
                      cameraMake: 'Canon',
                      cameraModel: 'EOS R5',
                      dateTime: '2024-01-01T12:00:00Z'
                    },
                    {
                      filename: 'test-photo-2.jpg',
                      url: 'https://picsum.photos/800/600?random=2',
                      location: { latitude: 51.5074, longitude: -0.1278, altitude: 11 },
                      uploadedAt: '2024-01-02T12:00:00Z',
                      fileSize: 1536000,
                      originalName: 'London.jpg',
                      cameraMake: 'Sony',
                      cameraModel: 'A7R IV',
                      dateTime: '2024-01-02T12:00:00Z'
                    },
                    {
                      filename: 'test-photo-3.jpg',
                      url: 'https://picsum.photos/800/600?random=3',
                      location: { latitude: 35.6762, longitude: 139.6503, altitude: 40 },
                      uploadedAt: '2024-01-03T12:00:00Z',
                      fileSize: 2048000,
                      originalName: 'Tokyo.jpg',
                      cameraMake: 'Nikon',
                      cameraModel: 'D850',
                      dateTime: '2024-01-03T12:00:00Z'
                    }
                  ],
                  count: 3
                }
              }

              // Add photo markers
              if (photosResponse.photos.length > 0) {
                addPhotoMarkers(photosResponse.photos)
                console.log(`Loaded ${photosResponse.count} photos with GPS data`)
              }

              // Load flights data
              try {
                const flightsData = getFlightsData()
                addFlightPaths(flightsData)
                console.log(`Loaded flight routes`)
              } catch (err) {
                console.warn('Failed to load flights data:', err instanceof Error ? err.message : 'Failed to load flights')
              }


            } catch (err) {
              console.error('Error loading data:', err)
              setError(err instanceof Error ? err.message : 'Failed to load data')
            }
          }
        })

        map.current.on('error', (e: maplibregl.ErrorEvent) => {
          console.error('Map error:', e)
          setError(`Map error: ${e.error?.message || 'Unknown error'}`)
          setIsLoading(false)
        })

      } catch (err) {
        console.error('Failed to initialize MapLibre:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize map')
        setIsLoading(false)
      }
    };

    // Call the async initialization
    initializeMap();

    return () => {
      // Clean up map and protocol
      map.current?.remove();
      
      // Unregister PMTiles protocol if we registered it
      if (isPMTilesProtocolRegistered()) {
        unregisterPMTilesProtocol();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // loadData is intentionally not in dependencies to avoid recreation



  const addPhotoMarkers = (photos: Photo[]) => {
    if (!map.current) return

    console.log('Adding photo markers:', photos.length)

    // Check if source already exists to prevent "source already exists" error
    if (map.current.getSource('photos')) {
      console.log('Photos source already exists, skipping addition')
      return
    }

    // Create GeoJSON source for photo markers
    const photoFeatures: Feature[] = photos.map((photo, index) => ({
      type: 'Feature' as const,
      properties: {
        photo: JSON.stringify(photo), // Store photo data for click handling
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][index % 5],
        index: index
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [photo.location.longitude, photo.location.latitude]
      }
    }))

    // Add source for photo markers
    map.current.addSource('photos', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection' as const,
        features: photoFeatures
      }
    })

    // Add layer for photo markers
    if (!map.current.getLayer('photos')) {
      map.current.addLayer({
        id: 'photos',
        type: 'circle',
        source: 'photos',
        paint: {
          'circle-radius': 12,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      })
    }

    // Add click handler for photo markers using map events
    map.current.on('click', 'photos', (e: maplibregl.MapMouseEvent & {features?: unknown[]}) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0] as {properties?: {photo?: string}}
        if (feature.properties && feature.properties.photo) {
          try {
            const photo = JSON.parse(feature.properties.photo)
            console.log('Photo marker clicked:', photo.originalName)
            onPhotoClick(photo)
          } catch (err) {
            console.error('Error parsing photo data:', err)
          }
        }
      }
    })

    // Change cursor to pointer when hovering over markers
    map.current.on('mouseenter', 'photos', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer'
      }
    })

    map.current.on('mouseleave', 'photos', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = ''
      }
    })

    console.log(`Added ${photos.length} photo markers as GeoJSON features`)

    // Zoom to show the first marker with globe-appropriate zoom
    if (photos.length > 0) {
      map.current.flyTo({
        center: [photos[0].location.longitude, photos[0].location.latitude],
        zoom: 3,
        duration: 2000
      })
    }
  }

  const addFlightPaths = (flightsData: {airports: Record<string, {latitude: number, longitude: number}>, flights: Array<{from: string, to: string, route: string, id: number}>}) => {
    if (!map.current) return

    // Check if source already exists to prevent "source already exists" error
    if (map.current.getSource('flights')) {
      console.log('Flights source already exists, skipping addition')
      return
    }

    const { airports, flights } = flightsData
    
    // Convert flights to GeoJSON LineString features
    const flightFeatures: (Feature | null)[] = flights.map((flight: {from: string, to: string, route: string, id: number}, index: number) => {
      const fromAirport = airports[flight.from]
      const toAirport = airports[flight.to]
      
      if (!fromAirport || !toAirport) {
        return null
      }

      return {
        type: 'Feature' as const,
        properties: {
          route: flight.route,
          id: flight.id.toString(),
          color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9f43', '#ee5a6f', '#00d2d3'][index % 8]
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [fromAirport.longitude, fromAirport.latitude],
            [toAirport.longitude, toAirport.latitude]
          ]
        }
      }
    })

    // Add source and layer for flight paths
    map.current.addSource('flights', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection' as const,
        features: flightFeatures.filter((f): f is Feature => f !== null)
      }
    })

    // Add layer for flight paths
    if (!map.current.getLayer('flights')) {
      map.current.addLayer({
        id: 'flights',
        type: 'line',
        source: 'flights',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.8
        }
      })
    }
  }



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
          <div>Loading...</div>
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