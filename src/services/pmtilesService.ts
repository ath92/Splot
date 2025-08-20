import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'

/**
 * PMTiles protocol service for MapLibre GL JS
 * Based on the official MapLibre PMTiles integration example
 */

let protocolRegistered = false

/**
 * Register the PMTiles protocol with MapLibre
 * This enables direct loading of PMTiles archives using pmtiles:// URLs
 */
export function registerPMTilesProtocol(): void {
  if (protocolRegistered) {
    console.log('PMTiles protocol already registered')
    return
  }

  try {
    // Create PMTiles protocol instance
    const protocol = new Protocol()
    
    // Register the pmtiles:// protocol with MapLibre
    maplibregl.addProtocol('pmtiles', protocol.tile)
    
    protocolRegistered = true
    console.log('PMTiles protocol registered successfully')
  } catch (error) {
    console.error('Failed to register PMTiles protocol:', error)
    throw error
  }
}

/**
 * Unregister the PMTiles protocol
 */
export function unregisterPMTilesProtocol(): void {
  if (!protocolRegistered) {
    return
  }

  try {
    maplibregl.removeProtocol('pmtiles')
    protocolRegistered = false
    console.log('PMTiles protocol unregistered')
  } catch (error) {
    console.error('Failed to unregister PMTiles protocol:', error)
  }
}

/**
 * Check if PMTiles protocol is registered
 */
export function isPMTilesProtocolRegistered(): boolean {
  return protocolRegistered
}

/**
 * Create PMTiles URL for a given archive
 * @param baseUrl - Base URL where PMTiles archive is hosted
 * @param archiveName - Name of the PMTiles archive (without .pmtiles extension)
 * @returns PMTiles protocol URL
 */
export function createPMTilesUrl(baseUrl: string, archiveName: string): string {
  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  // Create PMTiles URL - this points directly to the .pmtiles file
  return `pmtiles://${cleanBaseUrl}/${archiveName}.pmtiles`
}