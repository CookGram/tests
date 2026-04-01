import { getAccessToken } from "./auth";

const API_BASE_URL = "http://localhost:8080/api";

export interface AccountProfile {
  id: number;
  login: string;
  email: string;
  name?: string;
}

export interface UpdateAccountPayload {
  id: number;
  login: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateAccountProfile(payload: UpdateAccountPayload): Promise<AccountProfile> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/account/${payload.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      login: payload.login,
      email: payload.email,
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Не удалось обновить профиль (статус ${res.status} ${res.statusText})`);
  }

  return (await res.json()) as AccountProfile;
}
