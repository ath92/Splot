#!/usr/bin/env node

import fs from 'fs/promises';
import { spawn } from 'child_process';

/**
 * Generate protomaps pmtiles from OpenStreetMap data
 * Uses pmtiles CLI with maxzoom flag to properly limit zoom levels
 */

const ZOOM_LIMIT = parseInt(process.env.ZOOM_LIMIT) || 8; // Conservative limit, configurable via env var
const OUTPUT_FILE = 'world-tiles.pmtiles';

/**
 * Execute a command and return a promise
 */
function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: false
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function generateTiles() {
  console.log('Starting protomaps tile generation...');
  console.log(`Maximum zoom level: ${ZOOM_LIMIT}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  
  try {
    // Source URL for protomaps world tiles
    const sourceUrl = 'https://build.protomaps.com/20240101.pmtiles';
    
    console.log('Extracting tiles with pmtiles CLI...');
    console.log('This will download only the tiles needed for the specified zoom levels.');
    
    // Use pmtiles extract command with maxzoom flag
    await executeCommand('pmtiles', [
      'extract',
      sourceUrl,
      OUTPUT_FILE,
      '--maxzoom', ZOOM_LIMIT.toString()
    ]);
    
    // Verify the generated file
    const stats = await fs.stat(OUTPUT_FILE);
    const sizeGB = stats.size / (1024 * 1024 * 1024);
    console.log(`Final file size: ${sizeGB.toFixed(2)} GB`);
    
    console.log(`✓ Generated ${OUTPUT_FILE} successfully with zoom levels 0-${ZOOM_LIMIT}`);
    
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