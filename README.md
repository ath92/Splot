# Splot

A web app for displaying a set of pictures on a globe based on their geolocation metadata. The pictures will be retrieved from a bucket somewhere.

## Features

- **Full-screen 3D canvas** - Immersive experience that fills the entire viewport
- **Mobile-optimized controls** - Touch-friendly pan, zoom, and rotation controls
- **Responsive design** - Works seamlessly across mobile, tablet, and desktop devices
- **Geolocation-based rendering** - Pictures displayed on a globe according to their geolocation metadata

## Tech Stack

- **React** - Component-based UI framework
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **@react-three/drei** - Useful helpers for React Three Fiber

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

### Development

The development server will start at `http://localhost:5173`. The app features:

- **Pan**: Click and drag or use single finger touch
- **Zoom**: Mouse wheel or pinch gesture on mobile
- **Rotate**: Right-click drag or two-finger touch

### Mobile Controls

- **One finger**: Rotate the scene around the globe
- **Two fingers**: Pan (move) and zoom (pinch) the scene
- **Touch-optimized**: All interactions work smoothly on mobile devices

## Project Structure

```
src/
├── components/
│   └── Scene.tsx          # 3D scene with globe and pictures
├── App.tsx                # Main app component with Canvas and controls
├── main.tsx               # App entry point
└── index.css              # Single CSS file with all styles
```

## License

This project is private and not licensed for distribution.