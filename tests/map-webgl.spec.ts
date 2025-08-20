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