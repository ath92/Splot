# Splot Photo Upload Worker

A Cloudflare Worker that handles photo uploads with geolocation metadata extraction and PMTiles serving for the Splot project.

## What it does

- **Upload Form Interface**: Serves a web form on GET requests for uploading photos
- **Photo Processing**: Accepts JPEG image uploads via POST requests
- **EXIF Data Extraction**: Automatically extracts GPS coordinates and other metadata from photos
- **R2 Storage**: Stores photos in Cloudflare R2 bucket with comprehensive metadata
- **PMTiles Serving**: Serves vector map tiles from PMTiles archives stored in R2
- **CORS Support**: Includes CORS headers for web compatibility

## Features

### Upload Form (GET requests)
- Clean, responsive HTML interface with dark theme
- File validation (JPEG only)
- Progress feedback and error handling
- Mobile-friendly design

### Photo Upload Processing (POST requests)
- Validates JPEG file uploads
- Extracts geolocation metadata using EXIF data
- Stores photos in R2 bucket "globe" with metadata including:
  - GPS coordinates (latitude, longitude, altitude)
  - Camera information (make, model)
  - Timestamp data
  - File metadata (size, type, original name)
- Returns JSON response with upload status and location info

### PMTiles Processing (GET requests to /tiles/*)
- Serves vector map tiles from PMTiles archives stored in R2 bucket "tiles"
- Provides TileJSON metadata endpoints for map client configuration
- Supports individual tile serving with proper MIME types and caching
- Built-in CORS support for web map integration
- Based on the official protomaps/PMTiles serverless implementation

## Files

- `src/index.js` - The main worker code (photo upload and form serving)
- `src/pmtiles.js` - PMTiles serving functionality for vector map tiles
- `wrangler.toml` - Cloudflare Worker configuration with R2 bucket bindings
- `package.json` - Worker dependencies including exifr for EXIF extraction and pmtiles for tile serving

## Setup

To deploy this worker, you need to configure GitHub Secrets and R2 bucket:

1. **CF_WORKERS** - Your Cloudflare API Token
   - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Use the "Edit Cloudflare Workers" template
   - Ensure it has permissions: `Zone:Zone Settings:Read`, `Zone:Zone:Read`, `Account:Cloudflare Workers:Edit`

2. **CF_ACCOUNT_ID** - Your Cloudflare Account ID
   - Found in the Cloudflare dashboard right sidebar
   - Or visit: https://dash.cloudflare.com/ and copy the Account ID

3. **R2 Bucket Setup**
   - Create an R2 bucket named "globe" in your Cloudflare account
   - Create an R2 bucket named "tiles" in your Cloudflare account
   - The buckets are automatically bound to the worker as `GLOBE` and `TILES`

## API Endpoints

### `GET /` - Upload Form
Returns an HTML form for uploading photos.

### `POST /` - Photo Upload
Accepts multipart form data with a `photo` field containing a JPEG image.

**Request:**
```
Content-Type: multipart/form-data
```

**Success Response:**
```json
{
  "success": true,
  "filename": "photo_1692123456789_abc123.jpg",
  "fileSize": 1234567,
  "uploadedAt": "2023-08-16T10:30:45.123Z",
  "location": "37.774929, -122.419416",
  "hasGpsData": true
}
```

**Error Response:**
```json
{
  "error": "Only JPEG images are supported"
}
```

### `GET /photos` - List Photos with Location
Returns a JSON list of all uploaded photos that have geolocation metadata attached.

**Response:**
```json
{
  "photos": [
    {
      "filename": "photo_1692123456789_abc123.jpg",
      "url": "https://your-worker.domain.workers.dev/photo/photo_1692123456789_abc123.jpg",
      "location": {
        "latitude": 37.774929,
        "longitude": -122.419416,
        "altitude": 15.2
      },
      "uploadedAt": "2023-08-16T10:30:45.123Z",
      "fileSize": 1234567,
      "originalName": "vacation_photo.jpg",
      "cameraMake": "Apple",
      "cameraModel": "iPhone 14 Pro",
      "dateTime": "2023:08:16 10:30:45"
    }
  ],
  "count": 1
}
```

### `GET /photo/{filename}` - Serve Individual Photo
Returns the actual photo file for the given filename.

**Response:**
- Content-Type: image/jpeg
- Cache-Control: public, max-age=31536000

### `GET /tiles/{name}.json` - PMTiles TileJSON Metadata
Returns TileJSON metadata for the specified PMTiles archive.

**Example:** `/tiles/world-tiles.json`

**Response:**
```json
{
  "tilejson": "3.0.0",
  "name": "world-tiles",
  "description": "",
  "version": "1.0.0",
  "attribution": "© OpenStreetMap contributors",
  "scheme": "xyz",
  "tiles": [
    "https://your-worker.domain.workers.dev/tiles/world-tiles/{z}/{x}/{y}.mvt"
  ],
  "minzoom": 0,
  "maxzoom": 8,
  "bounds": [-180, -85.051128, 180, 85.051128],
  "center": [0, 0, 2]
}
```

### `GET /tiles/{name}/{z}/{x}/{y}.{ext}` - PMTiles Individual Tiles
Returns individual vector tiles from the PMTiles archive.

**Example:** `/tiles/world-tiles/2/1/1.mvt`

**Response:**
- Content-Type: application/x-protobuf (for .mvt tiles)
- Cache-Control: public, max-age=86400
- CORS headers included

## Deployment

The worker is automatically deployed when:
- Changes are pushed to the `main` branch in the `worker/` directory
- Or manually triggered via GitHub Actions

The deployment uses the GitHub secrets for authentication with Cloudflare.