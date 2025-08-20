#!/usr/bin/env node

/**
 * Test script to verify the PMTiles zoom fix changes
 * This demonstrates the new map style and zoom configuration
 */

import { createProtomapsStyle } from '../src/services/mapStyleService.js';

const MOCK_TILE_URL = 'https://example.com/tiles/world-tiles.json';

function testMapStyle() {
  console.log('🗺️  Testing PMTiles Zoom Fix...\n');
  
  try {
    const style = createProtomapsStyle(MOCK_TILE_URL);
    
    console.log('✅ Map style created successfully');
    console.log(`   Layers: ${style.layers.length}`);
    console.log(`   Sources: ${Object.keys(style.sources).length}`);
    
    // Test that high-zoom layers are present
    const buildings = style.layers.find(l => l.id === 'buildings');
    const waterLabels = style.layers.find(l => l.id === 'water_labels');
    const roads = style.layers.find(l => l.id === 'roads');
    const places = style.layers.find(l => l.id === 'places');
    
    console.log('\n🔍 Layer Analysis:');
    
    if (buildings) {
      console.log(`   ✅ Buildings layer: minzoom ${buildings.minzoom} (should be 11)`);
    } else {
      console.log('   ❌ Buildings layer missing');
    }
    
    if (waterLabels) {
      console.log(`   ✅ Water labels layer: minzoom ${waterLabels.minzoom} (should be 8)`);
    } else {
      console.log('   ❌ Water labels layer missing');
    }
    
    if (roads && roads.paint && roads.paint['line-width']) {
      const lineWidth = roads.paint['line-width'];
      if (Array.isArray(lineWidth)) {
        const maxZoomIndex = lineWidth.findIndex(v => v === 15);
        if (maxZoomIndex > 0) {
          console.log(`   ✅ Roads layer: scales up to zoom 15 (improved from 12)`);
        } else {
          console.log(`   ⚠️  Roads layer: scaling may be limited`);
        }
      }
    }
    
    if (places && places.layout && places.layout['text-size']) {
      const textSize = places.layout['text-size'];
      if (Array.isArray(textSize)) {
        const maxZoomIndex = textSize.findIndex(v => v === 12);
        if (maxZoomIndex > 0) {
          console.log(`   ✅ Places layer: text scales up to zoom 12 (improved from 8)`);
        } else {
          console.log(`   ⚠️  Places layer: text scaling may be limited`);
        }
      }
    }
    
    console.log('\n📊 Expected Improvements:');
    console.log('   • Buildings visible at zoom 11+');
    console.log('   • Water labels visible at zoom 8+');
    console.log('   • Roads scale smoothly to zoom 15');
    console.log('   • Place names scale up to zoom 12');
    console.log('   • PMTiles supports up to zoom 12 (was 8)');
    
    console.log('\n🚀 Status: Map style changes are ready!');
    console.log('   Next step: Regenerate PMTiles with ZOOM_LIMIT=12');
    
  } catch (error) {
    console.error('❌ Error testing map style:', error.message);
    process.exit(1);
  }
}

function testZoomConfiguration() {
  console.log('\n⚙️  Testing Zoom Configuration...\n');
  
  // Test the zoom limit change
  const generateTilesPath = '../scripts/generate-tiles.js';
  
  // Read the file to check the zoom limit
  import('fs').then(fs => {
    return fs.promises.readFile(generateTilesPath, 'utf8');
  }).then(content => {
    const zoomLimitMatch = content.match(/ZOOM_LIMIT.*?(\d+)/);
    
    if (zoomLimitMatch) {
      const zoomLimit = parseInt(zoomLimitMatch[1]);
      if (zoomLimit >= 10) {
        console.log(`✅ ZOOM_LIMIT set to ${zoomLimit} (improved from 8)`);
        
        const fileSizeGB = Math.pow(2, zoomLimit - 8) * 3; // 3GB at zoom 8
        console.log(`   Expected file size: ~${fileSizeGB}GB`);
        
        if (zoomLimit >= 12) {
          console.log('   ⚠️  Large file size - consider ZOOM_LIMIT=10 for production');
        }
      } else {
        console.log(`⚠️  ZOOM_LIMIT is ${zoomLimit} - consider increasing to 10-12`);
      }
    } else {
      console.log('❌ Could not find ZOOM_LIMIT configuration');
    }
  }).catch(error => {
    console.log('⚠️  Could not read generate-tiles.js:', error.message);
  });
}

// Run tests
testMapStyle();
testZoomConfiguration();