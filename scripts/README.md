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
2. **PMTiles CLI tool** - Download from [protomaps/go-pmtiles releases](https://github.com/protomaps/go-pmtiles/releases)
3. CF_WORKERS environment variable with Cloudflare API token
4. R2 bucket named "tiles" created in Cloudflare dashboard

### Manual Generation

```bash
# Install dependencies
npm install

# Install pmtiles CLI (Linux x64 example)
curl -L https://github.com/protomaps/go-pmtiles/releases/download/v1.28.0/go-pmtiles_1.28.0_Linux_x86_64.tar.gz -o pmtiles.tar.gz
tar -xzf pmtiles.tar.gz
sudo mv pmtiles /usr/local/bin/

# Generate tiles with proper zoom level extraction
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

- URL: `https://pub-a951d20402694897ae275d1758f4675c.r2.dev/world-tiles.pmtiles`
- Protocol: PMTiles via MapLibre GL JS
- Fallback: Demo tiles if custom tiles unavailable

## Configuration

Environment variables:

- `CF_WORKERS`: Cloudflare API token (required for upload)
- `ZOOM_LIMIT`: Maximum zoom level (default: 8)
- `VITE_PMTILES_URL`: Override tile URL in frontend

## Troubleshooting

## Technical Details

The tile generation process:

1. **Uses pmtiles CLI** to properly extract tiles from source data
2. **Applies maxzoom filtering** via `pmtiles extract --maxzoom N` command
3. **Downloads only required tiles** for specified zoom levels (not partial file downloads)
4. **Outputs PMTiles format** optimized for random access and efficient serving
5. **Automatic size management** through zoom level limitation

### File Too Large
- Reduce `ZOOM_LIMIT` in generate-tiles.js or via environment variable
- Each zoom level approximately doubles the file size
- Zoom level 8 typically produces ~3GB file for world coverage

### Upload Failures
- Verify CF_WORKERS token has R2 permissions
- Ensure "tiles" bucket exists in Cloudflare
- Check token is not expired

### Map Not Loading Custom Tiles
- Verify file uploaded successfully to R2
- Check browser dev tools for 404 errors
- Falls back to demo tiles automatically