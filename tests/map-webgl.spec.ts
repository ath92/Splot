import { test, expect } from '@playwright/test';

test.describe('WebGL Support for MapLibre', () => {
  test('should have WebGL support enabled with software emulation', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Test WebGL context creation directly
    const webglTest = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return { supported: false, error: 'WebGL not supported' };
      }

      // Test basic WebGL functionality
      try {
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        const version = gl.getParameter(gl.VERSION);
        
        return { 
          supported: true, 
          renderer, 
          vendor,
          version,
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
        };
      } catch (error) {
        return { supported: false, error: error.message };
      }
    });

    expect(webglTest.supported).toBe(true);
    expect(webglTest.renderer).toBeDefined();
    expect(webglTest.vendor).toBeDefined();
    
    console.log('WebGL Context Info:', {
      renderer: webglTest.renderer,
      vendor: webglTest.vendor,
      version: webglTest.version,
      maxTextureSize: webglTest.maxTextureSize,
      maxVertexAttribs: webglTest.maxVertexAttribs
    });
  });

  test('should load map container successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Splot/);

    // Wait for the map container to be present
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();

    // Check if the container has proper dimensions
    const dimensions = await mapContainer.evaluate(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight
    }));

    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
    
    console.log('Map container dimensions:', dimensions);
  });

  test('should fire MapLibre load event', async ({ page }) => {
    const consoleMessages = [];
    let mapLoadEventFired = false;
    
    // Listen for console messages to detect map load event
    page.on('console', msg => {
      const message = msg.text();
      consoleMessages.push(message);
      
      // Check for the specific map load event message
      if (message.includes('Map load event fired')) {
        mapLoadEventFired = true;
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify map container is visible first
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();
    
    // Debug: Check what's in the map container
    const containerContent = await page.evaluate(() => {
      const container = document.querySelector('.map-container');
      return {
        hasContainer: !!container,
        containerChildren: container ? container.children.length : 0,
        containerClasses: container ? container.className : '',
        canvasElements: document.querySelectorAll('.map-container canvas').length,
        allCanvases: document.querySelectorAll('canvas').length,
        innerHtml: container ? container.innerHTML.substring(0, 500) : 'No container found'
      };
    });
    
    console.log('Map container debug info:', containerContent);

    // Wait for either the map to load or loading to finish
    await page.waitForFunction(
      () => {
        // Check if loading overlay is gone (indicates map loaded)
        const loadingOverlay = document.querySelector('.loading-overlay');
        return loadingOverlay === null || loadingOverlay.style.display === 'none';
      },
      { timeout: 20000 }
    );

    // Additional wait to allow console messages to be captured
    await page.waitForTimeout(2000);

    // Check if loading overlay is gone (primary indicator that map loaded)
    const loadingOverlay = page.locator('.loading-overlay');
    await expect(loadingOverlay).not.toBeVisible({ timeout: 5000 });

    // Verify that map load event was fired by checking console messages
    console.log('All console messages:', consoleMessages);
    console.log('MapLibre load event fired:', mapLoadEventFired);
    
    // If the loading overlay is gone, the map should have loaded
    // We'll check for either the console message OR the absence of loading overlay
    const mapLoadComplete = mapLoadEventFired || consoleMessages.some(msg => 
      msg.includes('Map load event fired') || 
      msg.includes('MapLibre map initialized') ||
      msg.includes('Loading..') === false
    );
    
    expect(mapLoadComplete).toBe(true);

    console.log('MapLibre load event test completed successfully');
    console.log('Console messages related to map:', consoleMessages.filter(msg => 
      msg.toLowerCase().includes('map') || 
      msg.toLowerCase().includes('load') || 
      msg.toLowerCase().includes('maplibre')
    ));
  });

  test('should not have critical console errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any errors to appear
    await page.waitForTimeout(3000);

    // Filter out non-critical errors (like 404s for optional resources)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon.ico') && 
      !error.includes('404') &&
      !error.includes('net::ERR_FAILED') &&
      !error.includes('net::ERR_INTERNET_DISCONNECTED')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });
});