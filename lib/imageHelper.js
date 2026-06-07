const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function getImageSrc(src) {
  if (!src) return `${BASE_PATH}/assets/image 1.png`;
  if (/^[a-zA-Z]:[/\\]/.test(src)) {
    // In production (GitHub Pages), the local-image API endpoint does not exist.
    // Return a fallback placeholder instead of a 404.
    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    if (isProd) {
      return `${BASE_PATH}/assets/image 1.png`;
    }
    return `/api/local-image?path=${encodeURIComponent(src)}`;
  }
  // Prefix local /assets/ paths with the GitHub Pages basePath
  if (src.startsWith('/assets/')) {
    return `${BASE_PATH}${src}`;
  }
  return src;
}

export function isExternalImage(src) {
  if (!src) return false;
  return (
    src.startsWith("http://") || 
    src.startsWith("https://") || 
    src.startsWith("/api/local-image") ||
    /^[a-zA-Z]:[/\\]/.test(src)
  );
}
