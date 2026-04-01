import type { User } from "../types/recipe";

// NOTE: Этот компонент отвечает только за отображение шапки.
// Вся логика выхода из аккаунта (очистка JWT-токенов clearTokens() и сброс state)
// реализуется во внешнем коде (например, в App.tsx) и передаётся через onLogout.

interface SimpleHeaderProps {
  user: User | null;
  onLogout: () => void;
  onSubscriptionsClick: () => void;
  onUserNameClick: () => void;
  onCookBookClick: () => void;
  onSettingsClick: () => void;
}

// Simple SVG icons
const ChefHatIcon = () => (
  <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8.5 8.64c0-1.34.29-2.59.8-3.67C10.29 3.24 11.99 2 14 2c2.76 0 5 2.24 5 5 0 .72-.15 1.41-.42 2.04C19.49 9.02 20 9.95 20 11c0 1.66-1.34 3-3 3-.1 0-.21 0-.31-.01-.45.62-1.17 1.01-1.99 1.01-.86 0-1.61-.43-2.06-1.09-.31.06-.63.09-.96.09-.35 0-.7-.04-1.03-.11C9.3 15 8.2 16 6.88 16 5.29 16 4 14.71 4 13.12c0-.56.16-1.09.43-1.54C4.16 11.12 4 10.57 4 10c0-1.71 1.29-3.12 2.95-3.32A4.49 4.49 0 018.5 8.64zM7 17h10v2a3 3 0 01-3 3H10a3 3 0 01-3-3v-2z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5m0 0H5a2 2 0 00-2 2v10a2 2 0 002 2h8" />
  </svg>
);

export function SimpleHeader({
  user,
  onLogout,
  onSubscriptionsClick,
  onUserNameClick,
  onCookBookClick,
  onSettingsClick,
}: SimpleHeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button
          onClick={onCookBookClick}
          className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
        >
          <ChefHatIcon />
          <span className="text-lg font-semibold">CookBook</span>
        </button>

        {user && (
          <div className="flex items-center gap-3">
            <button
              onClick={onSubscriptionsClick}
              className="flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-sm text-pink-700 hover:bg-pink-100"
            >
              Подписки
            </button>

            <button
              onClick={onSettingsClick}
              className="flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-sm text-pink-700 hover:bg-pink-100"
            >
              Настройки
            </button>

            <button
              onClick={onUserNameClick}
              className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
            >
              <span className="max-w-[150px] truncate">{user.name}</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
            >
              <LogoutIcon />
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
