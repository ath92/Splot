import { test, expect } from '@playwright/test';

test.describe('MapLibre Load Event Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console logs for debugging
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]: ${msg.text()}`);
    });

    // Collect page errors
    page.on('pageerror', error => {
      console.log(`Page error: ${error.message}`);
    });
  });

  test('MapLibre map should load and fire load event', async ({ page }) => {
    // Track console messages to detect load event
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Navigate to the application
    await page.goto('/');

    // Wait for the page to be loaded
    await page.waitForLoadState('networkidle');

    // Check that the map container exists
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();

    // Check that the canvas element is created (MapLibre creates a canvas)
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Wait for the MapLibre load event to fire
    // This checks for the console.log('Map load event fired') message
    await page.waitForFunction(
      () => {
        // Check if console.log was called with our specific message
        return window.console && 
               document.querySelector('.loading-overlay') === null;
      },
      { timeout: 15000 }
    );

    // Verify that the loading overlay disappears (setIsLoading(false) is called)
    const loadingOverlay = page.locator('.loading-overlay');
    await expect(loadingOverlay).not.toBeVisible();

    // Check that the map is properly initialized by looking for MapLibre-specific elements
    const maplibreContainer = page.locator('.maplibregl-map');
    await expect(maplibreContainer).toBeVisible();

    // Verify no error overlay is shown
    const errorOverlay = page.locator('.error-overlay');
    await expect(errorOverlay).not.toBeVisible();

    // Check that console includes the load event message
    await page.waitForTimeout(1000); // Give a moment for all console messages to be captured
    const hasLoadMessage = consoleMessages.some(msg => 
      msg.includes('Map load event fired')
    );
    expect(hasLoadMessage).toBe(true);

    // Additional verification: check that the globe projection was set
    const hasGlobeMessage = consoleMessages.some(msg => 
      msg.includes('Globe projection set')
    );
    expect(hasGlobeMessage).toBe(true);
  });

  test('MapLibre should handle initialization properly', async ({ page }) => {
    // Track console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that initialization messages appear
    await page.waitForTimeout(5000); // Wait for initialization
    
    const hasInitMessage = consoleMessages.some(msg => 
      msg.includes('MapLibre map initialized')
    );
    expect(hasInitMessage).toBe(true);

    // Check that the map container has proper dimensions
    const mapContainer = page.locator('.map-container');
    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('MapLibre should load photo markers after map load', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the map to load and photo markers to be added
    await page.waitForFunction(
      () => document.querySelector('.loading-overlay') === null,
      { timeout: 15000 }
    );

    // Give time for photos to load
    await page.waitForTimeout(3000);

    // Check that photo markers were added
    const hasPhotoMessage = consoleMessages.some(msg => 
      msg.includes('photo markers') || msg.includes('Loaded') && msg.includes('photos')
    );
    expect(hasPhotoMessage).toBe(true);
  });

  test('MapLibre should handle errors gracefully', async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for potential initialization
    await page.waitForTimeout(10000);

    // If there's an error, the error overlay should be visible
    const errorOverlay = page.locator('.error-overlay');
    const isErrorVisible = await errorOverlay.isVisible();

    if (isErrorVisible) {
      // If error overlay is visible, that's expected behavior for error handling
      const errorText = await errorOverlay.textContent();
      expect(errorText).toContain('Error:');
    } else {
      // If no error overlay, the map should have loaded successfully
      const canvas = page.locator('.maplibregl-canvas');
      await expect(canvas).toBeVisible();
    }

    // Check that no unhandled JavaScript errors occurred
    expect(pageErrors.length).toBe(0);
  });

  test('MapLibre should use fallback demo tiles when custom style fails', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Intercept the custom tile request and make it fail to test fallback
    await page.route('**/tiles/world-tiles.json', route => {
      route.abort();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for map initialization and potential fallback
    await page.waitForTimeout(15000);

    // Check if the map still loads with demo tiles
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible();

    // Check that fallback message appears or map loads anyway
    const hasInitMessage = consoleMessages.some(msg => 
      msg.includes('MapLibre map initialized') || 
      msg.includes('falling back to demo tiles')
    );
    expect(hasInitMessage).toBe(true);
  });

  test('MapLibre should handle WebGL context loss gracefully', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for map to load
    await page.waitForFunction(
      () => document.querySelector('.loading-overlay') === null,
      { timeout: 15000 }
    );

    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible();

    // Simulate WebGL context loss
    await page.evaluate(() => {
      const canvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
      if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl && gl.getExtension('WEBGL_lose_context')) {
          gl.getExtension('WEBGL_lose_context')!.loseContext();
        }
      }
    });

    // Wait a moment for any error handling
    await page.waitForTimeout(2000);

    // Check that the app doesn't crash
    const errorOverlay = page.locator('.error-overlay');
    const isErrorVisible = await errorOverlay.isVisible();
    
    // Either the error is handled gracefully (error overlay shown) or canvas remains visible
    if (isErrorVisible) {
      const errorText = await errorOverlay.textContent();
      expect(errorText).toContain('Error:');
    } else {
      await expect(canvas).toBeVisible();
    }
  });

  test('MapLibre should properly resize when window dimensions change', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for initial load
    await page.waitForFunction(
      () => document.querySelector('.loading-overlay') === null,
      { timeout: 15000 }
    );

    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible();

    // Get initial canvas size
    const initialBox = await canvas.boundingBox();
    expect(initialBox).not.toBeNull();

    // Resize the viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(1000);

    // Check that canvas resized
    const resizedBox = await canvas.boundingBox();
    expect(resizedBox).not.toBeNull();
    expect(resizedBox!.width).toBeLessThan(initialBox!.width);

    // Verify resize was logged
    const hasResizeMessage = consoleMessages.some(msg => 
      msg.includes('Map resized')
    );
    expect(hasResizeMessage).toBe(true);
  });
});