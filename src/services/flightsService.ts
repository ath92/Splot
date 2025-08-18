// Flights service for handling flight data
import flightsData from '../data/flights.json'

export interface Airport {
  code: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
}

export interface Flight {
  id: number
  from: string
  to: string
  route: string
}

export interface FlightArc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
  route: string
  id: number
  altitude: number
}

export interface FlightsData {
  airports: Record<string, Airport>
  flights: Flight[]
}

/**
 * Calculate great circle distance between two points in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate appropriate arc altitude based on flight distance
 * Shorter flights get lower altitudes, longer flights get higher altitudes
 */
function calculateArcAltitude(distanceKm: number): number {
  // Distance thresholds
  const minDistance = 200 // km - very short flights
  const maxDistance = 12000 // km - very long flights (e.g., AMS to XMN)
  
  // Altitude range
  const minAltitude = 0.05 // Low altitude for short flights
  const maxAltitude = 0.25 // High altitude for long flights
  
  // Clamp distance to our range
  const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distanceKm))
  
  // Calculate proportional altitude using a slight curve to emphasize the difference
  const ratio = (clampedDistance - minDistance) / (maxDistance - minDistance)
  const curvedRatio = Math.pow(ratio, 0.7) // Slight curve to give more altitude to long flights
  
  return minAltitude + (maxAltitude - minAltitude) * curvedRatio
}

/**
 * Get all flights data
 */
export function getFlightsData(): FlightsData {
  return flightsData as FlightsData
}

/**
 * Transform flight data to globe arcs format
 */
export function transformFlightsToGlobeArcs(flightsData: FlightsData): FlightArc[] {
  const { airports, flights } = flightsData
  
  return flights.map((flight, index) => {
    const fromAirport = airports[flight.from]
    const toAirport = airports[flight.to]
    
    if (!fromAirport || !toAirport) {
      console.warn(`Missing airport data for flight ${flight.route}`)
      return null
    }
    
    // Calculate distance and appropriate altitude
    const distance = calculateDistance(
      fromAirport.latitude, 
      fromAirport.longitude,
      toAirport.latitude, 
      toAirport.longitude
    )
    const altitude = calculateArcAltitude(distance)
    
    return {
      startLat: fromAirport.latitude,
      startLng: fromAirport.longitude,
      endLat: toAirport.latitude,
      endLng: toAirport.longitude,
      color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9f43', '#ee5a6f', '#00d2d3'][index % 8],
      route: flight.route,
      id: flight.id,
      altitude: altitude
    }
  }).filter(Boolean) as FlightArc[]
}

/**
 * Get airport by code
 */
export function getAirport(code: string): Airport | undefined {
  const data = flightsData as FlightsData
  return data.airports[code]
}

/**
 * Get all airports
 */
export function getAllAirports(): Airport[] {
  const data = flightsData as FlightsData
  return Object.values(data.airports)
}