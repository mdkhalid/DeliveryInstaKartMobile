import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'instakart_access_token',
  REFRESH_TOKEN: 'instakart_refresh_token',
  USER_ID: 'instakart_user_id',
} as const;

// ─── Token Management ───
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.USER_ID),
  ]);
}

// ─── User ID ───
export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.USER_ID);
}

export async function setUserId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.USER_ID, id);
}


