/**
 * Photo Upload Cloudflare Worker
 * Handles photo uploads and geolocation metadata extraction for Splot
 * Also serves PMTiles for map tiles
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import exifr from 'exifr';
import { handlePMTilesRequest } from './pmtiles.js';

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type"]
}));

// Routes
app.get('/', (c) => serveUploadForm());
app.post('/', async (c) => handlePhotoUpload(c));
app.get('/photos', async (c) => handlePhotoList(c));
app.get('/photo/:filename', async (c) => handlePhotoServe(c));

// PMTiles routes
app.get('/tiles/:name/:z/:x/:y.:ext', async (c) => {
  return handlePMTilesRequest(c.req.raw, c.env, c.executionCtx);
});
app.get('/tiles/:name.json', async (c) => {
  return handlePMTilesRequest(c.req.raw, c.env, c.executionCtx);
});

// Serve raw PMTiles archive files for direct access
app.get('/tiles/:name.pmtiles', async (c) => {
  try {
    const env = c.env;
    const name = c.req.param('name');
    
    if (!env.TILES) {
      return c.json({ error: "PMTiles storage not configured" }, 500);
    }

    // Get the PMTiles archive from R2
    const object = await env.TILES.get(`${name}.pmtiles`);
    
    if (!object) {
      return c.json({ error: "PMTiles archive not found" }, 404);
    }

    // Return with appropriate headers for PMTiles
    return new Response(object.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Range",
        "Vary": "Origin",
        "Cache-Control": "public, max-age=86400",
        // Support range requests for PMTiles
        "Accept-Ranges": "bytes"
      }
    });
  } catch (error) {
    console.error("PMTiles archive serve error:", error);
    return c.json({ 
      error: "Failed to serve PMTiles archive", 
      details: error.message 
    }, 500);
  }
});

export default app;

function serveUploadForm() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Splot Photo Upload</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #121212;
            color: #ffffff;
        }
        .upload-form {
            background: #1e1e1e;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #ffffff;
            margin-bottom: 20px;
            text-align: center;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #cccccc;
            font-weight: 500;
        }
        input[type="file"] {
            width: 100%;
            padding: 12px;
            border: 2px dashed #444;
            border-radius: 6px;
            background: #2a2a2a;
            color: #ffffff;
            cursor: pointer;
        }
        input[type="file"]:hover {
            border-color: #666;
        }
        button {
            background: #0066cc;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 10px;
        }
        button:hover {
            background: #0052a3;
        }
        button:disabled {
            background: #333;
            cursor: not-allowed;
        }
        .info {
            background: #2a4a2a;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #4a8a4a;
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        .success {
            background: #2a4a2a;
            border: 1px solid #4a8a4a;
            color: #8ae68a;
        }
        .error {
            background: #4a2a2a;
            border: 1px solid #8a4a4a;
            color: #e68a8a;
        }
    </style>
</head>
<body>
    <div class="upload-form">
        <h1>📸 Upload Photo to Splot Globe</h1>
        
        <div class="info">
            <strong>Note:</strong> Upload JPEG images with GPS metadata to display them on the globe. 
            The location will be automatically extracted from the photo's EXIF data.
        </div>

        <form id="uploadForm" enctype="multipart/form-data">
            <div class="form-group">
                <label for="photo">Select Photo (JPEG):</label>
                <input type="file" id="photo" name="photo" accept="image/jpeg,.jpg,.jpeg" required>
            </div>
            
            <button type="submit" id="submitBtn">Upload Photo</button>
        </form>

        <div id="status" class="status"></div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('photo');
            const submitBtn = document.getElementById('submitBtn');
            const status = document.getElementById('status');
            
            if (!fileInput.files[0]) {
                showStatus('Please select a file', 'error');
                return;
            }

            const file = fileInput.files[0];
            if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
                showStatus('Please select a JPEG image', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';
            
            try {
                const formData = new FormData();
                formData.append('photo', file);
                
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showStatus(\`Photo uploaded successfully! Location: \${result.location || 'No GPS data found'}\`, 'success');
                    document.getElementById('uploadForm').reset();
                } else {
                    showStatus(\`Upload failed: \${result.error}\`, 'error');
                }
            } catch (error) {
                showStatus(\`Upload failed: \${error.message}\`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Upload Photo';
            }
        });

        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = \`status \${type}\`;
            status.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    status.style.display = 'none';
                }, 5000);
            }
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html"
    }
  });
}

async function handlePhotoUpload(c) {
  try {
    const env = c.env;
    
    // Check if R2 bucket is available
    if (!env.GLOBE) {
      throw new Error("R2 bucket not configured");
    }

    // Parse the multipart form data
    const formData = await c.req.formData();
    const photoFile = formData.get('photo');
    
    if (!photoFile || typeof photoFile === 'string') {
      return c.json({ 
        error: "No photo file provided" 
      }, 400);
    }

    // Validate file type
    if (!photoFile.type.includes('jpeg') && !photoFile.type.includes('jpg')) {
      return c.json({ 
        error: "Only JPEG images are supported" 
      }, 400);
    }

    // Convert to ArrayBuffer for EXIF processing
    const arrayBuffer = await photoFile.arrayBuffer();
    
    // Extract EXIF data, especially GPS information
    let exifData = {};
    let gpsData = null;
    
    try {
      exifData = await exifr.parse(arrayBuffer, {
        gps: true,
        tiff: true,
        ifd0: true,
        exif: true
      });
      
      // Extract GPS coordinates if available
      if (exifData && (exifData.latitude !== undefined && exifData.longitude !== undefined)) {
        gpsData = {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          altitude: exifData.altitude || null
        };
      }
    } catch (exifError) {
      console.warn("Could not extract EXIF data:", exifError);
      // Continue without EXIF data
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `photo_${timestamp}_${randomSuffix}.jpg`;

    // Prepare metadata for R2
    const metadata = {
      uploadedAt: new Date().toISOString(),
      originalName: photoFile.name,
      fileSize: arrayBuffer.byteLength.toString(),
      mimeType: photoFile.type
    };

    // Add GPS data to metadata if available
    if (gpsData) {
      metadata.latitude = gpsData.latitude.toString();
      metadata.longitude = gpsData.longitude.toString();
      if (gpsData.altitude) {
        metadata.altitude = gpsData.altitude.toString();
      }
    }

    // Add other EXIF data as metadata
    if (exifData) {
      if (exifData.Make) metadata.cameraMake = exifData.Make;
      if (exifData.Model) metadata.cameraModel = exifData.Model;
      if (exifData.DateTime) metadata.dateTime = exifData.DateTime;
    }

    // Upload to R2 bucket
    await env.GLOBE.put(filename, arrayBuffer, {
      customMetadata: metadata,
      httpMetadata: {
        contentType: photoFile.type
      }
    });

    // Return success response
    const responseData = {
      success: true,
      filename: filename,
      fileSize: arrayBuffer.byteLength,
      uploadedAt: metadata.uploadedAt,
      location: gpsData ? `${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}` : null,
      hasGpsData: !!gpsData
    };

    return c.json(responseData);

  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ 
      error: "Upload failed", 
      details: error.message 
    }, 500);
  }
}

async function handlePhotoList(c) {
  try {
    const env = c.env;
    
    // Check if R2 bucket is available
    if (!env.GLOBE) {
      throw new Error("R2 bucket not configured");
    }

    // List all objects in the R2 bucket
    const listResult = await env.GLOBE.list();
    
    if (!listResult || !listResult.objects) {
      return c.json({
        photos: [],
        count: 0
      });
    }

    // Process each object to get metadata and filter for photos with GPS data
    const photosWithLocation = [];
    
    for (const object of listResult.objects) {
      try {
        // Get object metadata
        const objectInfo = await env.GLOBE.head(object.key);
        
        if (objectInfo && objectInfo.customMetadata) {
          const metadata = objectInfo.customMetadata;
          
          // Check if this photo has GPS coordinates
          if (metadata.latitude && metadata.longitude) {
            // Generate URL for the photo
            // For now, we'll use a relative URL that can be accessed via the worker
            // In a production setup, this could be a signed URL or public R2 URL
            const photoUrl = `${new URL(c.req.url).origin}/photo/${object.key}`;
            
            photosWithLocation.push({
              filename: object.key,
              url: photoUrl,
              location: {
                latitude: parseFloat(metadata.latitude),
                longitude: parseFloat(metadata.longitude),
                altitude: metadata.altitude ? parseFloat(metadata.altitude) : null
              },
              uploadedAt: metadata.uploadedAt,
              fileSize: metadata.fileSize ? parseInt(metadata.fileSize) : object.size,
              originalName: metadata.originalName,
              cameraMake: metadata.cameraMake,
              cameraModel: metadata.cameraModel,
              dateTime: metadata.dateTime
            });
          }
        }
      } catch (metadataError) {
        console.warn(`Could not get metadata for ${object.key}:`, metadataError);
        // Continue with next object
      }
    }

    // Return the list of photos with GPS data
    return c.json({
      photos: photosWithLocation,
      count: photosWithLocation.length
    });

  } catch (error) {
    console.error("Photo list error:", error);
    return c.json({ 
      error: "Failed to list photos", 
      details: error.message 
    }, 500);
  }
}

async function handlePhotoServe(c) {
  try {
    const env = c.env;
    const filename = c.req.param('filename');
    
    // Check if R2 bucket is available
    if (!env.GLOBE) {
      throw new Error("R2 bucket not configured");
    }

    // Get the photo from R2
    const object = await env.GLOBE.get(filename);
    
    if (!object) {
      return c.json({ 
        error: "Photo not found" 
      }, 404);
    }

    // Get content type from metadata, fallback to jpeg
    const contentType = object.httpMetadata?.contentType || "image/jpeg";

    // Return the photo with appropriate headers
    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000" // Cache for 1 year
      }
    });

  } catch (error) {
    console.error("Photo serve error:", error);
    return c.json({ 
      error: "Failed to serve photo", 
      details: error.message 
    }, 500);
  }
}