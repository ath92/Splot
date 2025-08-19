#!/usr/bin/env node

import fs from 'fs/promises';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * Upload pmtiles file to Cloudflare R2 bucket
 */

const BUCKET_NAME = 'tiles';
const FILE_NAME = 'world-tiles.pmtiles';
const R2_ENDPOINT = 'https://0269140aa6c636355368c840cf5a95b0.r2.cloudflarestorage.com';

async function uploadTiles() {
  console.log('Starting upload to R2...');
  
  // Get R2 credentials from environment
  const r2KeyId = process.env.R2_KEY_ID;
  const r2SecretKey = process.env.R2_SECRET_KEY;
  
  if (!r2KeyId) {
    console.error('R2_KEY_ID environment variable not found');
    console.log('Set it with: export R2_KEY_ID=your_key_id_here');
    process.exit(1);
  }
  
  if (!r2SecretKey) {
    console.error('R2_SECRET_KEY environment variable not found');
    console.log('Set it with: export R2_SECRET_KEY=your_secret_key_here');
    process.exit(1);
  }
  
  // Configure S3 client for R2
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: r2KeyId,
      secretAccessKey: r2SecretKey,
    },
  });
  
  try {
    // Check if bucket exists
    console.log(`Checking bucket: ${BUCKET_NAME}`);
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log('Bucket exists and is accessible');
    
    // Read the pmtiles file
    console.log(`Reading file: ${FILE_NAME}`);
    const fileBuffer = await fs.readFile(FILE_NAME);
    
    console.log(`File size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
    
    // Upload to R2
    console.log('Uploading to R2...');
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FILE_NAME,
      Body: fileBuffer,
      ContentType: 'application/x-protobuf',
      Metadata: {
        'generated-at': new Date().toISOString(),
        'generator': 'splot-tile-generator',
        'version': '1.0.0'
      }
    });
    
    const result = await s3Client.send(uploadCommand);
    console.log('Upload successful!', result);
    
    const publicUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${FILE_NAME}`;
    console.log(`Public URL: ${publicUrl}`);
    
  } catch (error) {
    console.error('Upload failed:', error);
    
    if (error.name === 'NoSuchBucket') {
      console.log(`\nBucket '${BUCKET_NAME}' does not exist.`);
      console.log('Please create it in the Cloudflare dashboard first.');
    } else if (error.name === 'AccessDenied') {
      console.log('\nAccess denied. Please check:');
      console.log('1. R2_KEY_ID and R2_SECRET_KEY have R2 permissions');
      console.log('2. Credentials are valid and not expired');
      console.log('3. Bucket exists and credentials have access to it');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadTiles();
}

export { uploadTiles };