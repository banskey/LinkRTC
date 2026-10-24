// OFFLINE auth api — no server. Any credentials "succeed" so the real login
// screen works and lands the user in the app, exactly as if they had an account.
export async function register(_data: any) {
  return { access_token: 'offline', refresh_token: 'offline' };
}

export async function login(_data: { email?: string; phone?: string; password: string }) {
  return { access_token: 'offline', refresh_token: 'offline' };
}

export async function getMe() {
  return { id: 'offline-user', email: 'demo@trialmatcher.app', age: null };
}
