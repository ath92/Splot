import type { StyleSpecification } from 'maplibre-gl'

// Protomaps PMTiles style configuration for MapLibre GL JS
export const protomapsStyle = {
  version: 8,
  glyphs: 'https://api.protomaps.com/fonts/{fontstack}/{range}.pbf',
  sources: {
    protomaps: {
      type: 'vector',
      url: 'pmtiles://https://api.protomaps.com/tiles/v3.pmtiles',
      attribution: '© <a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f8f4f0'
      }
    },
    {
      id: 'earth',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'earth',
      paint: {
        'fill-color': '#f8f4f0'
      }
    },
    {
      id: 'water',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'water',
      paint: {
        'fill-color': '#80deea'
      }
    },
    {
      id: 'landuse_park',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'landuse',
      filter: ['==', 'pmap:kind', 'park'],
      paint: {
        'fill-color': '#d8e8c8'
      }
    },
    {
      id: 'natural_wood',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'natural',
      filter: ['==', 'pmap:kind', 'wood'],
      paint: {
        'fill-color': '#d0e8c8'
      }
    },
    {
      id: 'roads_highway',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'pmap:kind', 'highway'],
      paint: {
        'line-color': '#FC8',
        'line-width': 2
      }
    },
    {
      id: 'roads_major',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads', 
      filter: ['==', 'pmap:kind', 'major_road'],
      paint: {
        'line-color': '#fea',
        'line-width': 1.5
      }
    },
    {
      id: 'roads_medium',
      type: 'line',
      source: 'protomaps',
      'source-layer': 'roads',
      filter: ['==', 'pmap:kind', 'medium_road'],
      paint: {
        'line-color': '#fff',
        'line-width': 1
      }
    },
    {
      id: 'buildings',
      type: 'fill',
      source: 'protomaps',
      'source-layer': 'buildings',
      paint: {
        'fill-color': '#cccccc'
      },
      minzoom: 14
    },
    {
      id: 'places_city',
      type: 'symbol',
      source: 'protomaps',
      'source-layer': 'places',
      filter: ['==', 'pmap:kind', 'city'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Open Sans Regular'],
        'text-size': 16
      },
      paint: {
        'text-color': '#333',
        'text-halo-color': '#fff',
        'text-halo-width': 1
      }
    }
  ]
} as StyleSpecification