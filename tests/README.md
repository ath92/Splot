# Playwright Tests for MapLibre Integration

This directory contains end-to-end tests for the Splot application's MapLibre GL JS integration, specifically testing the map load event and WebGL functionality in headless environments.

## Overview

The tests verify that the MapLibre map loads correctly and fires the expected load event, which is crucial for the application's photo and flight path visualization functionality.

## Test Files

- `maplibre.spec.ts` - Main test suite containing 7 test cases

## Test Cases

### 1. MapLibre map should load and fire load event
- **Purpose**: Core functionality test to ensure the map initializes and the load event fires
- **Verifies**: 
  - Map container visibility
  - Canvas element creation
  - Loading overlay disappears (setIsLoading(false))
  - Console message "Map load event fired"
  - Globe projection is set

### 2. MapLibre should handle initialization properly  
- **Purpose**: Verification of proper map initialization
- **Verifies**:
  - Console message "MapLibre map initialized"
  - Map container has proper dimensions (width > 0, height > 0)

### 3. MapLibre should load photo markers after map load
- **Purpose**: Tests that data loading happens after map initialization
- **Verifies**: 
  - Photo markers are added to the map
  - Console messages about photo loading

### 4. MapLibre should handle errors gracefully
- **Purpose**: Error handling verification
- **Verifies**:
  - Either error overlay appears (expected error behavior) OR map loads successfully
  - No unhandled JavaScript errors

### 5. MapLibre should use fallback demo tiles when custom style fails
- **Purpose**: Tests fallback mechanism when custom PMTiles fail
- **Verifies**:
  - Map still loads when tile requests are aborted
  - Fallback behavior works correctly

### 6. MapLibre should handle WebGL context loss gracefully
- **Purpose**: Tests WebGL context loss scenarios
- **Verifies**:
  - Application doesn't crash when WebGL context is lost
  - Graceful error handling

### 7. MapLibre should properly resize when window dimensions change
- **Purpose**: Tests responsive behavior
- **Verifies**:
  - Canvas resizes when viewport changes
  - Resize events are properly handled

## Running Tests

### Prerequisites
```bash
npm install
npx playwright install
```

### Run all tests (all browsers)
```bash
npm run test
```

### Run only Chromium tests (recommended for CI)
```bash
npx playwright test --project=chromium
```

### Run with UI mode
```bash
npm run test:ui
```

### Run in headed mode (see browser)
```bash
npm run test:headed
```

### Debug mode
```bash
npm run test:debug
```

## WebGL Configuration

The tests are configured with special browser flags to enable WebGL in headless environments:

### Chromium
- `--use-gl=egl`
- `--use-angle=gl` 
- `--enable-webgl`
- `--enable-accelerated-2d-canvas`
- `--disable-web-security`
- `--allow-running-insecure-content`
- `--ignore-gpu-blacklist`
- `--enable-unsafe-webgpu`

### Firefox  
- `webgl.force-enabled: true`
- `layers.acceleration.force-enabled: true`
- `webgl.disabled: false`

### WebKit
- `--enable-webgl`

## Expected Results

When running in a properly configured environment:
- **Chromium**: All tests should pass ✅
- **Firefox/WebKit**: May fail due to missing system dependencies in CI environments, but should work locally

## Console Output

Successful test runs show console messages like:
```
Browser console [log]: Initializing MapLibre map, container: JSHandle@node
Browser console [log]: Container dimensions: 1280 x 720
Browser console [log]: Using pmtiles TileJSON URL: https://...
Browser console [log]: MapLibre map initialized: ...
Browser console [log]: Map load event fired
Browser console [log]: Globe projection set
Browser console [log]: Adding photo markers: 18
Browser console [log]: Added 18 photo markers as GeoJSON features
Browser console [log]: Loaded 18 photos with GPS data
Browser console [log]: Loaded flight routes
```

## CI/CD Integration

For continuous integration, recommend:
1. Use `--project=chromium` for fastest, most reliable results
2. Set appropriate timeouts (tests can take 30-60 seconds)
3. Ensure WebGL dependencies are available in CI environment

## Troubleshooting

### Common Issues

1. **WebGL not available**: Check browser flags and system dependencies
2. **Tests timeout**: Increase timeout values, check network connectivity  
3. **Firefox/WebKit failures**: Often due to missing system libraries in CI
4. **Canvas not visible**: Check viewport size and element dimensions

### Debug Tips

1. Use `--headed` to see browser behavior
2. Use `--debug` to step through tests
3. Check console output for MapLibre initialization messages
4. Use `page.screenshot()` to capture visual state during debugging