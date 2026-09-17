'use client';

import { useEffect, useState } from 'react';
import { getImageUrl } from '@/lib/imageUrl';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  fallback?: string;
}

// Falls back to the user's initial whenever the photo URL is missing or fails to
// load (e.g. a Google avatar blocked by a browser privacy extension), instead of
// leaving a broken-image icon in its place.
export default function Avatar({ src, name, fallback = 'U' }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = getImageUrl(src);

  useEffect(() => {
    setErrored(false);
  }, [resolvedSrc]);

  if (resolvedSrc && !errored) {
    return (
      <img
        src={resolvedSrc}
        alt={name || 'User'}
        className="w-full h-full object-cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return <>{name ? name.charAt(0).toUpperCase() : fallback}</>;
}
