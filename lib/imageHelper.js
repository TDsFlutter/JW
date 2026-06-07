export function getImageSrc(src) {
  if (!src) return "/assets/image 1.png";
  if (/^[a-zA-Z]:[/\\]/.test(src)) {
    return `/api/local-image?path=${encodeURIComponent(src)}`;
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
