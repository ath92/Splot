// Custom MapLibre style for protomaps pmtiles, adapted from demotiles.maplibre.org style
export const createProtomapsStyle = (tileJsonUrl: string) => ({
  "version": 8,
  "name": "Splot Protomaps",
  "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  "sources": {
    "protomaps": {
      "url": tileJsonUrl,
      "type": "vector"
    }
  },
  "layers": [
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#D8F2FF"
      },
      "filter": [
        "all"
      ],
      "layout": {
        "visibility": "visible"
      },
      "maxzoom": 24
    },
    {
      "id": "water",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "water",
      "paint": {
        "fill-color": "#B3E5FC",
        "fill-opacity": 0.8
      },
      "filter": [
        "all"
      ],
      "layout": {
        "visibility": "visible"
      },
      "maxzoom": 24
    },
    {
      "id": "earth",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "earth",
      "paint": {
        "fill-color": "#E6E6E6"
      },
      "filter": [
        "all"
      ],
      "layout": {
        "visibility": "visible"
      },
      "maxzoom": 24
    },
    {
      "id": "landuse",
      "type": "fill",
      "source": "protomaps",
      "source-layer": "landuse",
      "paint": {
        "fill-color": "#F5F5DC",
        "fill-opacity": 0.7
      },
      "filter": [
        "all"
      ],
      "layout": {
        "visibility": "visible"
      },
      "maxzoom": 24
    },
    {
      "id": "boundaries",
      "type": "line",
      "source": "protomaps",
      "source-layer": "boundaries",
      "paint": {
        "line-color": "#DADADA",
        "line-width": {
          "stops": [
            [
              1,
              2
            ],
            [
              6,
              6
            ],
            [
              14,
              12
            ],
            [
              22,
              24
            ]
          ]
        }
      },
      "filter": [
        "all"
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "maxzoom": 24
    },
    {
      "id": "roads",
      "type": "line",
      "source": "protomaps",
      "source-layer": "roads",
      "paint": {
        "line-color": "#FFFFFF",
        "line-width": {
          "stops": [
            [
              6,
              1
            ],
            [
              10,
              2
            ],
            [
              14,
              4
            ],
            [
              18,
              8
            ]
          ]
        }
      },
      "filter": [
        "all"
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "minzoom": 6,
      "maxzoom": 24
    },
    {
      "id": "physical-lines",
      "type": "line",
      "source": "protomaps",
      "source-layer": "physical_line",
      "paint": {
        "line-color": "#C8D7EB",
        "line-width": {
          "stops": [
            [
              2,
              2
            ],
            [
              6,
              6
            ],
            [
              14,
              9
            ],
            [
              22,
              18
            ]
          ]
        }
      },
      "filter": [
        "all"
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round",
        "visibility": "visible"
      },
      "maxzoom": 24
    },
    {
      "id": "physical-lines-label",
      "type": "symbol",
      "source": "protomaps",
      "source-layer": "physical_line",
      "paint": {
        "text-color": "#546E88",
        "text-halo-blur": 1,
        "text-halo-color": "#E6F2FF",
        "text-halo-width": 2
      },
      "filter": [
        "all"
      ],
      "layout": {
        "symbol-placement": "line",
        "text-anchor": "center",
        "text-field": "{name}",
        "text-font": [
          "Roboto Condensed Italic"
        ],
        "text-size": {
          "stops": [
            [
              2,
              12
            ],
            [
              6,
              16
            ],
            [
              10,
              22
            ]
          ]
        },
        "visibility": "visible"
      },
      "maxzoom": 24
    },
    {
      "id": "places",
      "type": "symbol",
      "source": "protomaps",
      "source-layer": "places",
      "paint": {
        "text-color": "#334155",
        "text-halo-blur": 1,
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 2
      },
      "filter": [
        "all"
      ],
      "layout": {
        "text-anchor": "center",
        "text-field": "{name}",
        "text-font": [
          "Roboto Medium"
        ],
        "text-max-width": 10,
        "text-size": {
          "stops": [
            [
              2,
              10
            ],
            [
              4,
              12
            ],
            [
              6,
              14
            ],
            [
              8,
              18
            ]
          ]
        },
        "visibility": "visible"
      },
      "minzoom": 4,
      "maxzoom": 24
    },
    {
      "id": "pois",
      "type": "circle",
      "source": "protomaps",
      "source-layer": "pois",
      "paint": {
        "circle-radius": 4,
        "circle-color": "#FF6B6B",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#FFFFFF"
      },
      "filter": [
        "all"
      ],
      "layout": {
        "visibility": "visible"
      },
      "minzoom": 12,
      "maxzoom": 24
    }
  ]
});