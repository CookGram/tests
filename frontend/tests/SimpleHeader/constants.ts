import type { User } from "../../src/types/recipe";

export const DEFAULT_USER: User = {
  id: "1",
  name: "TestUser",
  login: "TestUser",
  email: "test@example.com",
  subscriptions: [],
};

export const LABELS = {
  LOGO: "CookBook",
  SUBSCRIPTIONS: "Подписки",
  SETTINGS: "Настройки",
  LOGOUT: "Выйти",
} as const;
