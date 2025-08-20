// Custom MapLibre style for protomaps pmtiles
export const createProtomapsStyle = (sourceUrl: string, usePMTilesProtocol = false) => {
  // Create source configuration based on protocol type
  const protomapsSource = usePMTilesProtocol 
    ? {
        "type": "vector" as const,
        "url": sourceUrl, // PMTiles protocol URL
        "attribution": "© OpenStreetMap contributors, © Protomaps"
      }
    : {
        "type": "vector" as const,
        "url": sourceUrl, // TileJSON URL
        "attribution": "© OpenStreetMap contributors, © Protomaps"
      }

  return {
    "version": 8,
    "name": "Splot Protomaps",
    "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    "sources": {
      "protomaps": protomapsSource
    },
    "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#121212"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "water",
      "paint": {
        "fill-color": "#1e3a8a",
        "fill-opacity": 0.8
      }
    },
    {
      "id": "land",
      "type": "fill",
      "source": "protomaps", 
      "source-layer": "earth",
      "paint": {
        "fill-color": "#2d2d2d",
        "fill-opacity": 1
      }
    },
    {
      "id": "countries",
      "type": "line",
      "source": "protomaps",
      "source-layer": "boundaries",
      "filter": ["==", "admin_level", 2],
      "paint": {
        "line-color": "#4a5568",
        "line-width": 1,
        "line-opacity": 0.6
      }
    },
    {
      "id": "states",
      "type": "line", 
      "source": "protomaps",
      "source-layer": "boundaries",
      "filter": ["==", "admin_level", 4],
      "minzoom": 4,
      "paint": {
        "line-color": "#4a5568",
        "line-width": 0.5,
        "line-opacity": 0.4
      }
    },
    {
      "id": "roads",
      "type": "line",
      "source": "protomaps",
      "source-layer": "roads",
      "minzoom": 6,
      "paint": {
        "line-color": "#718096",
        "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 12, 2]
      }
    },
    {
      "id": "places",
      "type": "symbol",
      "source": "protomaps",
      "source-layer": "places",
      "minzoom": 4,
      "layout": {
        "text-field": "{name}",
        "text-font": ["sans-serif"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4, 10, 8, 14],
        "text-anchor": "center"
      },
      "paint": {
        "text-color": "#e2e8f0",
        "text-halo-color": "#1a202c",
        "text-halo-width": 1
      }
    }
  ]
  }
};