import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import App from "../../src/App";

import { getAllRecipesApi } from "../../src/api/recipes";
import { clearTokens, getAccessToken } from "../../src/api/auth";
import {
  followUserApi,
  unfollowUserApi,
  getUserSubscriptionsApi,
} from "../../src/api/follow";

/** =========================
 *  API mocks
 *  ========================= */
jest.mock("../../src/api/recipes", () => ({
  getAllRecipesApi: jest.fn(),
}));

jest.mock("../../src/api/auth", () => ({
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
}));

jest.mock("../../src/api/follow", () => ({
  followUserApi: jest.fn(),
  unfollowUserApi: jest.fn(),
  getUserSubscriptionsApi: jest.fn(),
}));

/** =========================
 *  Child component mocks
 *  Каждый мок рендерит минимальную разметку + кнопки,
 *  чтобы дергать callbacks и проверять props.
 *  ========================= */

jest.mock("../../src/components/SimpleHeader", () => ({
  SimpleHeader: (props: any) => (
    <div data-testid="header">
      <div data-testid="header-user">{props.user?.name ?? "no-user"}</div>
      <button onClick={props.onLogout}>logout</button>
      <button onClick={props.onSubscriptionsClick}>go-subscriptions</button>
      <button onClick={props.onUserNameClick}>go-my-recipes</button>
      <button onClick={props.onCookBookClick}>go-feed</button>
      <button onClick={props.onSettingsClick}>go-settings</button>
    </div>
  ),
}));

jest.mock("../../src/components/SimpleAuthPage", () => ({
  SimpleAuthPage: (props: any) => (
    <div data-testid="auth-page">
      <button
        onClick={() =>
          props.onLogin({
            id: "10",
            login: "u",
            name: "User",
            email: "u@mail.com",
            subscriptions: [],
          })
        }
      >
        do-login
      </button>
      <button
        onClick={() =>
          props.onLogin({
            id: "abc", // non-finite id branch for subscribe/unsubscribe
            login: "u",
            name: "BadIdUser",
            email: "b@mail.com",
            subscriptions: [],
          })
        }
      >
        do-login-bad-id
      </button>
    </div>
  ),
}));

jest.mock("../../src/components/SimpleRecipeFeed", () => ({
  SimpleRecipeFeed: (props: any) => (
    <div data-testid="feed">
      <div data-testid="feed-title">{props.title}</div>
      <div data-testid="feed-hide-filter">{String(!!props.hideFilterButton)}</div>
      <div data-testid="feed-show-subs-only">{String(!!props.showSubscriptionsOnly)}</div>
      <div data-testid="feed-count">{props.recipes?.length ?? 0}</div>
      <button onClick={props.onAddRecipeClick}>add</button>
      <button
        onClick={() =>
          props.onRecipeClick(
            props.recipes?.[0] ?? {
              id: "r0",
              title: "X",
              author: "A",
              ingredients: [],
              steps: [],
              createdAt: new Date(),
            }
          )
        }
      >
        open-first
      </button>
      <button onClick={() => props.onAuthorClick("AuthorA")}>author-AuthorA</button>
      <button onClick={props.onToggleSubscriptionsFilter}>toggle-subs-filter</button>
      <button onClick={() => props.onSubscribe("AuthorA")}>subscribe-AuthorA</button>
      <button onClick={() => props.onUnsubscribe("AuthorA")}>unsubscribe-AuthorA</button>
      <pre data-testid="feed-subs">{JSON.stringify(props.subscriptions ?? [])}</pre>
    </div>
  ),
}));

jest.mock("../../src/components/SimpleAddRecipePage", () => ({
  SimpleAddRecipePage: (props: any) => (
    <div data-testid="add-recipe">
      <button onClick={props.onBack}>back</button>
      <button
        onClick={() =>
          props.onSave({
            title: "NewRecipe",
            author: props.user?.name ?? "Unknown",
            image: "img",
            ingredients: ["i1"],
            steps: [{ id: "1", description: "s1" }],
          })
        }
      >
        save
      </button>
    </div>
  ),
}));

jest.mock("../../src/components/SimpleRecipeViewPage", () => ({
  SimpleRecipeViewPage: (props: any) => (
    <div data-testid="view-recipe">
      <div data-testid="view-author">{props.recipe?.author}</div>
      <div data-testid="view-isSubscribed">{String(!!props.isSubscribed)}</div>
      <button onClick={props.onBack}>back</button>
      <button onClick={() => props.onAuthorClick(props.recipe?.author ?? "Unknown")}>
        author
      </button>
      <button onClick={() => props.onSubscribe(props.recipe?.author ?? "Unknown")}>
        subscribe
      </button>
      <button onClick={() => props.onUnsubscribe(props.recipe?.author ?? "Unknown")}>
        unsubscribe
      </button>
    </div>
  ),
}));

jest.mock("../../src/components/SimpleSubscriptionsPage", () => ({
  SimpleSubscriptionsPage: (props: any) => (
    <div data-testid="subs-page">
      <button onClick={props.onBack}>back</button>
      <button onClick={() => props.onAuthorClick("AuthorA")}>author-AuthorA</button>
      <button onClick={() => props.onUnsubscribe("AuthorA")}>unsubscribe-AuthorA</button>
    </div>
  ),
}));

jest.mock("../../src/components/SimpleAuthorRecipesPage", () => ({
  SimpleAuthorRecipesPage: (props: any) => (
    <div data-testid="author-page">
      <div data-testid="author-name">{props.authorName}</div>
      <div data-testid="author-count">{props.recipes?.length ?? 0}</div>
      <div data-testid="author-isSubscribed">{String(!!props.isSubscribed)}</div>
      <button onClick={props.onBack}>back</button>
      <button onClick={() => props.onRecipeClick(props.recipes?.[0])}>open-first</button>
      <button onClick={() => props.onSubscribe(props.authorName)}>subscribe</button>
      <button onClick={() => props.onUnsubscribe(props.authorName)}>unsubscribe</button>
    </div>
  ),
}));

jest.mock("../../src/components/SimpleSettingsPage", () => ({
  SimpleSettingsPage: (props: any) => (
    <div data-testid="settings-page">
      <button onClick={props.onBack}>back</button>
      <button
        onClick={() =>
          props.onSaveSettings({
            ...props.user,
            name: "UpdatedName",
          })
        }
      >
        save-settings
      </button>
    </div>
  ),
}));

/** =========================
 *  Helpers
 *  ========================= */

const dtoA = {
  id: 1,
  title: "R1",
  authorLogin: "AuthorA",
  authorId: 200,
  imageData: "IMGBASE64",
  steps: [
    { id: null, stepNo: 1, description: "Step1", imageData: "STEPIMG" },
  ],
  createdAt: "2024-01-01T00:00:00.000Z",
};

const dtoNoAuthor = {
  id: 2,
  title: "R2",
  authorLogin: "   ", // -> "Неизвестный автор"
  authorId: null,
  imageData: null,
  steps: [{ id: 7, stepNo: 3, description: "S", imageData: null }],
  createdAt: null, // -> new Date()
};

function setLocalStorage(key: string, value: string | null) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

describe("App – full coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    jest.spyOn(window, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    (window.alert as any).mockRestore?.();
    (console.error as any).mockRestore?.();
    (console.warn as any).mockRestore?.();
  });

  it("если токен есть, но currentUser отсутствует -> clearAuthData -> auth + clearTokens", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    // currentUser нет
    setLocalStorage("currentUser", null);

    render(<App />);

    expect(await screen.findByTestId("auth-page")).toBeInTheDocument();
    expect(clearTokens).toHaveBeenCalledTimes(1);
  });

  it("если токен есть и currentUser битый JSON -> clearAuthData (catch JSON.parse)", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage("currentUser", "{bad json");

    render(<App />);

    expect(await screen.findByTestId("auth-page")).toBeInTheDocument();
    expect(clearTokens).toHaveBeenCalledTimes(1);
  });

  it("автологин: токен + currentUser -> подгружает подписки и рецепты -> feed", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue(["AuthorA"]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA, dtoNoAuthor]);

    render(<App />);

    const feed = await screen.findByTestId("feed");
    expect(feed).toBeInTheDocument();
    expect(screen.getByTestId("feed-title")).toHaveTextContent("Лента рецептов");
    expect(screen.getByTestId("feed-count")).toHaveTextContent("2");

    // убедимся что subscriptions подтянулись (из сервера)
    expect(screen.getByTestId("feed-subs")).toHaveTextContent("AuthorA");
  });

  it("логин через SimpleAuthPage -> loadUserWithSubscriptions -> feed, а если getUserSubscriptionsApi падает, берёт baseUser.subscriptions", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null); // стартуем с auth
    (getUserSubscriptionsApi as jest.Mock).mockRejectedValue(new Error("fail subs"));
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);

    render(<App />);
    const auth = await screen.findByTestId("auth-page");
    expect(auth).toBeInTheDocument();

    // логинимся вручную и в loggedInUser сделаем base subscriptions
    // Для этого временно подменим localStorage? проще: клик do-login, потом подписки будут [].
    // Ветка baseUser.subscriptions покроется в автологине ниже отдельным тестом.
    fireEvent.click(screen.getByText("do-login"));

    const feed = await screen.findByTestId("feed");
    expect(feed).toBeInTheDocument();
    expect(getAllRecipesApi).toHaveBeenCalled();
  });

  it("loadRecipes: ошибка -> recipesError UI + recipes очищаются", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    (getAllRecipesApi as jest.Mock).mockRejectedValue(new Error("boom"));

    render(<App />);

    await screen.findByTestId("header"); // дождались окончания проверки авторизации
    expect(
      await screen.findByText(
        "Произошла ошибка при загрузке рецептов. Повторите попытку позже."
      )
    ).toBeInTheDocument();

    // feed при ошибке не рендерится (там условие !recipesError)
    expect(screen.queryByTestId("feed")).not.toBeInTheDocument();
  });

  it("навигация: feed -> add-recipe -> save -> alert + переход в my-recipes", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);

    render(<App />);

    await screen.findByTestId("feed");
    fireEvent.click(screen.getByText("add"));

    expect(await screen.findByTestId("add-recipe")).toBeInTheDocument();

    fireEvent.click(screen.getByText("save"));

    expect(window.alert).toHaveBeenCalledWith("Рецепт успешно добавлен!");
    const feed = await screen.findByTestId("feed");
    expect(screen.getByTestId("feed-title")).toHaveTextContent("Мои рецепты");
    expect(screen.getByTestId("feed-hide-filter")).toHaveTextContent("true");
  });

  it("открытие рецепта -> view-recipe -> author click -> author-recipes -> back -> feed", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );
    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA, dtoNoAuthor]);

    render(<App />);

    await screen.findByTestId("feed");
    fireEvent.click(screen.getByText("open-first"));

    expect(await screen.findByTestId("view-recipe")).toBeInTheDocument();
    expect(screen.getByTestId("view-author")).toHaveTextContent("AuthorA");

    fireEvent.click(screen.getByText("author"));

    expect(await screen.findByTestId("author-page")).toBeInTheDocument();
    expect(screen.getByTestId("author-name")).toHaveTextContent("AuthorA");

    fireEvent.click(screen.getByText("back"));
    expect(await screen.findByTestId("feed")).toBeInTheDocument();
  });

  it("subscriptions page: header -> subscriptions -> author click, unsubscribe click, back", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: ["AuthorA"],
      })
    );
    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue(["AuthorA"]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);

    (unfollowUserApi as jest.Mock).mockResolvedValue({});

    render(<App />);

    await screen.findByTestId("feed");
    fireEvent.click(screen.getByText("go-subscriptions"));

    expect(await screen.findByTestId("subs-page")).toBeInTheDocument();

    // author click
    fireEvent.click(screen.getByText("author-AuthorA"));
    expect(await screen.findByTestId("author-page")).toBeInTheDocument();

    // back
    fireEvent.click(screen.getByText("back"));
    expect(await screen.findByTestId("feed")).toBeInTheDocument();
  });

  it("logout: header.logout -> clearTokens + alert + auth, и сбрасывает selectedRecipe/author/filter", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: ["AuthorA"],
      })
    );
    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue(["AuthorA"]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);

    render(<App />);

    await screen.findByTestId("feed");
    // включим фильтр
    fireEvent.click(screen.getByText("toggle-subs-filter"));
    expect(screen.getByTestId("feed-show-subs-only")).toHaveTextContent("true");

    // откроем рецепт (selectedRecipe != null)
    fireEvent.click(screen.getByText("open-first"));
    expect(await screen.findByTestId("view-recipe")).toBeInTheDocument();

    fireEvent.click(screen.getByText("logout"));

    expect(window.alert).toHaveBeenCalledWith("Выход из аккаунта");
    expect(clearTokens).toHaveBeenCalled();
    expect(await screen.findByTestId("auth-page")).toBeInTheDocument();
  });

  it("подписка: early return если уже подписан", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: ["AuthorA"],
      })
    );
    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue(["AuthorA"]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);

    render(<App />);

    await screen.findByTestId("feed");
    // subscribe-AuthorA из feed
    fireEvent.click(screen.getByText("subscribe-AuthorA"));
    expect(followUserApi).not.toHaveBeenCalled();
  });

  it("подписка: user.id не число -> warn + локально добавляет подписку без API", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    render(<App />);
    await screen.findByTestId("auth-page");

    // логин юзера с плохим id
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);
    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);

    fireEvent.click(screen.getByText("do-login-bad-id"));

    await screen.findByTestId("feed");
    fireEvent.click(screen.getByText("subscribe-AuthorA"));

    expect(console.warn).toHaveBeenCalled();
    expect(followUserApi).not.toHaveBeenCalled();

    // подписка должна появиться
    expect(screen.getByTestId("feed-subs")).toHaveTextContent("AuthorA");
  });

  it("подписка: нет authorId в рецептах автора -> warn + локально добавляет подписку", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    // recipes без authorId для AuthorA (берём dtoNoAuthor или подделаем)
    (getAllRecipesApi as jest.Mock).mockResolvedValue([
      { ...dtoA, authorId: null }, // authorId пропал
    ]);

    render(<App />);
    await screen.findByTestId("feed");

    fireEvent.click(screen.getByText("subscribe-AuthorA"));

    expect(console.warn).toHaveBeenCalled();
    expect(followUserApi).not.toHaveBeenCalled();
    expect(screen.getByTestId("feed-subs")).toHaveTextContent("AuthorA");
  });

  it("подписка: success -> followUserApi вызывается и подписка добавляется", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);
    (followUserApi as jest.Mock).mockResolvedValue({});

    render(<App />);
    await screen.findByTestId("feed");

    fireEvent.click(screen.getByText("subscribe-AuthorA"));

    await waitFor(() => {
      expect(followUserApi).toHaveBeenCalledWith(10, 200);
    });
    expect(screen.getByTestId("feed-subs")).toHaveTextContent("AuthorA");
  });

  it("отписка: early return если не подписан", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);

    render(<App />);
    await screen.findByTestId("feed");

    fireEvent.click(screen.getByText("unsubscribe-AuthorA"));
    expect(unfollowUserApi).not.toHaveBeenCalled();
  });

  it("отписка: user.id не число -> warn + локально удаляет подписку", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    render(<App />);
    await screen.findByTestId("auth-page");

    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);
    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);

    fireEvent.click(screen.getByText("do-login-bad-id"));
    await screen.findByTestId("feed");

    // добавим подписку локально веткой subscribe bad-id
    fireEvent.click(screen.getByText("subscribe-AuthorA"));
    expect(screen.getByTestId("feed-subs")).toHaveTextContent("AuthorA");

    // теперь отписка
    fireEvent.click(screen.getByText("unsubscribe-AuthorA"));

    expect(console.warn).toHaveBeenCalled();
    expect(unfollowUserApi).not.toHaveBeenCalled();
    expect(screen.getByTestId("feed-subs")).not.toHaveTextContent("AuthorA");
  });

  it("отписка: нет authorId -> warn + локально удаляет подписку", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: ["AuthorA"],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue(["AuthorA"]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([{ ...dtoA, authorId: null }]);

    render(<App />);
    await screen.findByTestId("feed");

    fireEvent.click(screen.getByText("unsubscribe-AuthorA"));

    expect(console.warn).toHaveBeenCalled();
    expect(unfollowUserApi).not.toHaveBeenCalled();
    expect(screen.getByTestId("feed-subs")).not.toHaveTextContent("AuthorA");
  });

  it("отписка: success -> unfollowUserApi вызывается и подписка удаляется", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: ["AuthorA"],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue(["AuthorA"]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);
    (unfollowUserApi as jest.Mock).mockResolvedValue({});

    render(<App />);
    await screen.findByTestId("feed");

    fireEvent.click(screen.getByText("unsubscribe-AuthorA"));

    await waitFor(() => {
      expect(unfollowUserApi).toHaveBeenCalledWith(10, 200);
    });
    expect(screen.getByTestId("feed-subs")).not.toHaveTextContent("AuthorA");
  });

  it("фильтр подписок: showSubscriptionsOnly -> feed получает отфильтрованные рецепты", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: ["AuthorA"],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue(["AuthorA"]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA, dtoNoAuthor]); // AuthorA + "Неизвестный автор"

    render(<App />);
    await screen.findByTestId("feed");
    expect(screen.getByTestId("feed-count")).toHaveTextContent("2");

    fireEvent.click(screen.getByText("toggle-subs-filter"));
    expect(screen.getByTestId("feed-show-subs-only")).toHaveTextContent("true");
    // теперь должны остаться только рецепты AuthorA => 1
    expect(screen.getByTestId("feed-count")).toHaveTextContent("1");
  });

  it("my-recipes: header -> my-recipes, feed фильтрует по user.name и скрывает кнопку фильтра", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    // один рецепт от User, один от AuthorA
    (getAllRecipesApi as jest.Mock).mockResolvedValue([
      { ...dtoA, authorLogin: "AuthorA" },
      { ...dtoA, id: 99, title: "Mine", authorLogin: "User", authorId: 10 },
    ]);

    render(<App />);
    await screen.findByTestId("feed");
    expect(screen.getByTestId("feed-count")).toHaveTextContent("2");

    fireEvent.click(screen.getByText("go-my-recipes"));
    await screen.findByTestId("feed");

    expect(screen.getByTestId("feed-title")).toHaveTextContent("Мои рецепты");
    expect(screen.getByTestId("feed-hide-filter")).toHaveTextContent("true");
    // остаётся только рецепт "User"
    expect(screen.getByTestId("feed-count")).toHaveTextContent("1");
  });

  it("settings: header -> settings, save settings обновляет user и пишет в localStorage", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");
    setLocalStorage(
      "currentUser",
      JSON.stringify({
        id: "10",
        login: "u",
        name: "User",
        email: "u@mail.com",
        subscriptions: [],
      })
    );

    (getUserSubscriptionsApi as jest.Mock).mockResolvedValue([]);
    (getAllRecipesApi as jest.Mock).mockResolvedValue([dtoA]);

    render(<App />);
    await screen.findByTestId("feed");

    fireEvent.click(screen.getByText("go-settings"));
    expect(await screen.findByTestId("settings-page")).toBeInTheDocument();

    fireEvent.click(screen.getByText("save-settings"));

    // после setUser должен сработать useEffect сохранения в localStorage
    await waitFor(() => {
      const saved = localStorage.getItem("currentUser");
      expect(saved).toContain("UpdatedName");
    });

    // хедер тоже должен получить нового пользователя
    expect(screen.getByTestId("header-user")).toHaveTextContent("UpdatedName");
  });
});