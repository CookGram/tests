import "@testing-library/jest-dom";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderSimpleAuthorRecipesPage,
  DEFAULT_AUTHOR_NAME,
  DEFAULT_RECIPES,
  defaultOnBack,
  defaultOnRecipeClick,
  defaultOnSubscribe,
  defaultOnUnsubscribe,
} from "./testUtils";
import { SimpleAuthorRecipesPage } from "../../src/components/SimpleAuthorRecipesPage";

describe("SimpleAuthorRecipesPage", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    user = userEvent.setup();
  });

  const getBackButton = () => screen.getByRole("button", { name: /назад/i });
  const getAuthorName = () => screen.getByText(DEFAULT_AUTHOR_NAME);
  const getSubscribeButton = () => screen.queryByRole("button", { name: /подписаться/i });
  const getUnsubscribeButton = () => screen.queryByRole("button", { name: /вы подписаны/i });
  const getEmptyMessage = () => screen.queryByText(/у этого автора пока нет рецептов/i);
  const getRecipeCard = (title: string) =>
    screen.getByText(title).closest("div[class*='cursor-pointer']") as HTMLElement;

  describe("Что отображается на странице", () => {
    it("показывает имя автора", () => {
      renderSimpleAuthorRecipesPage();
      expect(getAuthorName()).toBeInTheDocument();
    });

    it("показывает кнопку «Назад»", () => {
      renderSimpleAuthorRecipesPage();
      expect(getBackButton()).toBeInTheDocument();
    });

    it("показывает заголовок «Рецепты автора»", () => {
      renderSimpleAuthorRecipesPage();
      expect(screen.getByText("Рецепты автора")).toBeInTheDocument();
    });

    it("если у автора нет рецептов - показывает сообщение об этом", () => {
      renderSimpleAuthorRecipesPage({ recipes: [] });
      expect(getEmptyMessage()).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("если у автора есть рецепты - показывает их список", () => {
      renderSimpleAuthorRecipesPage();

      DEFAULT_RECIPES.forEach((recipe) => {
        expect(screen.getByText(recipe.title)).toBeInTheDocument();
      });
    });
  });

  describe("Как отображаются рецепты", () => {
    it("показывает картинку рецепта, если она есть", () => {
      renderSimpleAuthorRecipesPage();

      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute("src", DEFAULT_RECIPES[0].image);
      expect(images[0]).toHaveAttribute("alt", DEFAULT_RECIPES[0].title);
    });

    it("показывает дату создания для каждого рецепта", () => {
      renderSimpleAuthorRecipesPage();

      DEFAULT_RECIPES.forEach((recipe) => {
        const expectedDate = recipe.createdAt.toLocaleDateString();
        expect(screen.getByText(expectedDate)).toBeInTheDocument();
      });
    });
  });

  describe("Как работает кнопка подписки", () => {
    it("когда пользователь не залогинен - кнопки подписки нет", () => {
      renderSimpleAuthorRecipesPage({ currentUserName: undefined });
      expect(getSubscribeButton()).not.toBeInTheDocument();
      expect(getUnsubscribeButton()).not.toBeInTheDocument();
    });

    it("когда пользователь смотрит свою страницу - кнопки подписки нет", () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: DEFAULT_AUTHOR_NAME,
      });
      expect(getSubscribeButton()).not.toBeInTheDocument();
      expect(getUnsubscribeButton()).not.toBeInTheDocument();
    });

    it("когда пользователь НЕ подписан на автора - показывает кнопку «Подписаться»", () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: "Другой User",
        isSubscribed: false,
      });

      expect(getSubscribeButton()).toBeInTheDocument();
      expect(getUnsubscribeButton()).not.toBeInTheDocument();
    });

    it("когда пользователь подписан на автора - показывает кнопку «Вы подписаны»", () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: "Другой User",
        isSubscribed: true,
      });

      expect(getUnsubscribeButton()).toBeInTheDocument();
      expect(getSubscribeButton()).not.toBeInTheDocument();
    });

    it("кнопка «Подписаться» выглядит серой", () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: "Другой User",
        isSubscribed: false,
      });

      const subscribeButton = getSubscribeButton()!;
      expect(subscribeButton).toHaveClass("border-gray-300", "bg-white", "text-gray-700");
    });

    it("кнопка «Вы подписаны» выглядит розовой", () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: "Другой User",
        isSubscribed: true,
      });

      const unsubscribeButton = getUnsubscribeButton()!;
      expect(unsubscribeButton).toHaveClass("border-pink-600", "bg-pink-50", "text-pink-700");
    });
  });

  describe("Что происходит при кликах", () => {
    it("при клике на кнопку «Назад» вызывается onBack", async () => {
      renderSimpleAuthorRecipesPage();
      await user.click(getBackButton());
      expect(defaultOnBack).toHaveBeenCalledTimes(1);
    });

    it("при клике на рецепт вызывается onRecipeClick с правильным рецептом", async () => {
      renderSimpleAuthorRecipesPage();

      await user.click(getRecipeCard(DEFAULT_RECIPES[0].title));
      expect(defaultOnRecipeClick).toHaveBeenCalledWith(DEFAULT_RECIPES[0]);
      expect(defaultOnRecipeClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Что происходит с подпиской при кликах", () => {
    it("когда пользователь НЕ подписан - при клике на «Подписаться» вызывается onSubscribe", async () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: "Другой User",
        isSubscribed: false,
      });

      await user.click(getSubscribeButton()!);
      expect(defaultOnSubscribe).toHaveBeenCalledWith(DEFAULT_AUTHOR_NAME);
      expect(defaultOnSubscribe).toHaveBeenCalledTimes(1);
      expect(defaultOnUnsubscribe).not.toHaveBeenCalled();
    });

    it("когда пользователь подписан - при клике на «Вы подписаны» вызывается onUnsubscribe", async () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: "Другой User",
        isSubscribed: true,
      });

      await user.click(getUnsubscribeButton()!);
      expect(defaultOnUnsubscribe).toHaveBeenCalledWith(DEFAULT_AUTHOR_NAME);
      expect(defaultOnUnsubscribe).toHaveBeenCalledTimes(1);
      expect(defaultOnSubscribe).not.toHaveBeenCalled();
    });
  });

  describe("Разные ситуации", () => {
    it("пользователь залогинен под другим именем - может подписаться", () => {
      renderSimpleAuthorRecipesPage({
        currentUserName: "Петр Поваров",
        isSubscribed: false,
      });

      expect(getSubscribeButton()).toBeInTheDocument();
    });

    it("можно подписаться и тут же отписаться", async () => {
      const onSubscribe = jest.fn();
      const onUnsubscribe = jest.fn();

      const { rerender } = renderSimpleAuthorRecipesPage({
        currentUserName: "Другой User",
        isSubscribed: false,
        onSubscribe,
        onUnsubscribe,
      });

      // Подписываемся
      await user.click(getSubscribeButton()!);
      expect(onSubscribe).toHaveBeenCalledWith(DEFAULT_AUTHOR_NAME);

      rerender(
        <SimpleAuthorRecipesPage
          authorName={DEFAULT_AUTHOR_NAME}
          recipes={DEFAULT_RECIPES}
          onBack={defaultOnBack}
          onRecipeClick={defaultOnRecipeClick}
          currentUserName="Другой User"
          isSubscribed={true}
          onSubscribe={onSubscribe}
          onUnsubscribe={onUnsubscribe}
        />,
      );

      // Отписываемся
      await user.click(getUnsubscribeButton()!);
      expect(onUnsubscribe).toHaveBeenCalledWith(DEFAULT_AUTHOR_NAME);
    });

    it("автор выпустил много рецептов - показываются все", () => {
      const manyRecipes = Array.from({ length: 5 }, (_, i) => ({
        ...DEFAULT_RECIPES[0],
        id: `${i}`,
        title: `Рецепт ${i + 1}`,
        image: i % 2 === 0 ? "image.jpg" : undefined,
      }));

      renderSimpleAuthorRecipesPage({ recipes: manyRecipes });

      manyRecipes.forEach((recipe) => {
        expect(screen.getByText(recipe.title)).toBeInTheDocument();
      });

      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(3);
    });
  });
});
