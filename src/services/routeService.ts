// Route service for fetching and managing travel route data
export interface RouteLocation {
  name: string
  lat: number
  lng: number
}

export interface Route {
  id: string
  name: string
  type: 'flight' | 'ground'
  startLocation: RouteLocation
  endLocation: RouteLocation
  startDate: string
  endDate: string
}

export interface RouteData {
  routes: Route[]
}

export interface RouteArc {
  id: string
  name: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
  route: Route
}

export interface RoutePath {
  id: string
  name: string
  points: [number, number][] // [lat, lng] pairs
  color: string
  route: Route
}

/**
 * Fetch route data from the static JSON file
 */
export async function fetchRouteData(): Promise<RouteData> {
  try {
    const response = await fetch('/route-data.json')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch route data: ${response.status} ${response.statusText}`)
    }
    
    const data: RouteData = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching route data:', error)
    throw error
  }
}

/**
 * Transform flight routes to arcs format for ThreeGlobe
 */
export function transformFlightsToArcs(routes: Route[]): RouteArc[] {
  const flightRoutes = routes.filter(route => route.type === 'flight')
  
  return flightRoutes.map((route, index) => ({
    id: route.id,
    name: route.name,
    startLat: route.startLocation.lat,
    startLng: route.startLocation.lng,
    endLat: route.endLocation.lat,
    endLng: route.endLocation.lng,
    color: getFlightColor(index),
    route
  }))
}

/**
 * Transform ground routes to paths format for ThreeGlobe
 */
export function transformGroundToPaths(routes: Route[]): RoutePath[] {
  const groundRoutes = routes.filter(route => route.type === 'ground')
  
  return groundRoutes.map((route, index) => ({
    id: route.id,
    name: route.name,
    points: [
      [route.startLocation.lat, route.startLocation.lng],
      [route.endLocation.lat, route.endLocation.lng]
    ],
    color: getGroundColor(index),
    route
  }))
}

/**
 * Get color for flight arcs
 */
function getFlightColor(index: number): string {
  const flightColors = [
    '#ff6b6b', // Red
    '#4ecdc4', // Teal
    '#45b7d1', // Blue
    '#96ceb4', // Green
    '#feca57', // Yellow
    '#ff9ff3', // Pink
    '#54a0ff', // Light Blue
    '#5f27cd', // Purple
    '#00d2d3'  // Cyan
  ]
  return flightColors[index % flightColors.length]
}

/**
 * Get color for ground paths
 */
function getGroundColor(index: number): string {
  const groundColors = [
    '#ff7675', // Light Red
    '#74b9ff', // Light Blue
    '#a29bfe', // Light Purple
    '#fd79a8', // Light Pink
    '#fdcb6e', // Light Orange
    '#6c5ce7', // Medium Purple
    '#55a3ff'  // Sky Blue
  ]
  return groundColors[index % groundColors.length]
}