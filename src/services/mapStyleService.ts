// Protomaps Light Flavor Style - based on Protomaps basemap light design
export const createProtomapsLightStyle = (tileJsonUrl: string) => ({
  "version": 8,
  "name": "Splot Protomaps Light",
  "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  "sources": {
    "protomaps": {
      "type": "vector",
      "url": tileJsonUrl,
      "attribution": "© OpenStreetMap contributors, © Protomaps"
    }
  },
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#f8f8f8"
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "water",
      "paint": {
        "fill-color": "#74b3ff",
        "fill-opacity": 0.7
      }
    },
    {
      "id": "land",
      "type": "fill",
      "source": "protomaps", 
      "source-layer": "earth",
      "paint": {
        "fill-color": "#ffffff",
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
        "line-color": "#a0a0a0",
        "line-width": 1,
        "line-opacity": 0.5
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
        "line-color": "#c0c0c0",
        "line-width": 0.5,
        "line-opacity": 0.3
      }
    },
    {
      "id": "roads",
      "type": "line",
      "source": "protomaps",
      "source-layer": "roads",
      "minzoom": 6,
      "paint": {
        "line-color": "#888888",
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
        "text-color": "#333333",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5
      }
    }
  ]
});