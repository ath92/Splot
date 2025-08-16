/**
 * Photo Upload Cloudflare Worker
 * Handles photo uploads and geolocation metadata extraction for Splot
 */

import exifr from 'exifr';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (request.method === "GET") {
        // Serve upload form
        return serveUploadForm(corsHeaders);
      } else if (request.method === "POST") {
        // Handle photo upload
        return await handlePhotoUpload(request, env, corsHeaders);
      } else {
        return new Response("Method not allowed", { 
          status: 405, 
          headers: corsHeaders 
        });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
};

function serveUploadForm(corsHeaders) {
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
      "Content-Type": "text/html",
      ...corsHeaders
    }
  });
}

async function handlePhotoUpload(request, env, corsHeaders) {
  try {
    // Check if R2 bucket is available
    if (!env.GLOBE) {
      throw new Error("R2 bucket not configured");
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const photoFile = formData.get('photo');
    
    if (!photoFile || typeof photoFile === 'string') {
      return new Response(JSON.stringify({ 
        error: "No photo file provided" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Validate file type
    if (!photoFile.type.includes('jpeg') && !photoFile.type.includes('jpg')) {
      return new Response(JSON.stringify({ 
        error: "Only JPEG images are supported" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
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

    return new Response(JSON.stringify(responseData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ 
      error: "Upload failed", 
      details: error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}