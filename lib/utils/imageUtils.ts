// Utility functions to help reduce image transformations

// Standard sizes to use consistently across the app
export const IMAGE_SIZES = {
  THUMBNAIL: '128px',
  SMALL: '256px', 
  MEDIUM: '384px',
  LARGE: '640px',
  XLARGE: '1080px',
  FULL: '100vw'
} as const;

// Standard responsive sizes for different use cases
export const RESPONSIVE_SIZES = {
  EVENT_THUMBNAIL: '128px',
  EVENT_CARD: '(max-width: 768px) 100vw, 384px',
  EVENT_DETAIL: '(max-width: 768px) 100vw, 640px',
  BOTTLE_PREVIEW: '256px',
  AVATAR: '128px',
  LOGO: '(max-width: 768px) 200px, 300px'
} as const;

// Clean Firebase Storage URLs to remove auth tokens and make them consistent
export function cleanFirebaseUrl(url: string): string {
  if (!url.includes('firebasestorage.googleapis.com') && !url.includes('storage.googleapis.com')) {
    return url;
  }
  
  // Remove auth tokens and parameters to create consistent URLs
  const cleanUrl = url.split('?')[0];
  return cleanUrl;
}

// Get optimized image props for consistent usage
export function getOptimizedImageProps(src: string, alt: string, size: keyof typeof RESPONSIVE_SIZES) {
  return {
    src: cleanFirebaseUrl(src),
    alt,
    sizes: RESPONSIVE_SIZES[size],
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEggJ4YA0XfwAAAABJRU5ErkJggg==',
    loading: 'lazy' as const
  };
} 