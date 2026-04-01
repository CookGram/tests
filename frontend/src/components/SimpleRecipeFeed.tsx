import type { Recipe } from "../types/recipe";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// NOTE: Компонент показывает список уже загруженных рецептов.
// Он не ходит в API напрямую: данные и фильтры (по подпискам, авторам и т.п.)
// приходят от родителя (например, App.tsx), который вызывает /api/recipes
// и, если нужно, /api/recipes/subscribed.

// Simple SVG icons
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

interface SimpleRecipeFeedProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  onAddRecipeClick: () => void;
  onAuthorClick: (authorName: string) => void;
  showSubscriptionsOnly: boolean;
  onToggleSubscriptionsFilter: () => void;
  hideFilterButton?: boolean;
  title?: string;

  // Новые пропсы для подписок
  currentUserName?: string;
  subscriptions: string[];
  onSubscribe: (authorName: string) => void;
  onUnsubscribe: (authorName: string) => void;
}

export function SimpleRecipeFeed({
  recipes,
  onRecipeClick,
  onAddRecipeClick,
  onAuthorClick,
  showSubscriptionsOnly,
  onToggleSubscriptionsFilter,
  hideFilterButton,
  title,
  currentUserName,
  subscriptions,
  onSubscribe,
  onUnsubscribe,
}: SimpleRecipeFeedProps) {
  const isSubscribedTo = (authorName: string) =>
    subscriptions.includes(authorName);

  const canSubscribeTo = (authorName: string) =>
    !!currentUserName && authorName !== currentUserName;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2>{title ?? "Лента рецептов"}</h2>
          {!hideFilterButton && (
            <p className="text-sm text-gray-500">
              {showSubscriptionsOnly
                ? "Показаны только рецепты авторов, на которых вы подписаны"
                : "Показаны все рецепты"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!hideFilterButton && (
            <button
              onClick={onToggleSubscriptionsFilter}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                showSubscriptionsOnly
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              Только подписки
            </button>
          )}
          <button
            onClick={onAddRecipeClick}
            className="flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            <PlusIcon />
            Добавить рецепт
          </button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
          Рецептов пока нет. Начните с добавления первого рецепта!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const canSub = canSubscribeTo(recipe.author);
            const isSub = isSubscribedTo(recipe.author);

            return (
              <div
                key={recipe.id}
                className="flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md"
                onClick={() => onRecipeClick(recipe)}
              >
                {recipe.image && (
                  <ImageWithFallback
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mb-2 line-clamp-2">{recipe.title}</h3>

                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAuthorClick(recipe.author);
                      }}
                    >
                      <span className="truncate">{recipe.author}</span>
                    </button>

                    {canSub && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSub) {
                            onUnsubscribe(recipe.author);
                          } else {
                            onSubscribe(recipe.author);
                          }
                        }}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                          isSub
                            ? "border-pink-600 bg-pink-50 text-pink-700"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        {isSub ? "Вы подписаны" : "Подписаться"}
                      </button>
                    )}
                  </div>

                  <div className="mt-auto">
                    {recipe.createdAt && (
                      <p className="text-xs text-gray-400">
                        {recipe.createdAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
