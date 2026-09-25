// Uploaded photos are stored as relative paths like "/uploads/profile-images/xxx.jpg";
// this resolves them against the backend's origin (not the frontend's) so <img> can load them.
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/(api|mundulcare)\/?$/, '');

export function getImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_ORIGIN}${path}`;
}
