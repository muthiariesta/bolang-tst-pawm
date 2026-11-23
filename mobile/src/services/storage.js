// Penyimpanan kecil yang aman di perangkat (token JWT, data user, status onboarding).
// expo-secure-store tidak tersedia di web, jadi ada cadangan localStorage / memori.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memory = {};
const useWebStorage = Platform.OS === 'web';

export async function getItem(key) {
  try {
    if (useWebStorage) return globalThis.localStorage?.getItem(key) ?? memory[key] ?? null;
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return memory[key] ?? null;
  }
}

export async function setItem(key, value) {
  try {
    if (useWebStorage) {
      memory[key] = value;
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    memory[key] = value;
  }
}

export async function removeItem(key) {
  try {
    delete memory[key];
    if (useWebStorage) {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    // abaikan
  }
}

export const KEYS = {
  token: 'bolang.token',
  user: 'bolang.user',
  onboarded: 'bolang.onboarded',
};
