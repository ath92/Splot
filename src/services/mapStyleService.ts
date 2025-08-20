// Custom MapLibre style for protomaps pmtiles
export const createProtomapsStyle = (tileJsonUrl: string) => ({
  "version": 8,
  "name": "Splot Protomaps",
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
        "background-color": "#0f172a"
      }
    },
    {
      "id": "earth",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "earth",
      "paint": {
        "fill-color": "#1e293b",
        "fill-opacity": 1
      }
    },
    {
      "id": "landuse",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "landuse",
      "minzoom": 2,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["park", "cemetery", "hospital", "university", "school"]]
      ],
      "paint": {
        "fill-color": [
          "case",
          ["==", ["get", "pmap:kind"], "park"], "#065f46",
          ["==", ["get", "pmap:kind"], "cemetery"], "#374151",
          "#1f2937"
        ],
        "fill-opacity": 0.6
      }
    },
    {
      "id": "natural",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "natural",
      "minzoom": 2,
      "paint": {
        "fill-color": [
          "case",
          ["==", ["get", "pmap:kind"], "forest"], "#064e3b",
          ["==", ["get", "pmap:kind"], "wood"], "#064e3b",
          ["==", ["get", "pmap:kind"], "grass"], "#166534",
          "#374151"
        ],
        "fill-opacity": 0.7
      }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "water",
      "paint": {
        "fill-color": "#1e40af",
        "fill-opacity": 0.9
      }
    },
    {
      "id": "boundaries-countries",
      "type": "line",
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
        "line-opacity": 0.7
      }
    },
    {
      "id": "boundaries-states",
      "type": "line",
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
    {
      "id": "physical-line",
      "type": "line",
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
    {
      "id": "roads-major",
      "type": "line",
      "source": "protomaps",
      "source-layer": "roads",
      "minzoom": 5,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["highway", "trunk", "primary"]]
      ],
      "paint": {
        "line-color": "#94a3b8",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          5, 1,
          10, 3,
          15, 8
        ],
        "line-opacity": 0.8
      }
    },
    {
      "id": "roads-minor",
      "type": "line",
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
          12, 2,
          16, 4
        ],
        "line-opacity": 0.6
      }
    },
    {
      "id": "places-countries",
      "type": "symbol",
      "source": "protomaps",
      "source-layer": "places",
      "maxzoom": 6,
      "filter": ["==", ["get", "pmap:kind"], "country"],
      "layout": {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          2, 10,
          6, 16
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
    {
      "id": "places-cities",
      "type": "symbol",
      "source": "protomaps",
      "source-layer": "places",
      "minzoom": 4,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["city", "town"]]
      ],
      "layout": {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          4, 10,
          8, 14,
          12, 18
        ],
        "text-anchor": "center"
      },
      "paint": {
        "text-color": "#e2e8f0",
        "text-halo-color": "#1e293b",
        "text-halo-width": 1.5
      }
    },
    {
      "id": "places-neighborhoods",
      "type": "symbol",
      "source": "protomaps",
      "source-layer": "places",
      "minzoom": 10,
      "filter": [
        "in",
        ["get", "pmap:kind"],
        ["literal", ["neighbourhood", "suburb", "village", "hamlet"]]
      ],
      "layout": {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          10, 10,
          14, 12
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