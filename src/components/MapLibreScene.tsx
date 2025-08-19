import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { 
  fetchPhotos, 
  type Photo 
} from '../services/photoService'
import { 
  getFlightsData
} from '../services/flightsService'

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

    try {
      // Initialize the map with absolute minimal configuration to debug
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json', // Use a working style
        center: [0, 20],
        zoom: 2
      })

      console.log('MapLibre map initialized:', map.current)

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

      // Wait for map to be loaded before adding data
      map.current.on('load', async () => {
        console.log('Map fully loaded, loading data...')
        await loadData()
      })

      // Fallback: if load event doesn't fire, try after a timeout
      setTimeout(async () => {
        console.log('Timeout fallback: loading data...')
        await loadData()
      }, 3000)

      // Add debug events
      map.current.on('styledata', () => {
        console.log('Map style loaded successfully')
      })

      map.current.on('error', (e) => {
        console.error('Map error:', e)
      })

      map.current.on('tiledataloading', () => {
        console.log('Loading tiles...')
      })

      map.current.on('data', (e) => {
        console.log('Map data event:', e.type, e.dataType)
      })

    } catch (err) {
      console.error('Failed to initialize MapLibre:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize map')
    }

    return () => {
      map.current?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // loadData is intentionally not in dependencies to avoid recreation

  const loadData = async () => {
    if (!map.current) return

    setIsLoading(true)
    setError(null)

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
        setError(err instanceof Error ? err.message : 'Failed to load countries')
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const addPhotoMarkers = (photos: Photo[]) => {
    if (!map.current) return

    console.log('Adding photo markers:', photos.length)

    // Create GeoJSON source for photo markers
    const photoFeatures = photos.map((photo, index) => ({
      type: 'Feature',
      properties: {
        photo: JSON.stringify(photo), // Store photo data for click handling
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][index % 5],
        index: index
      },
      geometry: {
        type: 'Point',
        coordinates: [photo.location.longitude, photo.location.latitude]
      }
    }))

    // Add source for photo markers
    map.current.addSource('photos', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: photoFeatures as any[]
      }
    })

    // Add layer for photo markers
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

    // Add click handler for photo markers using map events
    map.current.on('click', 'photos', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0]
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

    const { airports, flights } = flightsData
    
    // Convert flights to GeoJSON LineString features
    const flightFeatures = flights.map((flight: {from: string, to: string, route: string, id: number}, index: number) => {
      const fromAirport = airports[flight.from]
      const toAirport = airports[flight.to]
      
      if (!fromAirport || !toAirport) {
        return null
      }

      return {
        type: 'Feature',
        properties: {
          route: flight.route,
          id: flight.id.toString(),
          color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9f43', '#ee5a6f', '#00d2d3'][index % 8]
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [fromAirport.longitude, fromAirport.latitude],
            [toAirport.longitude, toAirport.latitude]
          ]
        }
      }
    }).filter(Boolean)

    // Add source and layer for flight paths
    map.current.addSource('flights', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: flightFeatures.filter(Boolean) as any[]
      }
    })

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

  const addCountries = (countriesGeoJson: {type: string, features: Array<{properties: {ISO_A2: string}}>}) => {
    if (!map.current) return

    // Add source and layer for countries
    map.current.addSource('countries', {
      type: 'geojson',
      data: countriesGeoJson as any
    })

    map.current.addLayer({
      id: 'countries-fill',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.15
      }
    })

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