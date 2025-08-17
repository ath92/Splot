# Splot Photo Upload Worker

A Cloudflare Worker that handles photo uploads with geolocation metadata extraction for the Splot project.

## What it does

- **Upload Form Interface**: Serves a web form on GET requests for uploading photos
- **Photo Processing**: Accepts JPEG image uploads via POST requests
- **EXIF Data Extraction**: Automatically extracts GPS coordinates and other metadata from photos
- **R2 Storage**: Stores photos in Cloudflare R2 bucket with comprehensive metadata
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

## Files

- `src/index.js` - The main worker code (photo upload and form serving)
- `wrangler.toml` - Cloudflare Worker configuration with R2 bucket binding
- `package.json` - Worker dependencies including exifr for EXIF extraction

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
   - The bucket is automatically bound to the worker as `GLOBE`

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

## Deployment

The worker is automatically deployed when:
- Changes are pushed to the `main` branch in the `worker/` directory
- Or manually triggered via GitHub Actions

The deployment uses the GitHub secrets for authentication with Cloudflare.