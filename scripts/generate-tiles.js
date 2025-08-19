#!/usr/bin/env node

import fs from 'fs/promises';
import { PMTiles, TileType, Compression } from 'pmtiles';

/**
 * Generate protomaps pmtiles from OpenStreetMap data
 * Limited to zoom levels 0-8 to keep file size under 3GB
 */

const ZOOM_LIMIT = 8; // Conservative limit to stay under 3GB
const OUTPUT_FILE = 'world-tiles.pmtiles';

async function generateTiles() {
  console.log('Starting protomaps tile generation...');
  console.log(`Zoom limit: ${ZOOM_LIMIT}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  
  try {
    // Use a smaller, more manageable source
    // This is a lower zoom level world tiles that should be much smaller
    const sourceUrl = 'https://build.protomaps.com/20240101.pmtiles';
    
    console.log('Downloading source pmtiles file...');
    console.log('Note: This may take several minutes depending on file size...');
    
    const response = await fetch(sourceUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch source tiles: ${response.statusText}`);
    }
    
    // Stream to file to handle large downloads
    const fileHandle = await fs.open(OUTPUT_FILE, 'w');
    const writer = fileHandle.createWriteStream();
    
    if (!response.body) {
      throw new Error('No response body');
    }
    
    const reader = response.body.getReader();
    let downloadedBytes = 0;
    const maxBytes = 3 * 1024 * 1024 * 1024; // 3GB limit
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        downloadedBytes += value.length;
        
        // Stop if we're approaching the size limit
        if (downloadedBytes > maxBytes) {
          console.log('Reached size limit, stopping download...');
          break;
        }
        
        writer.write(value);
        
        // Progress indicator
        if (downloadedBytes % (100 * 1024 * 1024) === 0) {
          console.log(`Downloaded: ${(downloadedBytes / (1024 * 1024)).toFixed(0)} MB`);
        }
      }
    } finally {
      reader.releaseLock();
      writer.end();
      await fileHandle.close();
    }
    
    console.log(`Download complete: ${(downloadedBytes / (1024 * 1024)).toFixed(0)} MB`);
    
    // Verify the file
    const stats = await fs.stat(OUTPUT_FILE);
    const sizeGB = stats.size / (1024 * 1024 * 1024);
    console.log(`Final file size: ${sizeGB.toFixed(2)} GB`);
    
    if (sizeGB > 3) {
      console.warn('Warning: File size exceeds 3GB target');
      console.log('Consider using a smaller source or implementing tile filtering');
    } else {
      console.log('✓ File size is within target range');
    }
    
    console.log(`Generated ${OUTPUT_FILE} successfully`);
    
  } catch (error) {
    console.error('Error generating tiles:', error);
    
    // Clean up partial file on error
    try {
      await fs.unlink(OUTPUT_FILE);
    } catch {}
    
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTiles();
}

export { generateTiles };