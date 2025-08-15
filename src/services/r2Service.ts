/**
 * Service for retrieving images from Cloudflare R2 bucket
 */

export interface ImageData {
  url: string;
  key: string;
  lat?: number;
  lng?: number;
  size?: number;
  lastModified?: Date;
}

export interface R2ListResponse {
  Contents?: Array<{
    Key: string;
    LastModified: string;
    Size: number;
    ETag: string;
  }>;
  IsTruncated?: boolean;
  Marker?: string;
  MaxKeys?: number;
}

export class R2Service {
  private bucketUrl: string;

  constructor(bucketUrl: string) {
    this.bucketUrl = bucketUrl;
  }

  /**
   * Validates if the provided URL is a valid HTTP(S) URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Checks if a file is likely an image based on its extension
   */
  private isImageFile(key: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const extension = key.toLowerCase().substring(key.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  /**
   * Extracts geolocation data from image metadata or filename
   * This is a placeholder - in a real implementation you might:
   * - Parse EXIF data from the image
   * - Parse coordinates from filename patterns
   * - Use a separate metadata service
   */
  private extractGeoLocation(key: string): { lat?: number; lng?: number } {
    // Example: look for patterns like "lat_40.7128_lng_-74.0060_image.jpg"
    const latMatch = key.match(/lat_(-?\d+\.?\d*)/i);
    const lngMatch = key.match(/lng_(-?\d+\.?\d*)/i);
    
    if (latMatch && lngMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1])
      };
    }

    // Fallback to random coordinates for demo purposes
    return {
      lat: (Math.random() - 0.5) * 180,
      lng: (Math.random() - 0.5) * 360
    };
  }

  /**
   * Fetches the list of images from the R2 bucket
   */
  async fetchImages(): Promise<ImageData[]> {
    if (!this.isValidUrl(this.bucketUrl)) {
      throw new Error('Invalid bucket URL provided');
    }

    try {
      // Try different approaches for listing objects
      const responses = await Promise.allSettled([
        // Approach 1: Try S3 XML API
        fetch(`${this.bucketUrl}?list-type=2`, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml, text/xml, */*'
          }
        }),
        // Approach 2: Try direct fetch to see if it returns a listing
        fetch(this.bucketUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html, application/xml, text/xml, */*'
          }
        })
      ]);

      let response: Response | null = null;
      let responseText = '';

      // Find the first successful response
      for (const result of responses) {
        if (result.status === 'fulfilled' && result.value.ok) {
          response = result.value;
          responseText = await response.text();
          break;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch from bucket: ${response?.status} ${response?.statusText}`);
      }

      return this.parseResponse(responseText);

    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the R2 bucket. Please check your internet connection.');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while fetching images from R2 bucket');
    }
  }

  /**
   * Parses the response from R2 bucket to extract image information
   * Made public for testing purposes
   */
  parseResponse(responseText: string): ImageData[] {
    const images: ImageData[] = [];

    try {
      // Try to parse as XML (S3 ListBucket response)
      if (responseText.includes('<?xml') || responseText.includes('<ListBucketResult')) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(responseText, 'text/xml');
        
        const contents = xmlDoc.getElementsByTagName('Contents');
        for (let i = 0; i < contents.length; i++) {
          const item = contents[i];
          const key = item.getElementsByTagName('Key')[0]?.textContent;
          const lastModified = item.getElementsByTagName('LastModified')[0]?.textContent;
          const size = item.getElementsByTagName('Size')[0]?.textContent;

          if (key && this.isImageFile(key)) {
            const geoLocation = this.extractGeoLocation(key);
            images.push({
              url: `${this.bucketUrl}/${key}`,
              key,
              lat: geoLocation.lat,
              lng: geoLocation.lng,
              size: size ? parseInt(size) / 1024 / 100 : Math.random() / 3, // Convert to relative size for globe
              lastModified: lastModified ? new Date(lastModified) : undefined
            });
          }
        }
      } else {
        // Try to parse as HTML directory listing
        const imageUrlRegex = /<a[^>]+href=["']([^"']*\.(jpg|jpeg|png|gif|webp|bmp|svg))["'][^>]*>/gi;
        let match;
        
        while ((match = imageUrlRegex.exec(responseText)) !== null) {
          const fileName = match[1];
          if (this.isImageFile(fileName)) {
            const geoLocation = this.extractGeoLocation(fileName);
            images.push({
              url: `${this.bucketUrl}/${fileName}`,
              key: fileName,
              lat: geoLocation.lat,
              lng: geoLocation.lng,
              size: Math.random() / 3
            });
          }
        }
      }

      // If no images found, return empty array rather than error
      return images;

    } catch (parseError) {
      console.warn('Failed to parse bucket response:', parseError);
      // Return empty array if parsing fails - don't crash the app
      return [];
    }
  }

  /**
   * Fetches a specific image and validates it's actually an image
   */
  async validateImage(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return false;
      }

      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') ?? false;
      
    } catch {
      return false;
    }
  }
}

// Create a default instance with the provided bucket URL
export const r2Service = new R2Service('https://pub-c6544b31bd77476ea971c3c8a00dd8eb.r2.dev');