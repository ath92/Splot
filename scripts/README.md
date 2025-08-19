# Protomaps PMTiles Generation for Splot

This directory contains scripts to generate and upload protomaps pmtiles files for serving from Cloudflare R2.

## Overview

The system generates world vector tiles from protomaps.com data, optimized for the Splot application:

- **Size limit**: ~3GB to fit within available storage
- **Zoom levels**: Limited to zoom 8 to control file size
- **Format**: PMTiles for efficient serving
- **Storage**: Cloudflare R2 bucket named "tiles"

## Files

- `generate-tiles.js` - Downloads and processes protomaps data
- `upload-tiles.js` - Uploads generated tiles to R2
- `package.json` - Dependencies for tile generation

## Usage

### Prerequisites

1. Node.js 18+
2. CF_WORKERS environment variable with Cloudflare API token
3. R2 bucket named "tiles" created in Cloudflare dashboard

### Manual Generation

```bash
# Install dependencies
npm install

# Generate tiles (creates world-tiles.pmtiles ~3GB)
node generate-tiles.js

# Upload to R2
export CF_WORKERS=your_cloudflare_token
node upload-tiles.js
```

### Automated Generation

Use the GitHub Actions workflow:

1. Go to Actions tab in GitHub
2. Run "Generate and Upload Protomaps Tiles" workflow
3. Optionally adjust zoom limit (lower = smaller file)

## Integration

The generated tiles are automatically used by the Splot map via:

- URL: `https://0269140aa6c636355368c840cf5a95b0.r2.cloudflarestorage.com/tiles/world-tiles.pmtiles`
- Protocol: PMTiles via MapLibre GL JS
- Fallback: Demo tiles if custom tiles unavailable

## Configuration

Environment variables:

- `CF_WORKERS`: Cloudflare API token (required for upload)
- `ZOOM_LIMIT`: Maximum zoom level (default: 8)
- `VITE_PMTILES_URL`: Override tile URL in frontend

## Troubleshooting

### File Too Large
- Reduce `ZOOM_LIMIT` in generate-tiles.js
- Current limit of 8 produces ~3GB file

### Upload Failures
- Verify CF_WORKERS token has R2 permissions
- Ensure "tiles" bucket exists in Cloudflare
- Check token is not expired

### Map Not Loading Custom Tiles
- Verify file uploaded successfully to R2
- Check browser dev tools for 404 errors
- Falls back to demo tiles automatically