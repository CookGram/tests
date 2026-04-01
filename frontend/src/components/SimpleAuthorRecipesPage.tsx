import type { Recipe } from "../types/recipe";

interface SimpleAuthorRecipesPageProps {
  authorName: string;
  recipes: Recipe[];
  onBack: () => void;
  onRecipeClick: (recipe: Recipe) => void;

  // Новые пропсы для подписок
  currentUserName?: string;
  isSubscribed?: boolean;
  onSubscribe?: (authorName: string) => void;
  onUnsubscribe?: (authorName: string) => void;
}

export function SimpleAuthorRecipesPage({
  authorName,
  recipes,
  onBack,
  onRecipeClick,
  currentUserName,
  isSubscribed = false,
  onSubscribe,
  onUnsubscribe,
}: SimpleAuthorRecipesPageProps) {
  const canSubscribe = !!currentUserName && currentUserName !== authorName && onSubscribe && onUnsubscribe;

  const handleToggleSubscribe = () => {
    if (!canSubscribe) return;
    if (isSubscribed) {
      onUnsubscribe!(authorName);
    } else {
      onSubscribe!(authorName);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 rounded px-3 py-1 hover:bg-gray-100">
          <ArrowLeftIcon />
          Назад
        </button>
        <h2>Рецепты автора</h2>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{authorName}</span>
        </div>

        {canSubscribe && (
          <button
            type="button"
            onClick={handleToggleSubscribe}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
              isSubscribed ? "border-pink-600 bg-pink-50 text-pink-700" : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            {isSubscribed ? "Вы подписаны" : "Подписаться"}
          </button>
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-gray-500">
          У этого автора пока нет рецептов.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md"
              onClick={() => onRecipeClick(recipe)}
            >
              {recipe.image && <img src={recipe.image} alt={recipe.title} className="h-40 w-full object-cover" />}
              <div className="p-4">
                <h3 className="mb-2">{recipe.title}</h3>
                <p className="text-gray-600 text-sm">{recipe.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple SVG icons
const ArrowLeftIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
