# Splot

A web app for displaying a set of pictures on an interactive map based on their geolocation metadata. The pictures will be retrieved from a bucket somewhere.

## Features

- **Full-screen map canvas** - Immersive experience that fills the entire viewport
- **Mobile-optimized controls** - Touch-friendly pan, zoom, and rotation controls
- **Responsive design** - Works seamlessly across mobile, tablet, and desktop devices
- **Geolocation-based rendering** - Pictures displayed on a map according to their geolocation metadata
- **Worker API integration** - Fetches real photo data from Cloudflare Worker with GPS metadata
- **Flight path visualization** - Interactive flight routes displayed as arcs on the map

## Tech Stack

- **React** - Component-based UI framework
- **MapLibre GL JS** - Open-source mapping library for interactive maps
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Configuration

The app uses the production Cloudflare Worker endpoint by default (`https://splot-photo-worker.tomhutman.workers.dev`). 

You can optionally override this by setting the `VITE_WORKER_URL` environment variable if you have your own worker deployment.

### Development

The development server will start at `http://localhost:5173`. The app features:

- **Pan**: Click and drag or use single finger touch
- **Zoom**: Mouse wheel or pinch gesture on mobile
- **Rotate**: Right-click drag or two-finger touch
- **Photo markers**: Click on colored circles to view photo details
- **Flight paths**: Interactive flight routes displayed as colored lines

### Mobile Controls

- **One finger**: Pan (move) the map
- **Two fingers**: Zoom (pinch) and rotate the map
- **Touch-optimized**: All interactions work smoothly on mobile devices

## Project Structure

```
src/
├── components/
│   ├── MapLibreScene.tsx      # Interactive map with photos and flight paths
│   └── PhotoOverlay.tsx       # Photo detail modal overlay
├── services/
│   ├── photoService.ts        # Photo data fetching and transformation
│   └── flightsService.ts      # Flight data and route processing
├── data/
│   └── flights.json           # Flight routes and airport data
├── App.tsx                    # Main app component with map container
├── main.tsx                   # App entry point
└── index.css                  # Single CSS file with all styles
```

## License

This project is private and not licensed for distribution.