/**
 * Utility functions for debug console visibility
 */

/**
 * Check if debug console should be visible based on URL query parameter or domain
 * @returns boolean indicating if debug console should be shown
 */
export function shouldShowDebugConsole(): boolean {
  // Check for debug query parameter
  const urlParams = new URLSearchParams(window.location.search)
  const debugParam = urlParams.get('debug')
  
  if (debugParam === 'true' || debugParam === '1') {
    return true
  }
  
  // Check if domain/subdomain contains "preview" (for Netlify PR previews)
  const hostname = window.location.hostname.toLowerCase()
  if (hostname.includes('preview')) {
    return true
  }
  
  return false
}