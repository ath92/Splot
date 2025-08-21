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

    try {
      // Configuration for custom pmtiles - use worker endpoint instead of direct R2
      const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://splot-photo-worker.tomhutman.workers.dev';
      const PMTILES_URL = import.meta.env.VITE_PMTILES_URL || 
        `${WORKER_URL}/tiles/world-tiles.json`;
      
      console.log('Using pmtiles TileJSON URL:', PMTILES_URL);
      
      // Test if we can actually fetch the TileJSON URL directly
      try {
        console.log('Testing direct fetch of TileJSON...');
        const response = await fetch(PMTILES_URL);
        console.log('TileJSON fetch response:', response.status, response.statusText);
        if (response.ok) {
          const tileJson = await response.json();
          console.log('TileJSON data received:', Object.keys(tileJson));
          console.log('TileJSON tiles URL pattern:', tileJson.tiles);
        } else {
          console.error('TileJSON fetch failed:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error('TileJSON fetch error:', fetchError);
      }
      
      // Use custom protomaps style with worker endpoint
      const mapStyle = createProtomapsStyle(PMTILES_URL);
      console.log('Using custom protomaps style with worker endpoint');
      console.log('Style config:', JSON.stringify(mapStyle, null, 2));
      
      // Initialize MapLibre map
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle as maplibregl.StyleSpecification,
        center: [0, 0],
        zoom: 1
      })

      console.log('MapLibre map initialized:', map.current)

      // Force the map to render by triggering a resize
      setTimeout(() => {
        if (map.current) {
          map.current.resize()
          console.log('Map resized')
        }
      }, 100)

      // Set up load event
      const handleMapLoad = async () => {
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
      };

      map.current.on('load', handleMapLoad)

      // Add debugging event listeners
      map.current.on('sourcedata', (e) => {
        console.log('Source data event:', e.sourceId, e.dataType, e.isSourceLoaded);
      });

      map.current.on('data', (e) => {
        console.log('Data event:', e.dataType);
      });

      map.current.on('style.load', () => {
        console.log('Style loaded successfully');
      });

      map.current.on('styledata', (e) => {
        console.log('Style data event:', e.dataType);
        if (e.dataType === 'style') {
          console.log('Style sources:', Object.keys(map.current?.getStyle()?.sources || {}));
        }
      });

      map.current.on('sourcedataloading', (e) => {
        console.log('Source data loading:', e.sourceId, e.dataType);
      });

      // Add a safety timeout in case the load event never fires
      setTimeout(() => {
        if (document.querySelector('.loading-overlay')) {
          console.log('Safety timeout: map load event did not fire after 15 seconds, something may be wrong with tile loading')
          setError('Map tiles failed to load from worker endpoint')
          setIsLoading(false)
        }
      }, 15000)

      map.current.on('error', (e: maplibregl.ErrorEvent) => {
        console.error('Map error:', e)
        console.error('Error details:', e.error)
        if (e.sourceId) {
          console.error('Error source:', e.sourceId)
        }
        setError(`Map error: ${e.error?.message || 'Unknown error'}`)
        setIsLoading(false)
      })

    } catch (err) {
      console.error('Failed to initialize MapLibre:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize map')
      setIsLoading(false)
    }

    return () => {
      map.current?.remove();
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