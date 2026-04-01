import type { User } from "../../src/types/recipe";

export const DEFAULT_USER: User = {
  id: "1",
  name: "TestUser",
  login: "TestUser",
  email: "test@example.com",
  subscriptions: [],
};

export const LABELS = {
  TITLE: "Настройки профиля",
  BACK: "Назад",
  CANCEL: "Отмена",
  SAVE: "Сохранить изменения",
  SAVING: "Сохранение...",
  SUCCESS_MESSAGE: "Настройки успешно сохранены!",
  SECTION_MAIN: "Основная информация",
  SECTION_PASSWORD: "Изменение пароля",
  LABEL_LOGIN: "Имя пользователя",
  LABEL_EMAIL: "Email (нельзя изменить)",
  LABEL_CURRENT_PASSWORD: "Текущий пароль",
  LABEL_NEW_PASSWORD: "Новый пароль",
  LABEL_CONFIRM_PASSWORD: "Подтвердите новый пароль",
  PASSWORD_EMPTY_HINT: "Оставьте поля пароля пустыми, если не хотите его менять",
} as const;

export const VALIDATION_MESSAGES = {
  LOGIN_REQUIRED: "Имя пользователя обязательно",
  LOGIN_MIN: "Имя должно быть не менее 2 символов",
  LOGIN_MAX: "Имя должно быть не более 100 символов",
  CURRENT_PASSWORD_REQUIRED: "Введите текущий пароль",
  CURRENT_PASSWORD_FOR_NAME: "Для изменения имени введите текущий пароль",
  NEW_PASSWORD_MIN: "Новый пароль должен быть не менее 6 символов",
  NEW_PASSWORD_MAX: "Пароль должен быть не более 12 символов",
  NEW_PASSWORD_CHARS: "Пароль может содержать только латинские/русские буквы и цифры",
  CONFIRM_REQUIRED: "Подтвердите новый пароль",
  PASSWORDS_MISMATCH: "Пароли не совпадают",
} as const;

export const NETWORK_ERROR_ALERT = "Проблема с подключением к серверу. Проверьте интернет-соединение.";
