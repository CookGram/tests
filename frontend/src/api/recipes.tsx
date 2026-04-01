// src/api/recipes.ts
import { getAccessToken } from "./auth";

const API_BASE_URL = "http://localhost:8080/api";

export interface RecipeStepDTO {
  id?: number;
  stepNo: number;
  description: string;
  imageData?: string | null;
}

export interface RecipeDTO {
  id?: number;
  authorId: number;
  title: string;
  authorLogin?: string;
  imageData?: string | null;
  createdAt?: string;
  steps?: RecipeStepDTO[];
}

// Общий fetch с авторизацией
export async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return res;
}

export async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status} (${res.statusText})`);
  }
  return res.json() as Promise<T>;
}

// POST /api/recipes/save
export async function saveRecipeApi(dto: Omit<RecipeDTO, "id" | "createdAt">): Promise<RecipeDTO> {
  const res = await authorizedFetch("/recipes/save", {
    method: "POST",
    body: JSON.stringify(dto),
  });

  return handleJson<RecipeDTO>(res);
}

// GET /api/recipes
export async function getAllRecipesApi(): Promise<RecipeDTO[]> {
  const res = await authorizedFetch("/recipes", {
    method: "GET",
  });

  return handleJson<RecipeDTO[]>(res);
}

// Запасом — обёртки под остальные эндпоинты,
// если решишь их использовать позже:

// GET /api/recipes/author/{authorId}
export async function getRecipesByAuthorApi(authorId: number): Promise<RecipeDTO[]> {
  const res = await authorizedFetch(`/recipes/author/${authorId}`, {
    method: "GET",
  });

  return handleJson<RecipeDTO[]>(res);
}

// GET /api/recipes/subscribed?userId=...
export async function getSubscribedRecipesApi(userId: number): Promise<RecipeDTO[]> {
  const params = new URLSearchParams({ userId: String(userId) }).toString();
  const res = await authorizedFetch(`/recipes/subscribed?${params}`, {
    method: "GET",
  });

  return handleJson<RecipeDTO[]>(res);
}

// GET /api/recipes/{recipeId}
export async function getRecipeByIdApi(recipeId: number): Promise<RecipeDTO> {
  const res = await authorizedFetch(`/recipes/${recipeId}`, {
    method: "GET",
  });

  return handleJson<RecipeDTO>(res);
}
