/**
 * PMTiles service for direct PMTiles file loading
 * Based on protomaps.com example approach
 */
import { Protocol } from 'pmtiles';
import maplibregl from 'maplibre-gl';

let protocolInitialized = false;

/**
 * Setup PMTiles protocol for direct file access
 * This mirrors the approach used by maps.protomaps.com
 */
export function setupPMTilesProtocol(): void {
  if (protocolInitialized) {
    return;
  }
  
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  protocolInitialized = true;
  console.log('PMTiles protocol registered');
}

/**
 * Create MapLibre style that uses direct PMTiles source
 * This is similar to how protomaps.com examples work
 */
export function createDirectPMTilesStyle(pmtilesFileUrl: string) {
  // Clean up the URL for pmtiles protocol - remove https:// prefix
  const cleanUrl = pmtilesFileUrl.replace(/^https?:\/\//, '');
  const pmtilesProtocolUrl = `pmtiles://${cleanUrl}`;
  
  console.log('Creating direct PMTiles style with URL:', pmtilesProtocolUrl);
  
  return {
    "version": 8,
    "name": "Direct PMTiles Style",
    "glyphs": "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
    "sources": {
      "protomaps": {
        "type": "vector",
        "url": pmtilesProtocolUrl,
        "attribution": "© OpenStreetMap contributors, © Protomaps"
      }
    },
    "layers": [
      {
        "id": "background",
        "type": "background",
        "paint": {
          "background-color": "#f8f4f0"
        }
      },
      {
        "id": "earth",
        "type": "fill",
        "source": "protomaps",
        "source-layer": "earth",
        "paint": {
          "fill-color": "#f8f4f0"
        }
      },
      {
        "id": "natural_wood",
        "type": "fill",
        "source": "protomaps",
        "source-layer": "natural",
        "filter": ["==", "natural", "wood"],
        "paint": {
          "fill-color": "#d0e8c8",
          "fill-opacity": 0.6
        }
      },
      {
        "id": "landuse_park",
        "type": "fill",
        "source": "protomaps",
        "source-layer": "landuse",
        "filter": ["in", "landuse", "park", "recreation_ground", "golf_course"],
        "paint": {
          "fill-color": "#d0e8c8",
          "fill-opacity": 0.8
        }
      },
      {
        "id": "landuse_residential",
        "type": "fill",
        "source": "protomaps",
        "source-layer": "landuse",
        "filter": ["==", "landuse", "residential"],
        "paint": {
          "fill-color": "#f0f0f0",
          "fill-opacity": 0.8
        }
      },
      {
        "id": "water",
        "type": "fill",
        "source": "protomaps",
        "source-layer": "water",
        "paint": {
          "fill-color": "#80deea"
        }
      },
      {
        "id": "admin_1_boundary",
        "type": "line",
        "source": "protomaps",
        "source-layer": "boundaries",
        "filter": ["==", "admin_level", 4],
        "paint": {
          "line-color": "#9e9cab",
          "line-width": 1,
          "line-dasharray": [3, 2]
        }
      },
      {
        "id": "admin_0_boundary",
        "type": "line",
        "source": "protomaps",
        "source-layer": "boundaries",
        "filter": ["==", "admin_level", 2],
        "paint": {
          "line-color": "#9e9cab",
          "line-width": 2
        }
      },
      {
        "id": "roads_other",
        "type": "line",
        "source": "protomaps",
        "source-layer": "roads",
        "filter": ["in", "pmap:kind", "other", "path"],
        "paint": {
          "line-color": "#e8e4e0",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9, 0,
            12, 1,
            15, 3
          ]
        }
      },
      {
        "id": "roads_minor",
        "type": "line",
        "source": "protomaps",
        "source-layer": "roads",
        "filter": ["==", "pmap:kind", "minor_road"],
        "paint": {
          "line-color": "#e8e4e0",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9, 0,
            12, 2,
            15, 6
          ]
        }
      },
      {
        "id": "roads_major",
        "type": "line",
        "source": "protomaps",
        "source-layer": "roads",
        "filter": ["in", "pmap:kind", "major_road"],
        "paint": {
          "line-color": "#e8e4e0",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6, 0,
            12, 3,
            15, 8
          ]
        }
      },
      {
        "id": "roads_highway",
        "type": "line",
        "source": "protomaps",
        "source-layer": "roads",
        "filter": ["==", "pmap:kind", "highway"],
        "paint": {
          "line-color": "#e8e4e0",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6, 1,
            12, 4,
            15, 10
          ]
        }
      },
      {
        "id": "places_subplace",
        "type": "symbol",
        "source": "protomaps",
        "source-layer": "places",
        "filter": ["==", "pmap:kind", "neighbourhood"],
        "layout": {
          "text-field": "{name}",
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 8,
            16, 16
          ],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.1,
          "text-max-width": 7
        },
        "paint": {
          "text-color": "#8C92AC",
          "text-halo-color": "#F8F4F0",
          "text-halo-width": 1
        }
      },
      {
        "id": "places_city_circle",
        "type": "circle",
        "source": "protomaps",
        "source-layer": "places",
        "filter": ["==", "pmap:kind", "city"],
        "maxzoom": 8,
        "paint": {
          "circle-radius": 2,
          "circle-color": "#000",
          "circle-opacity": 0.8
        }
      },
      {
        "id": "places_city",
        "type": "symbol",
        "source": "protomaps",
        "source-layer": "places",
        "filter": ["==", "pmap:kind", "city"],
        "layout": {
          "text-field": "{name}",
          "text-font": ["Noto Sans Medium"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4, 10,
            16, 20
          ],
          "text-max-width": 10,
          "text-offset": [0, 0.5],
          "text-anchor": "top"
        },
        "paint": {
          "text-color": "#2E3338",
          "text-halo-color": "#F8F4F0",
          "text-halo-width": 1
        }
      }
    ]
  };
}