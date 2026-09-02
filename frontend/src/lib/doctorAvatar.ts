// Gender-aware realistic human doctor portraits & hospital photography

const FEMALE_FIRST_NAMES = new Set([
  'sarah', 'emily', 'jessica', 'jennifer', 'lisa', 'maria', 'anna', 'sophia',
  'grace', 'elizabeth', 'rachel', 'emma', 'chloe', 'susan', 'olivia', 'laura',
  'karen', 'nancy', 'helen', 'diana', 'mary', 'julia', 'claire', 'alice', 'srey',
  'bopha', 'channary', 'davy', 'kalyan', 'neary', 'rathana', 'sophal', 'serey',
  'voleak', 'elena', 'sreynet', 'channa', 'sophea', 'chantha'
]);

// randomuser.me/api/portraits is a stable, permanent placeholder-headshot service
// (real human photos, numbered 0-99 per gender) - unlike hotlinking specific Unsplash
// photo IDs, these never go stale or get deleted by the original photographer.
function portraitUrl(gender: 'men' | 'women', index: number): string {
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
}

// Explicit real human portrait mapping for known seed doctors
const KNOWN_DOCTOR_PORTRAITS: Record<string, string> = {
  sovannara: portraitUrl('men', 32),
  elena: portraitUrl('women', 44),
  rithy: portraitUrl('men', 54),
  mary: portraitUrl('women', 65),
  sothea: portraitUrl('men', 76),
  bunroeun: portraitUrl('men', 15),
  voleak: portraitUrl('women', 21),
  lyheng: portraitUrl('men', 89),
  cheurn: portraitUrl('men', 89),
};

const FEMALE_PORTRAITS = [12, 23, 34, 56, 67].map((i) => portraitUrl('women', i));

const MALE_PORTRAITS = [12, 23, 34, 56, 67].map((i) => portraitUrl('men', i));

/**
 * Returns a high-resolution, gender-accurate portrait for a doctor.
 * Seed cartoon images from the backend (like `/uploads/doctor-images/*.png`) are replaced
 * with realistic human doctor photographs.
 */
export function getDoctorAvatarUrl(doctorName: string, doctorId?: number, uploadedImage?: string | null): string {
  // Always prefer a real uploaded photo - hardcoded stock portraits below are only a
  // fallback for doctors with no photo on file (external URLs can go stale/404 anytime).
  if (uploadedImage) {
    const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');
    if (uploadedImage.startsWith('http://') || uploadedImage.startsWith('https://')) return uploadedImage;
    return `${backendOrigin}${uploadedImage}`;
  }

  // Check known doctors by name match
  const cleanName = doctorName.toLowerCase().replace(/^(dr\.|doctor|prof\.|mr\.|ms\.|mrs\.)\s+/i, '').trim();
  const nameParts = cleanName.split(/\s+/);

  for (const part of nameParts) {
    if (KNOWN_DOCTOR_PORTRAITS[part]) {
      return KNOWN_DOCTOR_PORTRAITS[part];
    }
  }

  // Detect gender from name
  const firstName = nameParts[0] || '';
  const isFemale = FEMALE_FIRST_NAMES.has(firstName) || /^(ms\.|mrs\.)/i.test(doctorName);
  const idNum = doctorId ? Math.abs(doctorId) : Math.abs(hashCode(doctorName));

  if (isFemale) {
    return FEMALE_PORTRAITS[idNum % FEMALE_PORTRAITS.length];
  } else {
    return MALE_PORTRAITS[idNum % MALE_PORTRAITS.length];
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Curated modern hospital facility photography
export const HOSPITAL_IMAGES = {
  heroLobby: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
  consultationRoom: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
  diagnosticsLab: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
  medicalCareCenter: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
  doctorConsulting: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
};
