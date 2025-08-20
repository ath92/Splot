# Testing Configuration

This project uses Playwright for end-to-end testing with special WebGL configuration for MapLibre GL JS testing.

## WebGL Support

MapLibre GL JS requires WebGL to render maps. By default, Playwright runs in headless mode without WebGL support, which causes MapLibre to fail silently. To address this, our Playwright configuration includes WebGL software emulation.

### Configuration

The `playwright.config.ts` file includes browser-specific WebGL configurations:

#### Chromium
```javascript
launchOptions: {
  args: ['--use-gl=swiftshader', '--disable-web-security', '--disable-features=VizDisplayCompositor']
}
```

#### Firefox
```javascript
launchOptions: {
  firefoxUserPrefs: {
    'webgl.force-enabled': true,
    'webgl.disabled': false,
  }
}
```

#### WebKit
```javascript
launchOptions: {
  args: ['--enable-webgl']
}
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run specific test file
npx playwright test tests/map-webgl.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

## Test Structure

### WebGL Tests (`tests/map-webgl.spec.ts`)

1. **WebGL Support Test**: Verifies that WebGL context can be created and basic WebGL functionality is available
2. **Map Container Test**: Checks that the map container loads and has proper dimensions
3. **Console Error Test**: Ensures no critical errors occur during map initialization

## WebGL Troubleshooting

If you encounter WebGL-related issues:

1. **Check WebGL Support**: The test will log WebGL context information including renderer and vendor
2. **Browser-Specific Issues**: Different browsers may require different flags or configurations
3. **Software vs Hardware Rendering**: The configuration uses software emulation (`swiftshader`) which should work in headless environments

## Example WebGL Test Output

```
WebGL Context Info: {
  renderer: 'WebKit WebGL',
  vendor: 'WebKit', 
  version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
  maxTextureSize: 16384,
  maxVertexAttribs: 16
}
```

This confirms that WebGL is working correctly and MapLibre should be able to render maps.