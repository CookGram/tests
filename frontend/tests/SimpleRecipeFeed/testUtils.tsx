import { render } from "@testing-library/react";
import { SimpleRecipeFeed } from "../../src/components/SimpleRecipeFeed";
import { Recipe } from "../../src/types/recipe";

export const mockRecipeSteps = [
  {
    id: "step1",
    description: "Нарезать овощи",
    image: "https://example.com/step1.jpg",
  },
  {
    id: "step2",
    description: "Сварить бульон",
  },
];

export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Борщ",
    author: "Анна Кулинарова",
    authorId: 1,
    ingredients: ["свекла", "капуста", "морковь", "картофель"],
    steps: mockRecipeSteps,
    createdAt: new Date("2024-01-01"),
    image: "https://example.com/borsch.jpg",
  },
  {
    id: "2",
    title: "Паста Карбонара",
    author: "Петр Поваров",
    authorId: 2,
    ingredients: ["паста", "яйца", "бекон", "сыр"],
    steps: mockRecipeSteps,
    createdAt: new Date("2024-01-02"),
    image: undefined,
  },
  {
    id: "3",
    title: "Цезарь с курицей",
    author: "Мария Сладкоежкина",
    authorId: 3,
    ingredients: ["курица", "салат", "сухарики", "соус"],
    steps: mockRecipeSteps,
    createdAt: new Date("2024-01-03"),
    image: "https://example.com/caesar.jpg",
  },
];

interface RenderSimpleRecipeFeedProps {
  recipes?: Recipe[];
  onRecipeClick?: (recipe: Recipe) => void;
  onAddRecipeClick?: () => void;
  onAuthorClick?: (authorName: string) => void;
  showSubscriptionsOnly?: boolean;
  onToggleSubscriptionsFilter?: () => void;
  hideFilterButton?: boolean;
  title?: string;
  currentUserName?: string;
  subscriptions?: string[];
  onSubscribe?: (authorName: string) => void;
  onUnsubscribe?: (authorName: string) => void;
}

export function renderSimpleRecipeFeed(props: RenderSimpleRecipeFeedProps = {}) {
  const defaultProps = {
    recipes: mockRecipes,
    onRecipeClick: jest.fn(),
    onAddRecipeClick: jest.fn(),
    onAuthorClick: jest.fn(),
    showSubscriptionsOnly: false,
    onToggleSubscriptionsFilter: jest.fn(),
    hideFilterButton: false,
    title: undefined,
    currentUserName: undefined,
    subscriptions: [],
    onSubscribe: jest.fn(),
    onUnsubscribe: jest.fn(),
  };

  return render(<SimpleRecipeFeed {...defaultProps} {...props} />);
}
