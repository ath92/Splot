import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Feature, FeatureCollection } from 'geojson'
import { Protocol } from 'pmtiles'
import { 
  fetchPhotos, 
  type Photo 
} from '../services/photoService'
import { 
  getFlightsData
} from '../services/flightsService'
import { createProtomapsStyle, createOfflineStyle } from '../services/mapStyleService'

interface MapLibreSceneProps {
  onPhotoClick: (photo: Photo) => void
}

export default function MapLibreScene({ onPhotoClick }: MapLibreSceneProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const instanceId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const container = mapContainer.current; // Store reference to ensure it's not null
    console.log(`[${instanceId.current}] Initializing MapLibre map, container:`, container)
    console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight)

    // Async initialization function
    const initializeMap = async () => {
      try {
        // Register pmtiles protocol
        const protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);
        console.log('PMTiles protocol registered');
        
        // Configuration for custom pmtiles
        const PMTILES_URL = import.meta.env.VITE_PMTILES_URL || 
          'https://pub-a951d20402694897ae275d1758f4675c.r2.dev/world-tiles.pmtiles';
        
        console.log('Using pmtiles URL:', PMTILES_URL);
        
        // Validate PMTiles URL format
        const isValidPMTilesURL = (url: string) => {
          try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' && url.endsWith('.pmtiles');
          } catch {
            return false;
          }
        };
        
        if (!isValidPMTilesURL(PMTILES_URL)) {
          console.warn('Invalid PMTiles URL format:', PMTILES_URL);
        }
        
        // Try to use custom protomaps style first, fallback to demo tiles
        let mapStyle: string | object;
        let usingFallback = false;
        
        // Test PMTiles URL accessibility before creating style
        try {
          console.log('Testing PMTiles URL accessibility...')
          const testResponse = await fetch(PMTILES_URL, { method: 'HEAD' })
          if (!testResponse.ok) {
            throw new Error(`PMTiles URL returned ${testResponse.status}: ${testResponse.statusText}`)
          }
          console.log('PMTiles URL is accessible, creating custom style')
          mapStyle = createProtomapsStyle(PMTILES_URL);
          console.log('Using custom protomaps style with URL:', PMTILES_URL);
        } catch (error) {
          console.warn('PMTiles URL is not accessible or style creation failed, falling back to demo tiles:', error);
          
          // Try demo tiles first
          try {
            console.log('Testing demo tiles accessibility...')
            const demoResponse = await fetch('https://demotiles.maplibre.org/style.json')
            if (!demoResponse.ok) {
              throw new Error(`Demo tiles returned ${demoResponse.status}: ${demoResponse.statusText}`)
            }
            mapStyle = 'https://demotiles.maplibre.org/style.json';
            usingFallback = true;
            console.log('Using demo tiles as fallback')
          } catch (demoError) {
            console.warn('Demo tiles also not accessible, using offline style:', demoError);
            mapStyle = createOfflineStyle();
            usingFallback = true;
            console.log('Using minimal offline style')
          }
        }
      
      // Initialize MapLibre map
      console.log('Initializing map with style:', typeof mapStyle === 'string' ? mapStyle : 'custom style object')
      map.current = new maplibregl.Map({
        container: container,
        style: mapStyle as any, // Type assertion for custom style
        center: [0, 0],
        zoom: 1
      })

      console.log('MapLibre map initialized:', map.current)
      
      // Log map style after initialization to check if it's valid
      setTimeout(() => {
        if (map.current) {
          console.log('Map style after initialization:', map.current.getStyle())
        }
      }, 1000)

      // Force the map to render by triggering a resize
      setTimeout(() => {
        if (map.current) {
          map.current.resize()
          console.log('Map resized')
        }
      }, 100)

      // Add a basic layer after the map loads
      map.current.on('load', async () => {
        console.log('Map load event fired successfully')
        if (usingFallback) {
          if (typeof mapStyle === 'string') {
            console.log('Map loaded successfully using fallback demo tiles')
          } else {
            console.log('Map loaded successfully using minimal offline style')
          }
        } else {
          console.log('Map loaded successfully using custom PMTiles')
        }
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

            // Load countries
            try {
              const countriesResponse = await fetch('/ne_110m_admin_0_countries.geojson')
              const countriesGeoJson = await countriesResponse.json()
              
              // Filter out Antarctica (AQ) as in the original
              const filteredCountries = {
                ...countriesGeoJson,
                features: countriesGeoJson.features.filter((d: {properties: {ISO_A2: string}}) => d.properties.ISO_A2 !== 'AQ')
              }
              
              addCountries(filteredCountries)
              console.log(`Loaded ${filteredCountries.features.length} countries`)
              
            } catch (err) {
              console.error('Failed to load countries:', err)
            }
          } catch (err) {
            console.error('Error loading data:', err)
          }
        }
      })

      map.current.on('error', (e: maplibregl.ErrorEvent) => {
        console.error('Map error details:', {
          error: e.error,
          type: e.type
        })
        
        // Provide more specific error messages based on the error context
        let errorMessage = 'Map error: Unknown error'
        if (e.error?.message) {
          if (e.error.message.includes('Load failed') || e.error.message.includes('fetch')) {
            errorMessage = `Map error: Failed to load map data. Please check your internet connection and try refreshing the page.`
          } else if (e.error.message.includes('tile')) {
            errorMessage = `Map error: Failed to load map tiles. The map service may be temporarily unavailable.`
          } else if (e.error.message.includes('style')) {
            errorMessage = `Map error: Failed to load map style. Attempting to use fallback map.`
          } else {
            errorMessage = `Map error: ${e.error.message}`
          }
        }
        
        // If this is a style loading error, try to fallback to demo tiles, then offline
        if (e.error?.message?.includes('style') || e.error?.message?.includes('Load failed')) {
          console.log('Attempting fallback to demo tiles due to error:', e.error?.message)
          try {
            map.current?.setStyle('https://demotiles.maplibre.org/style.json')
            errorMessage = 'Map error: Using fallback map due to loading issues. Some features may be limited.'
          } catch (fallbackError) {
            console.error('Fallback to demo tiles also failed, trying offline style:', fallbackError)
            try {
              map.current?.setStyle(createOfflineStyle())
              errorMessage = 'Map error: Using minimal offline map. Please check your internet connection for full features.'
            } catch (offlineError) {
              console.error('Even offline style failed:', offlineError)
              errorMessage = 'Map error: Failed to load any map style. Please refresh the page.'
            }
          }
        }
        
        setError(errorMessage)
        setIsLoading(false)
      })

      // Handle style data errors (e.g., failed to load style.json)
      map.current.on('styledata', () => {
        console.log('Style data loaded successfully')
      })

      map.current.on('styledatafailed', (e: any) => {
        console.error('Style data failed to load:', e)
        setError('Map error: Failed to load map style. Please check your internet connection and try refreshing the page.')
        setIsLoading(false)
      })

      // Handle source data errors (e.g., PMTiles loading failures)
      map.current.on('sourcedata', (e: any) => {
        if (e.isSourceLoaded && e.source && e.source.type === 'vector') {
          console.log('Vector source loaded successfully:', e.source.id)
        }
      })

      map.current.on('sourcedatafailed', (e: any) => {
        console.error('Source data failed to load:', e)
        setError('Map error: Failed to load map data source. The map service may be temporarily unavailable.')
        setIsLoading(false)
      })

      // Note: Removed timeout since map loads successfully with offline fallback
      // The visual map rendering is more reliable than MapLibre's internal loaded state

    } catch (err) {
      console.error('Failed to initialize MapLibre:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize map')
      setIsLoading(false)
    }
  }

  // Call the async initialization function
  initializeMap()

    return () => {
      map.current?.remove();
      // Clean up pmtiles protocol
      maplibregl.removeProtocol('pmtiles');
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

  const addCountries = (countriesGeoJson: FeatureCollection) => {
    if (!map.current) return

    // Check if source already exists to prevent "source already exists" error
    if (map.current.getSource('countries')) {
      console.log('Countries source already exists, skipping addition')
      return
    }

    // Add source and layer for countries
    map.current.addSource('countries', {
      type: 'geojson',
      data: countriesGeoJson
    })

    // Check if layer already exists to prevent "layer already exists" error
    if (!map.current.getLayer('countries-fill')) {
      map.current.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.15
        }
      })
    }

    // Check if layer already exists to prevent "layer already exists" error
    if (!map.current.getLayer('countries-stroke')) {
      map.current.addLayer({
        id: 'countries-stroke',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': '#065f46',
          'line-width': 1,
          'line-opacity': 0.6
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