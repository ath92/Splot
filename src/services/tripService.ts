// Trip service for managing travel route data
export interface TripLocation {
  name: string
  latitude: number
  longitude: number
}

export interface TripSegment {
  id: string
  from: TripLocation
  to: TripLocation
  startDate: string
  endDate: string
  type: 'flight' | 'ground' | 'stay'
  hasFlight: boolean
  notes?: string
}

export interface TripData {
  title: string
  segments: TripSegment[]
  locations: TripLocation[]
}

// Approximate coordinates for the trip locations
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  'China': [35.8617, 104.1954], // Central China
  'Korea': [35.9078, 127.7669], // Seoul area
  'Taiwan': [23.6978, 120.9605], // Central Taiwan
  'Vietnam': [14.0583, 108.2772], // Central Vietnam
  'Malaysia': [4.2105, 101.9758], // Kuala Lumpur
  'Indonesia': [-0.7893, 113.9213], // Central Indonesia
  'Singapore': [1.3521, 103.8198], // Singapore
  'London': [51.5074, -0.1278], // London, UK
  'Netherlands': [52.1326, 5.2913], // Central Netherlands
  'Bergamo': [45.6983, 9.6773], // Bergamo, Italy
  'Reggio': [38.1097, 15.6547], // Reggio Calabria, Italy
  'Puglia': [41.1255, 16.8672], // Bari, Puglia, Italy
  'San Marino': [43.9333, 12.4667], // San Marino
  'Ommen': [52.5167, 6.4167], // Ommen, Netherlands
}

/**
 * Parse the trip CSV data and create structured trip data
 */
export function parseTripData(): TripData {
  const tripData: TripData = {
    title: "Mini Retirement Trip 2025",
    segments: [],
    locations: []
  }

  // Define the trip segments based on the CSV data
  const rawSegments = [
    { name: 'China', dates: 'April 1, 2025 → April 22, 2025', hasFlight: true },
    { name: 'Korea', dates: 'April 22, 2025 → May 6, 2025', hasFlight: true },
    { name: 'Taiwan', dates: 'May 6, 2025 → May 16, 2025', hasFlight: true },
    { name: 'Vietnam', dates: 'May 16, 2025 → June 11, 2025', hasFlight: true },
    { name: 'Malaysia', dates: 'June 11, 2025 → June 30, 2025', hasFlight: true },
    { name: 'Indonesia', dates: 'June 30, 2025 → July 27, 2025', hasFlight: true },
    { name: 'Singapore', dates: 'July 27, 2025 → July 31, 2025', hasFlight: true },
    { name: 'London', dates: 'August 3, 2025 → August 4, 2025', hasFlight: true },
    { name: 'Netherlands', dates: 'August 4, 2025 → August 7, 2025', hasFlight: false },
    { name: 'Bergamo', dates: 'August 31, 2025 → September 5, 2025', hasFlight: false },
    { name: 'Puglia', dates: 'September 6, 2025 → September 19, 2025', hasFlight: false },
    { name: 'San Marino', dates: 'September 20, 2025 → September 23, 2025', hasFlight: false },
    { name: 'Reggio', dates: 'September 24, 2025 → September 26, 2025', hasFlight: false },
    { name: 'Bergamo', dates: 'September 26, 2025 → September 27, 2025', hasFlight: false },
    { name: 'Ommen', dates: 'September 28, 2025 → October 1, 2025', hasFlight: false },
  ]

  // Create location objects
  const locations: TripLocation[] = []
  const locationMap = new Map<string, TripLocation>()

  rawSegments.forEach(segment => {
    if (!locationMap.has(segment.name) && LOCATION_COORDINATES[segment.name]) {
      const [latitude, longitude] = LOCATION_COORDINATES[segment.name]
      const location: TripLocation = {
        name: segment.name,
        latitude,
        longitude
      }
      locations.push(location)
      locationMap.set(segment.name, location)
    }
  })

  // Create segments connecting the locations
  const segments: TripSegment[] = []
  
  for (let i = 0; i < rawSegments.length - 1; i++) {
    const current = rawSegments[i]
    const next = rawSegments[i + 1]
    
    const fromLocation = locationMap.get(current.name)
    const toLocation = locationMap.get(next.name)
    
    if (fromLocation && toLocation) {
      const segment: TripSegment = {
        id: `${current.name}-to-${next.name}`,
        from: fromLocation,
        to: toLocation,
        startDate: parseEndDate(current.dates),
        endDate: parseStartDate(next.dates),
        type: next.hasFlight ? 'flight' : 'ground',
        hasFlight: next.hasFlight,
        notes: next.hasFlight ? 'Flight connection' : 'Ground travel'
      }
      segments.push(segment)
    }
  }

  tripData.locations = locations
  tripData.segments = segments

  return tripData
}

/**
 * Parse start date from date range string
 */
function parseStartDate(dateRange: string): string {
  const match = dateRange.match(/^([^→]+)/)
  if (match) {
    return match[1].trim()
  }
  return dateRange
}

/**
 * Parse end date from date range string  
 */
function parseEndDate(dateRange: string): string {
  const match = dateRange.match(/→\s*(.+)$/)
  if (match) {
    return match[1].trim()
  }
  return dateRange
}

/**
 * Save trip data to JSON file (for development/reference)
 */
export function saveTripDataToJson(): string {
  const tripData = parseTripData()
  return JSON.stringify(tripData, null, 2)
}

/**
 * Get arcs data for flight routes
 */
export function getFlightArcs(): any[] {
  const tripData = parseTripData()
  return tripData.segments
    .filter(segment => segment.type === 'flight')
    .map(segment => ({
      startLat: segment.from.latitude,
      startLng: segment.from.longitude,
      endLat: segment.to.latitude,
      endLng: segment.to.longitude,
      color: '#ff6b6b',
      stroke: 2,
      altitude: 0.3
    }))
}

/**
 * Get paths data for ground routes
 */
export function getGroundPaths(): any[] {
  const tripData = parseTripData()
  return tripData.segments
    .filter(segment => segment.type === 'ground')
    .map(segment => ({
      coords: [
        [segment.from.longitude, segment.from.latitude], // lng, lat format for three-globe
        [segment.to.longitude, segment.to.latitude]
      ],
      color: '#4ecdc4',
      stroke: 3,
      altitude: 0.01
    }))
}

/**
 * Get all trip locations as points
 */
export function getTripPoints(): any[] {
  const tripData = parseTripData()
  return tripData.locations.map((location) => ({
    lat: location.latitude,
    lng: location.longitude,
    size: 1,
    color: '#feca57',
    label: location.name
  }))
}