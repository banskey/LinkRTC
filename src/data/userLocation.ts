// Cached user location for distance sorting. Best-effort: if permission is
// denied or unavailable, returns null and matching falls back to score order.
import * as Location from 'expo-location';

let cached: { lat: number; lon: number } | null = null;
let tried = false;

export async function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  if (cached) return cached;
  if (tried) return null; // don't re-prompt every call in one session
  tried = true;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    cached = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    return cached;
  } catch {
    return null;
  }
}
