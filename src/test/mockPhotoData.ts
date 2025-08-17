// Test file to validate photo overlay functionality with mock data
import { type Photo, type PhotosResponse } from '../services/photoService'

// Create mock photo data for testing
export const mockPhotos: Photo[] = [
  {
    filename: 'test-photo-1.jpg',
    url: 'https://picsum.photos/800/600?random=1',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 10
    },
    uploadedAt: '2024-01-01T12:00:00Z',
    fileSize: 1024000,
    originalName: 'New York City.jpg',
    cameraMake: 'Canon',
    cameraModel: 'EOS R5',
    dateTime: '2024-01-01T12:00:00Z'
  },
  {
    filename: 'test-photo-2.jpg',
    url: 'https://picsum.photos/800/600?random=2',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      altitude: 71
    },
    uploadedAt: '2024-01-02T12:00:00Z',
    fileSize: 2048000,
    originalName: 'Los Angeles.jpg',
    cameraMake: 'Sony',
    cameraModel: 'A7R IV',
    dateTime: '2024-01-02T12:00:00Z'
  },
  {
    filename: 'test-photo-3.jpg',
    url: 'https://picsum.photos/800/600?random=3',
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      altitude: 11
    },
    uploadedAt: '2024-01-03T12:00:00Z',
    fileSize: 1536000,
    originalName: 'London.jpg',
    cameraMake: 'Nikon',
    cameraModel: 'D850',
    dateTime: '2024-01-03T12:00:00Z'
  },
  {
    filename: 'test-photo-4.jpg',
    url: 'https://picsum.photos/800/600?random=4',
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      altitude: 40
    },
    uploadedAt: '2024-01-04T12:00:00Z',
    fileSize: 1800000,
    originalName: 'Tokyo.jpg',
    cameraMake: 'Fujifilm',
    cameraModel: 'X-T4',
    dateTime: '2024-01-04T12:00:00Z'
  }
]

export const mockPhotosResponse: PhotosResponse = {
  photos: mockPhotos,
  count: mockPhotos.length
}