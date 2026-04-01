import { useState } from "react";
import type { User } from "../types/recipe";
import { updateAccountProfile } from "../api/account";

interface SimpleSettingsPageProps {
  user: User;
  onBack: () => void;
  onSaveSettings: (updatedUser: User) => void;
}

export function SimpleSettingsPage({ user, onBack, onSaveSettings }: SimpleSettingsPageProps) {
  const [formData, setFormData] = useState({
    login: user.login ?? user.name,
    email: user.email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const hasChanges =
    formData.login !== (user.login ?? user.name) || formData.newPassword !== "" || formData.confirmPassword !== "";

  const EyeIcon = () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94" />
      <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
      <path d="M1 1l22 22" />
    </svg>
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.login.trim()) {
      newErrors.login = "Имя пользователя обязательно";
    } else if (formData.login.length < 2) {
      newErrors.login = "Имя должно быть не менее 2 символов";
    } else if (formData.login.length > 100) {
      newErrors.login = "Имя должно быть не более 100 символов";
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Введите текущий пароль";
      }

      if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Новый пароль должен быть не менее 6 символов";
      } else if (formData.newPassword.length > 12) {
        newErrors.newPassword = "Пароль должен быть не более 12 символов";
      } else if (!/^[a-zA-Zа-яА-ЯёЁ0-9]+$/.test(formData.newPassword)) {
        newErrors.newPassword = "Пароль может содержать только латинские/русские буквы и цифры";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Подтвердите новый пароль";
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Пароли не совпадают";
      }
    }

    const nameChanged = formData.login !== (user.login ?? user.name);
    if (nameChanged && !formData.currentPassword && !formData.newPassword) {
      newErrors.currentPassword = "Для изменения имени введите текущий пароль";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) return;

    const isValid = validateForm();
    if (!isValid) return;

    setIsLoading(true);

    try {
      const idNumber = Number(user.id);
      const nameChanged = formData.login !== (user.login ?? user.name);
      const passwordChanged = !!formData.newPassword;

      if (!Number.isFinite(idNumber)) {
        console.warn("Невозможно обновить профиль: user.id не число:", user.id);
        const updatedUser: User = {
          ...user,
          login: formData.login,
          name: formData.login,
          email: formData.email,
        };
        onSaveSettings(updatedUser);
      } else {
        const profile = await updateAccountProfile({
          id: idNumber,
          login: formData.login,
          email: formData.email,
          currentPassword: nameChanged || passwordChanged ? formData.currentPassword || "" : undefined,
          newPassword: passwordChanged ? formData.newPassword || "" : undefined,
        });

        const displayName = profile.login || formData.login;

        const updatedUser: User = {
          ...user,
          id: String(profile.id),
          login: profile.login ?? displayName,
          name: displayName,
          email: profile.email,
        };

        onSaveSettings(updatedUser);
      }

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Ошибка при сохранении настроек:", error);

      const errorMessage = error?.message || "Не удалось сохранить настройки профиля";
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("Network Error")) {
        alert("Проблема с подключением к серверу. Проверьте интернет-соединение.");
      } else {
        alert(`${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCancel = () => {
    setFormData({
      login: user.login ?? user.name,
      email: user.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    onBack();
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const getInputClass = (hasError: boolean) =>
    `w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
    }`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Назад
        </button>
        <h1 className="text-2xl font-semibold">Настройки профиля</h1>
      </div>

      {showSuccess && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4 text-green-800">
          Настройки успешно сохранены!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
                Имя пользователя
              </label>
              <input
                id="login"
                type="text"
                value={formData.login}
                onChange={(e) => handleInputChange("login", e.target.value)}
                className={getInputClass(!!errors.login)}
                placeholder="Введите имя пользователя"
              />
              {errors.login && <p className="mt-1 text-sm text-red-600">{errors.login}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email (нельзя изменить)
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                readOnly
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email используется как логин и не может быть изменён из настроек.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Изменение пароля</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Текущий пароль
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                  className={getInputClass(!!errors.currentPassword)}
                  placeholder="Введите текущий пароль"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPasswords.current ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPasswords.current ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Новый пароль
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  className={getInputClass(!!errors.newPassword)}
                  placeholder="Введите новый пароль"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPasswords.new ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPasswords.new ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Подтвердите новый пароль
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={getInputClass(!!errors.confirmPassword)}
                  placeholder="Подтвердите новый пароль"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPasswords.confirm ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPasswords.confirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            Оставьте поля пароля пустыми, если не хотите его менять. При изменении имени пользователя или пароля нужно
            ввести текущий пароль.
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-gray-300 px-6 py-2 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isLoading}
            className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>
    </div>
  );
}
