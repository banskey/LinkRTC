import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'cached_matches';

export async function saveMatchesToCache(matches: any[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(matches));
  } catch (e) {
    console.warn('Failed to cache matches:', e);
  }
}

export async function loadMatchesFromCache(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
