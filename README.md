# Splot

A 3D playground web app built with React and React Three Fiber, designed primarily for mobile use.

## Features

- **Full-screen 3D canvas** - Immersive experience that fills the entire viewport
- **Mobile-optimized controls** - Touch-friendly pan, zoom, and rotation controls
- **Responsive design** - Works seamlessly across mobile, tablet, and desktop devices
- **Simple 3D rendering** - Displays a rotating globe using three-globe and meshBasicMaterial (no lights required)
- **TypeScript support** - Full type safety throughout the application

## Tech Stack

- **React** - Component-based UI framework
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **@react-three/drei** - Useful helpers for React Three Fiber
- **three-globe** - 3D globe library for Three.js

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
│   └── Scene.tsx          # 3D scene with rotating globe
├── App.tsx                # Main app component with Canvas and controls
├── main.tsx               # App entry point
└── index.css              # Single CSS file with all styles
```

## License

This project is private and not licensed for distribution.
