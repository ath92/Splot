/**
 * Network monitoring utilities for PMTiles requests
 */

/**
 * Setup network monitoring to log PMTiles requests to console
 */
export function setupPMTilesNetworkLogging(): () => void {
  // Store original fetch for restoration
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  console.log('[PMTiles Network] Network interceptors installed');

  // Intercept fetch requests
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    // Check if this is a PMTiles-related request
    if (isPMTilesRequest(url)) {
      const startTime = Date.now();
      console.log(`[PMTiles Network] Fetch request: ${getMethodFromInit(init)} ${url}`);
      
      try {
        const response = await originalFetch.call(this, input, init);
        const duration = Date.now() - startTime;
        const size = response.headers.get('content-length') || 'unknown';
        
        console.log(`[PMTiles Network] Fetch response: ${response.status} ${response.statusText} - ${url} (${duration}ms, ${size} bytes)`);
        
        // Log additional details for PMTiles responses
        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'unknown';
          console.log(`[PMTiles Network] Content-Type: ${contentType} - ${url}`);
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[PMTiles Network] Fetch error: ${error} - ${url} (${duration}ms)`);
        throw error;
      }
    }
    
    return originalFetch.call(this, input, init);
  };

  // Intercept XMLHttpRequest
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
    const urlString = typeof url === 'string' ? url : url.href;
    
    if (isPMTilesRequest(urlString)) {
      // Store request info for later use in send()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).__pmtilesUrl = urlString;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).__pmtilesMethod = method;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).__pmtilesStartTime = Date.now();
      
      console.log(`[PMTiles Network] XHR request: ${method} ${urlString}`);
      
      // Add event listeners for response
      this.addEventListener('loadend', function() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const duration = Date.now() - (this as any).__pmtilesStartTime;
        const size = this.getResponseHeader('content-length') || this.response?.length || 'unknown';
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`[PMTiles Network] XHR response: ${this.status} ${this.statusText} - ${(this as any).__pmtilesUrl} (${duration}ms, ${size} bytes)`);
        
        if (this.status >= 200 && this.status < 300) {
          const contentType = this.getResponseHeader('content-type') || 'unknown';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.log(`[PMTiles Network] Content-Type: ${contentType} - ${(this as any).__pmtilesUrl}`);
        }
      });
      
      this.addEventListener('error', function() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const duration = Date.now() - (this as any).__pmtilesStartTime;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error(`[PMTiles Network] XHR error - ${(this as any).__pmtilesUrl} (${duration}ms)`);
      });
    }
    
    return originalXHROpen.call(this, method, url, async ?? true, user, password);
  };

  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((this as any).__pmtilesUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`[PMTiles Network] XHR sending request to ${(this as any).__pmtilesUrl}`);
    }
    return originalXHRSend.call(this, body);
  };

  // Return cleanup function
  return () => {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.send = originalXHRSend;
  };
}

/**
 * Check if a URL is related to PMTiles requests
 */
function isPMTilesRequest(url: string): boolean {
  return (
    url.includes('/tiles/') ||
    url.includes('.pmtiles') ||
    url.includes('pmtiles') ||
    url.endsWith('.json') && url.includes('tiles') ||
    url.match(/\/\d+\/\d+\/\d+\.(mvt|png|jpg|jpeg|webp|avif|pbf)$/) !== null
  );
}

/**
 * Extract method from fetch init options
 */
function getMethodFromInit(init?: RequestInit): string {
  return init?.method || 'GET';
}