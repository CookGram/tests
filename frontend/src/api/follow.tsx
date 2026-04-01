import { getAccessToken } from "./auth";

const API_BASE_URL = "http://localhost:8080/api";

export async function followUserApi(followerId: number, targetUserId: number): Promise<void> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/subscription/${targetUserId}?userId=${followerId}`, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Не удалось подписаться (статус ${res.status} ${res.statusText})`);
  }
}

export async function unfollowUserApi(followerId: number, targetUserId: number): Promise<void> {
  const token = getAccessToken();

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/subscription/${targetUserId}?userId=${followerId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Не удалось отписаться (статус ${res.status} ${res.statusText})`);
  }
}

/**
 * Получить список логинов/имён авторов, на которых подписан пользователь.
 * Бэкенд возвращает List<AccountDTO>, мы маппим его в string[].
 */
export async function getUserSubscriptionsApi(userId: number): Promise<string[]> {
  const token = getAccessToken();

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/subscription?userId=${userId}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Не удалось загрузить подписки (статус ${res.status} ${res.statusText})`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    return [];
  }

  const names = data
    .map((item: any) => {
      if (!item) return "";
      const login = item.login as string | null | undefined;
      const name = item.name as string | null | undefined;
      const email = item.email as string | null | undefined;

      return (login && login.trim()) || (name && name.trim()) || email || (item.id != null ? String(item.id) : "");
    })
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  return names;
}
