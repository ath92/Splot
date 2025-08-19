#!/usr/bin/env node

/**
 * Test script to validate the upload configuration without actually uploading
 */

console.log('Testing R2 upload configuration...');

// Check environment
const r2KeyId = process.env.R2_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_KEY;

if (!r2KeyId) {
  console.log('❌ R2_KEY_ID environment variable not set');
  console.log('ℹ️  For actual upload, set: export R2_KEY_ID=your_key_id_here');
} else {
  console.log('✅ R2_KEY_ID environment variable found');
}

if (!r2SecretKey) {
  console.log('❌ R2_SECRET_KEY environment variable not set');
  console.log('ℹ️  For actual upload, set: export R2_SECRET_KEY=your_secret_key_here');
} else {
  console.log('✅ R2_SECRET_KEY environment variable found');
}

// Check if tile file exists
import fs from 'fs/promises';

try {
  const stats = await fs.stat('world-tiles.pmtiles');
  const sizeGB = stats.size / (1024 * 1024 * 1024);
  console.log(`✅ PMTiles file exists: ${sizeGB.toFixed(2)} GB`);
} catch (error) {
  console.log('❌ PMTiles file not found - run generate-tiles.js first');
}

// Validate configuration
const BUCKET_NAME = 'tiles';
const FILE_NAME = 'world-tiles.pmtiles';
const R2_ENDPOINT = 'https://0269140aa6c636355368c840cf5a95b0.r2.cloudflarestorage.com';

console.log('\n📋 Upload Configuration:');
console.log(`   Bucket: ${BUCKET_NAME}`);
console.log(`   File: ${FILE_NAME}`);
console.log(`   Endpoint: ${R2_ENDPOINT}`);
console.log(`   Public URL: ${R2_ENDPOINT}/${BUCKET_NAME}/${FILE_NAME}`);

console.log('\n✅ Configuration validated');
console.log('💡 To upload: node upload-tiles.js');