# Simple MapLibre with PMTiles

This folder contains a single-file setup for a MapLibre map that loads PMTiles directly from GitHub.

## Files

- `index.html` - Single HTML file with embedded MapLibre map
- `world-tiles-simple.pmtiles` - Vector map tiles (maxzoom 6, ~44 MB)
- `maplibre-gl.js` - MapLibre GL JS library
- `maplibre-gl.css` - MapLibre GL CSS styles  
- `pmtiles.js` - PMTiles protocol handler
- `generate-simple-tiles.js` - Script to regenerate the pmtiles file

## Usage

### Option 1: Local Development Server

```bash
# Using Node.js serve (recommended)
npx serve -p 8080 .

# Or using Python (basic, may have issues with large files)
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

### Option 2: GitHub Pages

1. Commit this folder to a GitHub repository
2. Enable GitHub Pages for the repository
3. Navigate to the deployed URL

The map will load the PMTiles file directly via HTTP, using range requests for efficient tile loading.

## Features

- **Self-contained**: All dependencies included locally
- **Small file size**: PMTiles with maxzoom 6 (~44 MB)
- **Vector tiles**: Rendered client-side with MapLibre GL JS
- **Globe projection**: 3D globe view for visual appeal
- **Dark theme**: Matches modern web aesthetics
- **Zoom controls**: Built-in navigation controls

## Technical Details

- **Map library**: MapLibre GL JS 5.6.2
- **Tile format**: PMTiles (protomaps format)
- **Data source**: OpenStreetMap via protomaps.com
- **Zoom levels**: 0-6 (world to country/state level)
- **Projection**: Globe (3D) with fallback to Web Mercator
- **Protocol**: Direct PMTiles loading via HTTP

## Map Layers

- Background (dark theme)
- Water bodies (blue)
- Land masses (dark gray)
- Country boundaries
- State/province boundaries (zoom 4+)
- Major roads (zoom 5+)
- Place names (zoom 3+)

## Regenerating Tiles

To create a new pmtiles file with different zoom levels:

1. Ensure `pmtiles` CLI is installed
2. Modify the `ZOOM_LIMIT` in `generate-simple-tiles.js`
3. Run: `node generate-simple-tiles.js`

Note: Higher zoom levels result in exponentially larger file sizes.

## Browser Compatibility

- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge (recent versions)
- Mobile browsers supported

## License

- Map data: © OpenStreetMap contributors
- Tiles: © Protomaps
- Code: MIT License