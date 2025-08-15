import { useState, useEffect } from 'react';
import { r2Service } from '../services/r2Service';
import type { ImageData } from '../services/r2Service';

interface UseR2ImagesState {
  images: ImageData[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Custom hook for fetching images from R2 bucket
 */
export function useR2Images(): UseR2ImagesState {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedImages = await r2Service.fetchImages();
      setImages(fetchedImages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching images from R2:', err);
      
      // Fallback to sample data if R2 fetch fails
      const fallbackData = generateFallbackData();
      setImages(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    fetchImages();
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return { images, loading, error, retry };
}

/**
 * Generates fallback sample data when R2 fetch fails
 */
function generateFallbackData(): ImageData[] {
  const N = 15;
  return [...Array(N).keys()].map((i) => ({
    url: `https://picsum.photos/200/200?random=${i}`, // Placeholder images
    key: `fallback-image-${i}.jpg`,
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() / 3,
  }));
}