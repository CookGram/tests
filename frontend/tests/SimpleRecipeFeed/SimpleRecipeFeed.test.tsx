import "@testing-library/jest-dom";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderSimpleRecipeFeed, mockRecipes } from "./testUtils";
import { DEFAULT_TEXTS, FILTER_STATES, SUBSCRIPTION_BUTTONS } from "./constants";

describe("SimpleRecipeFeed", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    user = userEvent.setup();
  });

  const getFilterButton = () => screen.getByRole("button", { name: /только подписки/i });
  const getAddRecipeButton = () => screen.getByRole("button", { name: /добавить рецепт/i });
  const getRecipeCard = (title: string) =>
    screen.getByText(title).closest("div[class*='cursor-pointer']") as HTMLElement;
  const getAuthorButton = (authorName: string) => screen.getAllByText(authorName)[0] as HTMLElement;

  const getAllSubscribeButtons = () => screen.getAllByRole("button", { name: SUBSCRIPTION_BUTTONS.SUBSCRIBE });
  const getAllUnsubscribeButtons = () => screen.getAllByRole("button", { name: SUBSCRIPTION_BUTTONS.UNSUBSCRIBE });

  const getSubscribeButtonForAuthor = (authorName: string) => {
    const recipeCard = getRecipeCardByAuthor(authorName);
    return within(recipeCard).getByRole("button", { name: SUBSCRIPTION_BUTTONS.SUBSCRIBE });
  };

  const getUnsubscribeButtonForAuthor = (authorName: string) => {
    const recipeCard = getRecipeCardByAuthor(authorName);
    return within(recipeCard).getByRole("button", { name: SUBSCRIPTION_BUTTONS.UNSUBSCRIBE });
  };

  const getRecipeCardByAuthor = (authorName: string) => {
    const authorElement = screen.getByText(authorName);
    return authorElement.closest("div[class*='cursor-pointer']") as HTMLElement;
  };

  describe("Что отображается на странице", () => {
    it("показывает заголовок «Лента рецептов»", () => {
      renderSimpleRecipeFeed();
      expect(screen.getByText(DEFAULT_TEXTS.DEFAULT_TITLE)).toBeInTheDocument();
    });

    it("можно задать свой заголовок через проп title", () => {
      renderSimpleRecipeFeed({ title: DEFAULT_TEXTS.CUSTOM_TITLE });
      expect(screen.getByText(DEFAULT_TEXTS.CUSTOM_TITLE)).toBeInTheDocument();
    });

    it("показывает кнопки «Только подписки» и «Добавить рецепт»", () => {
      renderSimpleRecipeFeed();
      expect(getFilterButton()).toBeInTheDocument();
      expect(getAddRecipeButton()).toBeInTheDocument();
    });

    it("можно спрятать кнопку фильтра через hideFilterButton=true", () => {
      renderSimpleRecipeFeed({ hideFilterButton: true });
      expect(screen.queryByRole("button", { name: /только подписки/i })).not.toBeInTheDocument();
      expect(screen.queryByText(FILTER_STATES.ALL)).not.toBeInTheDocument();
    });

    it("если рецептов нет - показывает сообщение об этом", () => {
      renderSimpleRecipeFeed({ recipes: [] });
      expect(screen.getByText(DEFAULT_TEXTS.EMPTY_MESSAGE)).toBeInTheDocument();
    });
  });

  describe("Как отображаются рецепты", () => {
    it("показывает все рецепты из списка", () => {
      renderSimpleRecipeFeed();

      mockRecipes.forEach((recipe) => {
        expect(screen.getByText(recipe.title)).toBeInTheDocument();
        expect(screen.getByText(recipe.author)).toBeInTheDocument();
      });
    });

    it("показывает картинку только если она есть в рецепте", () => {
      renderSimpleRecipeFeed();

      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);

      const recipeWithoutImage = getRecipeCard("Паста Карбонара");
      expect(within(recipeWithoutImage).queryByRole("img")).not.toBeInTheDocument();
    });

    it("показывает дату создания рецепта", () => {
      renderSimpleRecipeFeed();

      const expectedDate = mockRecipes[0].createdAt.toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it("не показывает дату, если её нет в рецепте", () => {
      const recipeWithoutDate = { ...mockRecipes[0], createdAt: undefined };
      renderSimpleRecipeFeed({ recipes: [recipeWithoutDate] });

      expect(screen.queryByText(/\d{1,2}\.\d{1,2}\.\d{4}/)).not.toBeInTheDocument();
    });
  });

  describe("Как работает фильтр «Только подписки»", () => {
    it("показывает разный текст в зависимости от того, включен фильтр или нет", () => {
      renderSimpleRecipeFeed({ showSubscriptionsOnly: false });
      expect(screen.getByText(FILTER_STATES.ALL)).toBeInTheDocument();

      cleanup();
      renderSimpleRecipeFeed({ showSubscriptionsOnly: true });
      expect(screen.getByText(FILTER_STATES.SUBSCRIPTIONS_ONLY)).toBeInTheDocument();
    });

    it("кнопка фильтра выглядит по-разному: серый цвет когда выключен, синий когда включен", () => {
      renderSimpleRecipeFeed({ showSubscriptionsOnly: false });
      expect(getFilterButton()).toHaveClass("border-gray-300", "bg-white", "text-gray-700");

      cleanup();
      renderSimpleRecipeFeed({ showSubscriptionsOnly: true });
      expect(getFilterButton()).toHaveClass("border-blue-600", "bg-blue-50", "text-blue-700");
    });
  });

  describe("Что происходит при кликах", () => {
    it("при клике на карточку рецепта вызывается onRecipeClick", async () => {
      const onRecipeClick = jest.fn();
      renderSimpleRecipeFeed({ onRecipeClick });

      await user.click(getRecipeCard(mockRecipes[0].title));
      expect(onRecipeClick).toHaveBeenCalledWith(mockRecipes[0]);
      expect(onRecipeClick).toHaveBeenCalledTimes(1);
    });

    it("при клике на имя автора вызывается onAuthorClick (и НЕ вызывается onRecipeClick)", async () => {
      const onAuthorClick = jest.fn();
      const onRecipeClick = jest.fn();
      renderSimpleRecipeFeed({ onAuthorClick, onRecipeClick });

      await user.click(getAuthorButton(mockRecipes[0].author));
      expect(onAuthorClick).toHaveBeenCalledWith(mockRecipes[0].author);
      expect(onAuthorClick).toHaveBeenCalledTimes(1);
      expect(onRecipeClick).not.toHaveBeenCalled();
    });

    it("при клике на «Добавить рецепт» вызывается onAddRecipeClick", async () => {
      const onAddRecipeClick = jest.fn();
      renderSimpleRecipeFeed({ onAddRecipeClick });

      await user.click(getAddRecipeButton());
      expect(onAddRecipeClick).toHaveBeenCalledTimes(1);
    });

    it("при клике на «Только подписки» вызывается onToggleSubscriptionsFilter", async () => {
      const onToggleSubscriptionsFilter = jest.fn();
      renderSimpleRecipeFeed({ onToggleSubscriptionsFilter });

      await user.click(getFilterButton());
      expect(onToggleSubscriptionsFilter).toHaveBeenCalledTimes(1);
    });
  });

  describe("Как работают подписки", () => {
    it("для авторов, на которых НЕ подписан - показывает кнопку «Подписаться»", () => {
      renderSimpleRecipeFeed({
        currentUserName: "Текущий User",
        subscriptions: ["Петр Поваров"],
      });

      const subscribeButtons = getAllSubscribeButtons();
      expect(subscribeButtons).toHaveLength(2);

      const unsubscribeButtons = getAllUnsubscribeButtons();
      expect(unsubscribeButtons).toHaveLength(1);
    });

    it("для авторов, на которых подписан - показывает кнопку «Вы подписаны»", () => {
      renderSimpleRecipeFeed({
        currentUserName: "Текущий User",
        subscriptions: ["Анна Кулинарова", "Петр Поваров"],
      });

      const unsubscribeButtons = getAllUnsubscribeButtons();
      expect(unsubscribeButtons).toHaveLength(2);

      const subscribeButtons = screen.queryAllByRole("button", { name: SUBSCRIPTION_BUTTONS.SUBSCRIBE });
      expect(subscribeButtons).toHaveLength(1);
    });

    it("когда имя совпадает с currentUserName кнопки подписки НЕТ", () => {
      renderSimpleRecipeFeed({
        currentUserName: "Анна Кулинарова",
        subscriptions: ["Петр Поваров"],
      });

      const ownRecipeCard = getRecipeCardByAuthor("Анна Кулинарова");
      expect(
        within(ownRecipeCard).queryByRole("button", { name: /подписаться|вы подписаны/i }),
      ).not.toBeInTheDocument();

      expect(getAllSubscribeButtons()).toHaveLength(1);
      expect(getAllUnsubscribeButtons()).toHaveLength(1);
    });

    it("если пользователь не залогинен (нет currentUserName) - кнопки подписок вообще не показывает", () => {
      renderSimpleRecipeFeed({ currentUserName: undefined });

      expect(screen.queryByRole("button", { name: /подписаться|вы подписаны/i })).not.toBeInTheDocument();
    });

    it("при клике на «Подписаться» вызывается onSubscribe с именем автора", async () => {
      const onSubscribe = jest.fn();
      renderSimpleRecipeFeed({
        currentUserName: "Текущий User",
        subscriptions: ["Петр Поваров"],
        onSubscribe,
      });

      const subscribeButton = getSubscribeButtonForAuthor("Анна Кулинарова");
      await user.click(subscribeButton);

      expect(onSubscribe).toHaveBeenCalledWith("Анна Кулинарова");
      expect(onSubscribe).toHaveBeenCalledTimes(1);
    });

    it("при клике на «Вы подписаны» вызывается onUnsubscribe с именем автора", async () => {
      const onUnsubscribe = jest.fn();
      renderSimpleRecipeFeed({
        currentUserName: "Текущий User",
        subscriptions: ["Анна Кулинарова", "Петр Поваров"],
        onUnsubscribe,
      });

      const unsubscribeButton = getUnsubscribeButtonForAuthor("Анна Кулинарова");
      await user.click(unsubscribeButton);

      expect(onUnsubscribe).toHaveBeenCalledWith("Анна Кулинарова");
      expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it("клик по кнопке подписки НЕ вызывает onRecipeClick", async () => {
      const onRecipeClick = jest.fn();
      const onSubscribe = jest.fn();
      renderSimpleRecipeFeed({
        currentUserName: "Текущий User",
        subscriptions: [],
        onRecipeClick,
        onSubscribe,
      });

      const subscribeButton = getSubscribeButtonForAuthor("Анна Кулинарова");
      await user.click(subscribeButton);

      expect(onRecipeClick).not.toHaveBeenCalled();
      expect(onSubscribe).toHaveBeenCalled();
    });

    it("кнопки подписок выглядят по-разному: «Вы подписаны» - розовая, «Подписаться» - серая", () => {
      renderSimpleRecipeFeed({
        currentUserName: "Текущий User",
        subscriptions: ["Анна Кулинарова"],
      });

      const unsubscribeButton = getUnsubscribeButtonForAuthor("Анна Кулинарова");
      expect(unsubscribeButton).toHaveClass("border-pink-600", "bg-pink-50", "text-pink-700");

      const subscribeButtonForPetr = getSubscribeButtonForAuthor("Петр Поваров");
      expect(subscribeButtonForPetr).toHaveClass("border-gray-300", "bg-white", "text-gray-700");

      const subscribeButtonForMaria = getSubscribeButtonForAuthor("Мария Сладкоежкина");
      expect(subscribeButtonForMaria).toHaveClass("border-gray-300", "bg-white", "text-gray-700");
    });
  });

  describe("Разные ситуации", () => {
    it("если у пользователя пустой список подписок - все кнопки «Подписаться»", () => {
      renderSimpleRecipeFeed({
        currentUserName: "Текущий User",
        subscriptions: [],
      });

      expect(getAllSubscribeButtons()).toHaveLength(3);
      expect(screen.queryByRole("button", { name: SUBSCRIPTION_BUTTONS.UNSUBSCRIBE })).not.toBeInTheDocument();
    });

    it("если пользователь подписан на всех - все кнопки «Вы подписаны»", () => {
      renderSimpleRecipeFeed({
        currentUserName: "Другой User",
        subscriptions: ["Анна Кулинарова", "Петр Поваров", "Мария Сладкоежкина"],
      });

      expect(getAllUnsubscribeButtons()).toHaveLength(3);
      expect(screen.queryByRole("button", { name: SUBSCRIPTION_BUTTONS.SUBSCRIBE })).not.toBeInTheDocument();
    });

    it("когда автор и текущий пользователь - одно лицо, кнопки подписки нет", () => {
      renderSimpleRecipeFeed({
        currentUserName: "Анна Кулинарова",
        subscriptions: ["Петр Поваров"],
      });

      const ownCard = getRecipeCardByAuthor("Анна Кулинарова");
      expect(within(ownCard).queryByRole("button", { name: /подписаться|вы подписаны/i })).not.toBeInTheDocument();

      expect(getUnsubscribeButtonForAuthor("Петр Поваров")).toBeInTheDocument();
      expect(getSubscribeButtonForAuthor("Мария Сладкоежкина")).toBeInTheDocument();
    });
  });
});
