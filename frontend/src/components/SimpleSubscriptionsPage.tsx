import type { User } from "../types/recipe";

interface SimpleSubscriptionsPageProps {
  user: User;
  onBack: () => void;
  onUnsubscribe: (authorName: string) => void;
  onAuthorClick: (authorName: string) => void;
}

export function SimpleSubscriptionsPage({
  user,
  onBack,
  onUnsubscribe,
  onAuthorClick,
}: SimpleSubscriptionsPageProps) {
  // Нормализуем подписки в массив строк (логины авторов)
  const rawSubs = (user && (user as any).subscriptions) ?? [];

  const subscriptions: string[] = Array.isArray(rawSubs)
    ? rawSubs
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (item && typeof item === "object") {
            const anyItem = item as any;
            // пытаемся вытащить логин/имя/почту, если бэкенд прислал объекты
            return (
              anyItem.login ??
              anyItem.name ??
              anyItem.authorName ??
              anyItem.email ??
              (anyItem.id != null ? String(anyItem.id) : "")
            );
          }
          // на крайняк превращаем в строку
          return String(item);
        })
        // отфильтруем пустые строки
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const hasSubscriptions = subscriptions.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Мои подписки</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Назад
        </button>
      </div>

      {!hasSubscriptions ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">У вас пока нет подписок</p>
          <p className="text-gray-400 mt-2">
            Подпишитесь на авторов из страниц рецептов
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((authorName) => {
            const firstLetter =
              authorName && authorName.trim().length > 0
                ? authorName.trim().charAt(0).toUpperCase()
                : "?";

            return (
              <div
                key={authorName}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-orange-600 text-lg">
                      {firstLetter}
                    </span>
                  </div>
                  <button
                    onClick={() => onAuthorClick(authorName)}
                    className="text-lg hover:text-orange-600 transition-colors"
                  >
                    {authorName}
                  </button>
                </div>
                <button
                  onClick={() => onUnsubscribe(authorName)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Отписаться
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
