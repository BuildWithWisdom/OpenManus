const HONO_API_URL = import.meta.env.VITE_HONO_API_URL || 'http://localhost:3000';
const AUTH_TOKEN_KEY = 'openmanus_auth_token';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (token) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}

export async function registerUser(payload: RegisterPayload): Promise<{ user: UserProfile; token: string }> {
  const response = await fetch(`${HONO_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to register account');
  }

  setStoredToken(data.token);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<{ user: UserProfile; token: string }> {
  const response = await fetch(`${HONO_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Invalid credentials');
  }

  setStoredToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${HONO_API_URL}/api/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    removeStoredToken();
    throw new Error(data.error || 'Session expired or invalid');
  }

  return data.user;
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<{ user: UserProfile; token: string }> {
  const response = await fetch(`${HONO_API_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function changeUserPassword(payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${HONO_API_URL}/api/auth/password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update password');
  }

  return data;
}
