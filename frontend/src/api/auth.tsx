// src/api/auth.ts
const API_BASE_URL = "http://localhost:8080/api";

export interface JwtResponse {
  type: string;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface RegisterRequestBody {
  login: string;
  email: string;
  password: string;
  name?: string;
}

// Профиль пользователя, который возвращает /api/account/profile
export interface AccountProfile {
  id: number;
  login: string;
  email: string;
  name?: string;
}

export async function loginRequest(body: LoginRequestBody): Promise<JwtResponse> {
  const res = await fetch(`${API_BASE_URL}/account/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Login failed with status ${res.status} (${res.statusText})`);
  }

  return (await res.json()) as JwtResponse;
}

export async function registerRequest(body: RegisterRequestBody): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/account/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Register failed with status ${res.status} (${res.statusText})`);
  }
}

// --- работа с токенами в localStorage ---

const ACCESS_TOKEN_KEY = "cookbook_access_token";
const REFRESH_TOKEN_KEY = "cookbook_refresh_token";

export function saveTokens(tokens: JwtResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// --- профиль по email ---

export async function fetchProfileByEmail(email: string): Promise<AccountProfile> {
  const params = new URLSearchParams({ email }).toString();

  const res = await fetch(`${API_BASE_URL}/account/profile?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // при желании можно добавить Authorization: Bearer <token>
      // но эндпоинт сейчас и так публичный
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Profile request failed with status ${res.status} (${res.statusText})`);
  }

  return (await res.json()) as AccountProfile;
}
