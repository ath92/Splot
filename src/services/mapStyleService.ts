// Custom MapLibre style for protomaps pmtiles
export const createProtomapsStyle = (tileJsonUrl: string) => ({
  "version": 8 as const,
  "name": "Splot Protomaps",
  "glyphs": "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  "sources": {
    "protomaps": {
      "type": "vector" as const,
      "url": tileJsonUrl,
      "attribution": "© OpenStreetMap contributors, © Protomaps"
    }
  },
  "layers": [
    {
      "id": "background",
      "type": "background" as const,
      "paint": {
        "background-color": "#0f172a"
      }
    },
    // Earth/land base layer - ensure this renders everywhere
    {
      "id": "earth",
      "type": "fill" as const,
      "source": "protomaps",
      "source-layer": "earth",
      "paint": {
        "fill-color": "#1e293b",
        "fill-opacity": 1
      }
    },
    // Water layer
    {
      "id": "water",
      "type": "fill" as const,
      "source": "protomaps",
      "source-layer": "water",
      "paint": {
        "fill-color": "#1e40af",
        "fill-opacity": 0.9
      }
    },
    // Landuse with better filtering
    {
      "id": "landuse",
      "type": "fill" as const,
      "source": "protomaps",
      "source-layer": "landuse",
      "minzoom": 4,
      "filter": ["has", "pmap:kind"],
      "paint": {
        "fill-color": [
          "case",
          ["==", ["get", "pmap:kind"], "park"], "#065f46",
          ["==", ["get", "pmap:kind"], "forest"], "#064e3b",
          ["==", ["get", "pmap:kind"], "residential"], "#1f2937",
          ["==", ["get", "pmap:kind"], "commercial"], "#374151",
          "#1e293b"
        ],
        "fill-opacity": 0.7
      }
    },
    // Natural features
    {
      "id": "natural",
      "type": "fill" as const,
      "source": "protomaps",
      "source-layer": "natural",
      "minzoom": 4,
      "filter": ["has", "pmap:kind"],
      "paint": {
        "fill-color": [
          "case",
          ["==", ["get", "pmap:kind"], "forest"], "#064e3b",
          ["==", ["get", "pmap:kind"], "wood"], "#064e3b",
          ["==", ["get", "pmap:kind"], "grass"], "#166534",
          "#374151"
        ],
        "fill-opacity": 0.6
      }
    },
    // Country boundaries with proper filtering
    {
      "id": "boundaries-countries",
      "type": "line" as const,
      "source": "protomaps",
      "source-layer": "boundaries",
      "filter": ["all",
        ["has", "pmap:min_admin_level"],
        ["<=", ["get", "pmap:min_admin_level"], 2]
      ],
      "paint": {
        "line-color": "#64748b",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          0, 0.5,
          4, 1,
          8, 2
        ],
        "line-opacity": 0.8
      }
    },
    // State/province boundaries
    {
      "id": "boundaries-states",
      "type": "line" as const,
      "source": "protomaps",
      "source-layer": "boundaries",
      "minzoom": 4,
      "filter": ["all",
        ["has", "pmap:min_admin_level"],
        [">", ["get", "pmap:min_admin_level"], 2],
        ["<=", ["get", "pmap:min_admin_level"], 4]
      ],
      "paint": {
        "line-color": "#475569",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          4, 0.5,
          8, 1
        ],
        "line-opacity": 0.5
      }
    },
    // Physical lines (coastlines, rivers)
    {
      "id": "physical-line",
      "type": "line" as const,
      "source": "protomaps",
      "source-layer": "physical_line",
      "minzoom": 6,
      "filter": ["==", ["get", "pmap:kind"], "river"],
      "paint": {
        "line-color": "#2563eb",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          6, 0.5,
          10, 1.5,
          14, 3
        ],
        "line-opacity": 0.8
      }
    },
    // Major roads
    {
      "id": "roads-major",
      "type": "line" as const,
      "source": "protomaps",
      "source-layer": "roads",
      "minzoom": 5,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["highway", "trunk", "primary", "motorway"]]
      ],
      "paint": {
        "line-color": "#94a3b8",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          5, 0.5,
          10, 2,
          15, 6
        ],
        "line-opacity": 0.8
      }
    },
    // Minor roads
    {
      "id": "roads-minor",
      "type": "line" as const,
      "source": "protomaps",
      "source-layer": "roads",
      "minzoom": 8,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["secondary", "tertiary", "residential", "unclassified"]]
      ],
      "paint": {
        "line-color": "#64748b",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          8, 0.5,
          12, 1.5,
          16, 3
        ],
        "line-opacity": 0.6
      }
    },
    // Country labels
    {
      "id": "places-countries",
      "type": "symbol" as const,
      "source": "protomaps",
      "source-layer": "places",
      "maxzoom": 6,
      "filter": ["==", ["get", "pmap:kind"], "country"],
      "layout": {
        "text-field": ["get", "name"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          2, 10,
          6, 14
        ],
        "text-anchor": "center",
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1
      },
      "paint": {
        "text-color": "#f1f5f9",
        "text-halo-color": "#0f172a",
        "text-halo-width": 2
      }
    },
    // City labels
    {
      "id": "places-cities",
      "type": "symbol" as const,
      "source": "protomaps",
      "source-layer": "places",
      "minzoom": 4,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["city", "town", "village"]]
      ],
      "layout": {
        "text-field": ["get", "name"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          4, 10,
          8, 12,
          12, 16
        ],
        "text-anchor": "center"
      },
      "paint": {
        "text-color": "#e2e8f0",
        "text-halo-color": "#1e293b",
        "text-halo-width": 1.5
      }
    },
    // Neighborhood labels
    {
      "id": "places-neighborhoods",
      "type": "symbol" as const,
      "source": "protomaps",
      "source-layer": "places",
      "minzoom": 10,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["neighbourhood", "suburb", "hamlet"]]
      ],
      "layout": {
        "text-field": ["get", "name"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          10, 9,
          14, 11
        ],
        "text-anchor": "center"
      },
      "paint": {
        "text-color": "#cbd5e1",
        "text-halo-color": "#1e293b",
        "text-halo-width": 1
      }
    }
  ]
});