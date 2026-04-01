import { render } from "@testing-library/react";
import { SimpleAuthorRecipesPage } from "../../src/components/SimpleAuthorRecipesPage";
import type { Recipe } from "../../src/types/recipe";

export const DEFAULT_AUTHOR_NAME = "Анна Кулинарова";

export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: "1",
    title: "Борщ",
    author: "Анна Кулинарова",
    authorId: 1,
    ingredients: ["свекла", "капуста"],
    steps: [{ id: "1", description: "Сварить" }],
    createdAt: new Date("2024-01-01"),
    image: "https://example.com/borsch.jpg",
  },
  {
    id: "2",
    title: "Вареники",
    author: "Анна Кулинарова",
    authorId: 1,
    ingredients: ["тесто", "картошка"],
    steps: [{ id: "1", description: "Слепить" }],
    createdAt: new Date("2024-01-02"),
    image: undefined,
  },
];

export const defaultOnBack = jest.fn();
export const defaultOnRecipeClick = jest.fn();
export const defaultOnSubscribe = jest.fn();
export const defaultOnUnsubscribe = jest.fn();

interface RenderSimpleAuthorRecipesPageProps {
  authorName?: string;
  recipes?: Recipe[];
  onBack?: () => void;
  onRecipeClick?: (recipe: Recipe) => void;
  currentUserName?: string;
  isSubscribed?: boolean;
  onSubscribe?: (authorName: string) => void;
  onUnsubscribe?: (authorName: string) => void;
}

export function renderSimpleAuthorRecipesPage(props: RenderSimpleAuthorRecipesPageProps = {}) {
  const {
    authorName = DEFAULT_AUTHOR_NAME,
    recipes = DEFAULT_RECIPES,
    onBack = defaultOnBack,
    onRecipeClick = defaultOnRecipeClick,
    currentUserName,
    isSubscribed = false,
    onSubscribe = defaultOnSubscribe,
    onUnsubscribe = defaultOnUnsubscribe,
  } = props;

  return render(
    <SimpleAuthorRecipesPage
      authorName={authorName}
      recipes={recipes}
      onBack={onBack}
      onRecipeClick={onRecipeClick}
      currentUserName={currentUserName}
      isSubscribed={isSubscribed}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
    />,
  );
}
