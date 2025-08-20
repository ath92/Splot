# PMTiles Zoom Fix Deployment Guide

## Issue Fixed
The map was limited to zoom level 8, providing insufficient detail when users zoomed in. Users could not see detailed features like roads, buildings, and place names at higher zoom levels.

## Changes Made

### 1. Code Changes (✅ Completed)
- **Increased ZOOM_LIMIT**: Changed from 8 to 12 in `scripts/generate-tiles.js`
- **Enhanced Map Style**: Updated `src/services/mapStyleService.ts`:
  - Extended road line width interpolation to zoom level 15
  - Extended place name text size interpolation to zoom level 12
  - Added buildings layer (visible at zoom 11+)
  - Added water labels layer (visible at zoom 8+)
- **Updated Documentation**: Revised file size estimates in `scripts/README.md`

### 2. PMTiles Regeneration Required (❌ Pending)

To complete the fix, the PMTiles file needs to be regenerated with the new zoom limit:

```bash
# Option 1: Use GitHub Actions workflow
# 1. Go to Actions tab in GitHub repository
# 2. Run "Generate and Upload Protomaps Tiles" workflow
# 3. The workflow will use the new ZOOM_LIMIT=12 default

# Option 2: Manual regeneration (if you have the tools)
cd scripts
npm install
# Download pmtiles CLI if not installed
node generate-tiles.js  # Uses ZOOM_LIMIT=12
node upload-tiles.js    # Uploads to R2
```

## Expected Results

### Before Fix (Current)
- Maximum useful zoom: Level 8
- File size: ~3GB
- Detail level: Country/region level only
- Roads barely visible
- No building details
- Limited place names

### After Fix (When PMTiles regenerated)
- Maximum useful zoom: Level 12
- File size: ~48GB (or set ZOOM_LIMIT=10 for ~12GB compromise)
- Detail level: Neighborhood/street level
- Clear road networks at high zoom
- Building outlines visible at zoom 11+
- Comprehensive place names and labels
- Smooth zooming experience

## File Size Considerations

| Zoom Level | Approx. File Size | Detail Level |
|------------|------------------|--------------|
| 8 (old)    | 3GB             | Country/Region |
| 10         | 12GB            | City/Town |
| 12 (new)   | 48GB            | Street/Building |

**Recommendation**: Start with ZOOM_LIMIT=10 for a good balance of detail and file size.

## Testing After Deployment

1. Open the map in a browser
2. Zoom in to a city or urban area
3. Continue zooming past level 8
4. Verify that:
   - Roads become more detailed and numerous
   - Building outlines appear (if zoom 11+ is available)
   - Place names and labels are crisp and readable
   - Zoom continues smoothly without degradation

## Network Issues (Current)

During testing, we encountered a CORS/network issue preventing tile loading from `https://splot-photo-worker.tomhutman.workers.dev`. This needs to be resolved either by:
1. Updating CORS headers on the worker
2. Configuring the worker URL correctly
3. Testing with the deployed version instead of localhost

The zoom limit fix is ready and will work once the PMTiles are regenerated and the network access is resolved.