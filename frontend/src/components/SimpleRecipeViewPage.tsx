import type { Recipe } from "../types/recipe";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// NOTE: Это детальная страница рецепта.
// Компонент получает готовый Recipe через пропсы и сам не обращается к API.
// Получение рецепта по id через /api/recipes/{recipeId} выполняется во внешнем коде,
// который маппит RecipeDTO → Recipe и передаёт его сюда.

// Simple SVG icons
const ArrowLeftIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

interface SimpleRecipeViewPageProps {
  recipe: Recipe;
  onBack: () => void;
  onAuthorClick: (authorName: string) => void;
  onSubscribe: (authorName: string) => void;
  onUnsubscribe: (authorName: string) => void;
  isSubscribed: boolean;
  currentUserName: string;
}

export function SimpleRecipeViewPage({
  recipe,
  onBack,
  onAuthorClick,
  onSubscribe,
  onUnsubscribe,
  isSubscribed,
  currentUserName,
}: SimpleRecipeViewPageProps) {
  const isOwnRecipe = recipe.author === currentUserName;

  const handleSubscriptionToggle = () => {
    if (isSubscribed) {
      onUnsubscribe(recipe.author);
    } else {
      onSubscribe(recipe.author);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded px-3 py-1 hover:bg-gray-100"
      >
        <ArrowLeftIcon />
        Назад
      </button>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {recipe.image && (
          <ImageWithFallback
            src={recipe.image}
            alt={recipe.title}
            className="h-64 w-full object-cover"
          />
        )}
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-2xl font-semibold">{recipe.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-blue-600"
                  onClick={() => onAuthorClick(recipe.author)}
                >
                  <span>{recipe.author}</span>
                </button>
                {recipe.createdAt && (
                  <div className="flex items-center gap-1">
                    <span>{recipe.createdAt.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {!isOwnRecipe && (
              <button
                type="button"
                onClick={handleSubscriptionToggle}
                className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                  isSubscribed
                    ? "border-pink-600 bg-pink-50 text-pink-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {isSubscribed ? "Вы подписаны" : "Подписаться"}
              </button>
            )}
          </div>

          {/* Ингредиенты */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-lg font-medium">Ингредиенты</h2>
              <ul className="list-inside list-disc space-y-1 text-gray-700">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Шаги приготовления */}
          {recipe.steps && recipe.steps.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-medium">Шаги приготовления</h2>
              <div className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <div
                    key={step.id ?? index}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-sm text-white">
                        {index + 1}
                      </span>
                      <h3 className="font-medium">Шаг {index + 1}</h3>
                    </div>
                    <p className="mb-2 text-gray-700 whitespace-pre-line">
                      {step.description}
                    </p>
                    {step.image && (
                      <ImageWithFallback
                        src={step.image}
                        alt={`Шаг ${index + 1}`}
                        className="mt-2 max-h-64 w-full rounded object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
