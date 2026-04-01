import "@testing-library/jest-dom";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderSimpleSubscriptionsPage, mockUser } from "./testUtils";

describe("SimpleSubscriptionsPage", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    user = userEvent.setup();
  });

  const getBackButton = () => screen.getByRole("button", { name: /назад/i });
  const getTitle = () => screen.getByRole("heading", { name: /мои подписки/i });
  const getEmptyMessage = () => screen.queryByText(/у вас пока нет подписок/i);
  const getEmptySubtext = () => screen.queryByText(/подпишитесь на авторов/i);
  const getSubscriptionCards = () => screen.queryAllByRole("button", { name: /отписаться/i });

  const getSubscriptionCard = (authorName: string) => {
    const authorButton = screen.getByRole("button", { name: authorName });
    return authorButton.closest("div[class*='flex items-center justify-between']") as HTMLElement;
  };

  const getUnsubscribeButton = (authorName: string) => {
    const card = getSubscriptionCard(authorName);
    return within(card).getByRole("button", { name: /отписаться/i });
  };

  const getAuthorButton = (authorName: string) => screen.getByRole("button", { name: authorName });

  const getAvatarLetter = (authorName: string) => {
    const card = getSubscriptionCard(authorName);
    return within(card).getByText(authorName.charAt(0).toUpperCase());
  };

  describe("Что отображается на странице", () => {
    it("показывает заголовок «Мои подписки»", () => {
      renderSimpleSubscriptionsPage();
      expect(getTitle()).toBeInTheDocument();
    });

    it("показывает кнопку «Назад»", () => {
      renderSimpleSubscriptionsPage();
      expect(getBackButton()).toBeInTheDocument();
    });

    it("показывает сообщение «У вас пока нет подписок», если пользователь ни на кого не подписан", () => {
      const userWithoutSubs = { ...mockUser, subscriptions: [] };
      renderSimpleSubscriptionsPage({ user: userWithoutSubs });

      expect(getEmptyMessage()).toBeInTheDocument();
      expect(getEmptySubtext()).toBeInTheDocument();
      expect(getSubscriptionCards()).toHaveLength(0);
    });

    it("НЕ показывает сообщение «У вас пока нет подписок», если у пользователя есть подписки", () => {
      renderSimpleSubscriptionsPage();

      expect(getEmptyMessage()).not.toBeInTheDocument();
      expect(getEmptySubtext()).not.toBeInTheDocument();
    });
  });

  describe("Как отображаются подписки", () => {
    it("показывает всех авторов, на которых подписан пользователь", () => {
      renderSimpleSubscriptionsPage();

      mockUser.subscriptions.forEach((authorName) => {
        expect(screen.getByText(authorName)).toBeInTheDocument();
      });
      expect(getSubscriptionCards()).toHaveLength(mockUser.subscriptions.length);
    });

    it("рядом с каждым автором показывает кружок с первой буквой его имени", () => {
      renderSimpleSubscriptionsPage();

      mockUser.subscriptions.forEach((authorName) => {
        const firstLetter = authorName.charAt(0).toUpperCase();
        expect(getAvatarLetter(authorName)).toHaveTextContent(firstLetter);
        expect(getAvatarLetter(authorName)).toHaveClass("text-orange-600");
      });
    });

    it("рядом с каждым автором есть красная кнопка «Отписаться»", () => {
      renderSimpleSubscriptionsPage();

      mockUser.subscriptions.forEach((authorName) => {
        const unsubscribeButton = getUnsubscribeButton(authorName);
        expect(unsubscribeButton).toBeInTheDocument();
        expect(unsubscribeButton).toHaveClass("bg-red-500", "hover:bg-red-600");
      });
    });
  });

  describe("Что происходит при кликах", () => {
    it("при клике на кнопку «Назад» вызывается функция onBack", async () => {
      const onBack = jest.fn();
      renderSimpleSubscriptionsPage({ onBack });

      await user.click(getBackButton());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("при клике на имя автора вызывается функция onAuthorClick", async () => {
      const onAuthorClick = jest.fn();
      renderSimpleSubscriptionsPage({ onAuthorClick });

      const authorName = mockUser.subscriptions[0];
      await user.click(getAuthorButton(authorName));

      expect(onAuthorClick).toHaveBeenCalledWith(authorName);
      expect(onAuthorClick).toHaveBeenCalledTimes(1);
    });

    it("при клике на кнопку «Отписаться» вызывается функция onUnsubscribe", async () => {
      const onUnsubscribe = jest.fn();
      renderSimpleSubscriptionsPage({ onUnsubscribe });

      const authorName = mockUser.subscriptions[0];
      await user.click(getUnsubscribeButton(authorName));

      expect(onUnsubscribe).toHaveBeenCalledWith(authorName);
      expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it("можно отписаться от разных авторов - каждый раз вызывается onUnsubscribe", async () => {
      const onUnsubscribe = jest.fn();
      renderSimpleSubscriptionsPage({ onUnsubscribe });

      await user.click(getUnsubscribeButton(mockUser.subscriptions[0]));
      expect(onUnsubscribe).toHaveBeenCalledWith(mockUser.subscriptions[0]);

      await user.click(getUnsubscribeButton(mockUser.subscriptions[1]));
      expect(onUnsubscribe).toHaveBeenCalledWith(mockUser.subscriptions[1]);

      expect(onUnsubscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe("Как компонент обрабатывает разные форматы данных от сервера", () => {
    it("если не пришли подписки - показывает сообщение, что подписок нет", () => {
      const userWithoutSubs = { ...mockUser, subscriptions: undefined as any };
      renderSimpleSubscriptionsPage({ user: userWithoutSubs });

      expect(getEmptyMessage()).toBeInTheDocument();
    });

    it("если от сервера пришли не массивом, а чем-то другим - показывает сообщение, что подписок нет", () => {
      const userWithInvalidSubs = { ...mockUser, subscriptions: "это не массив" as any };
      renderSimpleSubscriptionsPage({ user: userWithInvalidSubs });

      expect(getEmptyMessage()).toBeInTheDocument();
    });

    it("если в подписках пришли строки с пробелами - убирает лишние пробелы", () => {
      const userWithStringSubs = {
        ...mockUser,
        subscriptions: ["  Анна  ", "Петр", "  "],
      };
      renderSimpleSubscriptionsPage({ user: userWithStringSubs as any });

      expect(screen.getByText("Анна")).toBeInTheDocument();
      expect(screen.getByText("Петр")).toBeInTheDocument();
      expect(screen.queryByText("  ")).not.toBeInTheDocument();
      expect(getSubscriptionCards()).toHaveLength(2);
    });

    it("если в подписках пришли объекты с разными полями - показывает то, что смог найти", () => {
      const userWithObjectSubs = {
        ...mockUser,
        subscriptions: [
          { login: "ivan_login" },
          { name: "petr_name" },
          { authorName: "maria_author" },
          { email: "anna@mail.com" },
          { id: 123 },
        ],
      };
      renderSimpleSubscriptionsPage({ user: userWithObjectSubs as any });

      expect(screen.getByText("ivan_login")).toBeInTheDocument();
      expect(screen.getByText("petr_name")).toBeInTheDocument();
      expect(screen.getByText("maria_author")).toBeInTheDocument();
      expect(screen.getByText("anna@mail.com")).toBeInTheDocument();
      expect(screen.getByText("123")).toBeInTheDocument();
      expect(getSubscriptionCards()).toHaveLength(5);
    });
  });

  describe("Разные жизненные ситуации", () => {
    it("пользователь подписан только на одного автора - показывает одну подписку", () => {
      const userWithOneSub = {
        ...mockUser,
        subscriptions: ["Анна"],
      };
      renderSimpleSubscriptionsPage({ user: userWithOneSub });

      expect(screen.getByText("Анна")).toBeInTheDocument();
      expect(getSubscriptionCards()).toHaveLength(1);
    });

    it("пользователь подписан на 10 авторов - показывает все 10 подписок", () => {
      const longSubscriptions = Array.from({ length: 10 }, (_, i) => `Автор ${i + 1}`);
      const userWithLongSubs = {
        ...mockUser,
        subscriptions: longSubscriptions,
      };
      renderSimpleSubscriptionsPage({ user: userWithLongSubs });

      longSubscriptions.forEach((name) => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
      expect(getSubscriptionCards()).toHaveLength(10);
    });

    it("имена могут быть написаны в любом регистре - в кружке всегда показывает заглавную букву", () => {
      const userWithMixedCase = {
        ...mockUser,
        subscriptions: ["анна", "ПЁТР", "MaRiA"],
      };
      renderSimpleSubscriptionsPage({ user: userWithMixedCase });

      expect(getAvatarLetter("анна")).toHaveTextContent("А");
      expect(getAvatarLetter("ПЁТР")).toHaveTextContent("П");
      expect(getAvatarLetter("MaRiA")).toHaveTextContent("M");
    });
  });

  describe("Сложные сценарии", () => {
    it("можно отписаться от нескольких авторов и кликнуть на имя - все функции вызываются правильно", async () => {
      const onUnsubscribe = jest.fn();
      const onAuthorClick = jest.fn();

      renderSimpleSubscriptionsPage({
        onUnsubscribe,
        onAuthorClick,
      });

      expect(getSubscriptionCards()).toHaveLength(mockUser.subscriptions.length);

      await user.click(getUnsubscribeButton(mockUser.subscriptions[0]));
      expect(onUnsubscribe).toHaveBeenCalledWith(mockUser.subscriptions[0]);

      await user.click(getUnsubscribeButton(mockUser.subscriptions[1]));
      expect(onUnsubscribe).toHaveBeenCalledWith(mockUser.subscriptions[1]);

      await user.click(getAuthorButton(mockUser.subscriptions[0]));
      expect(onAuthorClick).toHaveBeenCalledWith(mockUser.subscriptions[0]);

      expect(onUnsubscribe).toHaveBeenCalledTimes(2);
      expect(onAuthorClick).toHaveBeenCalledTimes(1);
    });

    it("можно вернуться назад по кнопке «Назад»", async () => {
      const onBack = jest.fn();

      renderSimpleSubscriptionsPage({ onBack });

      await user.click(getBackButton());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("можно отписаться от всех авторов по очереди", async () => {
      const onUnsubscribe = jest.fn();

      renderSimpleSubscriptionsPage({ onUnsubscribe });

      for (const author of mockUser.subscriptions) {
        await user.click(getUnsubscribeButton(author));
        expect(onUnsubscribe).toHaveBeenCalledWith(author);
      }

      expect(onUnsubscribe).toHaveBeenCalledTimes(mockUser.subscriptions.length);
    });
  });
});
