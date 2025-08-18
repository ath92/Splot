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
}

export interface FlightsData {
  airports: Record<string, Airport>
  flights: Flight[]
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
    
    return {
      startLat: fromAirport.latitude,
      startLng: fromAirport.longitude,
      endLat: toAirport.latitude,
      endLng: toAirport.longitude,
      color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9f43', '#ee5a6f', '#00d2d3'][index % 8],
      route: flight.route,
      id: flight.id
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