import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";
import * as authApi from "../../src/api/auth";
import * as recipesApi from "../../src/api/recipes";
import * as followApi from "../../src/api/follow";
import * as accountApi from "../../src/api/account";

jest.mock("../../src/api/auth");
jest.mock("../../src/api/recipes");
jest.mock("../../src/api/follow");
jest.mock("../../src/api/account");

const mockedAuth = authApi as jest.Mocked<typeof authApi>;
const mockedRecipes = recipesApi as jest.Mocked<typeof recipesApi>;
const mockedFollow = followApi as jest.Mocked<typeof followApi>;
const mockedAccount = accountApi as jest.Mocked<typeof accountApi>;

const ACCESS_TOKEN_KEY = "cookbook_access_token";
const REFRESH_TOKEN_KEY = "cookbook_refresh_token";

const baseRecipes = [
  {
    id: 101,
    authorId: 10,
    title: "Паста карбонара",
    authorLogin: "AuthorA",
    imageData: null,
    createdAt: "2026-03-10T10:00:00.000Z",
    steps: [{ stepNo: 1, description: "Сварить пасту" }],
  },
  {
    id: 102,
    authorId: 11,
    title: "Салат с тунцом",
    authorLogin: "AuthorB",
    imageData: null,
    createdAt: "2026-03-11T10:00:00.000Z",
    steps: [{ stepNo: 1, description: "Смешать ингредиенты" }],
  },
];

function seedAuthorizedUser() {
  localStorage.setItem(ACCESS_TOKEN_KEY, "seed-token");
  localStorage.setItem(REFRESH_TOKEN_KEY, "seed-refresh");
  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      id: "1",
      login: "chef1",
      name: "Chef One",
      email: "chef1@mail.test",
      subscriptions: [],
    }),
  );
}

function setupHappyPath() {
  mockedAuth.getAccessToken.mockReturnValue("token");
  mockedRecipes.getAllRecipesApi.mockResolvedValue(baseRecipes as any);
  mockedFollow.getUserSubscriptionsApi.mockResolvedValue([]);
  mockedFollow.followUserApi.mockResolvedValue(undefined);
  mockedFollow.unfollowUserApi.mockResolvedValue(undefined);
  mockedAccount.updateAccountProfile.mockResolvedValue({
    id: 1,
    login: "Chef Pro",
    email: "chef1@mail.test",
  });
}

async function loginThroughUi() {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("you@example.com"), "chef1@mail.test");
  await user.type(screen.getByPlaceholderText("••••••••"), "secret1");
  await user.click(screen.getByRole("button", { name: "Войти" }));
  return user;
}

describe("App integration", () => {
  const OriginalImage = (global as any).Image;

  beforeAll(() => {
    (global as any).Image = class MockImage {
      public onload: ((this: any, ev: any) => any) | null = null;
      public onerror: ((this: any, ev: any) => any) | null = null;
      public width = 1920;
      public height = 1080;
      set src(_value: string) {
        setTimeout(() => this.onload?.(new Event("load")), 0);
      }
    };
  });

  afterAll(() => {
    (global as any).Image = OriginalImage;
  });

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    window.location.hash = "";

    if (!("createObjectURL" in URL)) {
      (URL as any).createObjectURL = jest.fn(() => "blob:mock");
    } else {
      jest.spyOn(URL, "createObjectURL").mockImplementation(() => "blob:mock");
    }
    if (!("revokeObjectURL" in URL)) {
      (URL as any).revokeObjectURL = jest.fn();
    }

    mockedAuth.getAccessToken.mockReturnValue(null);
    mockedAuth.loginRequest.mockResolvedValue({
      type: "Bearer",
      accessToken: "access-123",
      refreshToken: "refresh-123",
    });
    mockedAuth.registerRequest.mockResolvedValue(undefined);
    mockedAuth.fetchProfileByEmail.mockResolvedValue({
      id: 1,
      login: "chef1",
      email: "chef1@mail.test",
    });
    mockedAuth.saveTokens.mockImplementation((tokens) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    });
    mockedAuth.clearTokens.mockImplementation(() => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    });

    mockedRecipes.getAllRecipesApi.mockResolvedValue(baseRecipes as any);
    mockedRecipes.saveRecipeApi.mockResolvedValue({
      id: 999,
      authorId: 1,
      title: "Домашний бургер",
      authorLogin: "chef1",
      createdAt: "2026-03-15T10:00:00.000Z",
      steps: [{ stepNo: 1, description: "Собрать бургер" }],
    } as any);

    mockedFollow.getUserSubscriptionsApi.mockResolvedValue([]);
    mockedFollow.followUserApi.mockResolvedValue(undefined);
    mockedFollow.unfollowUserApi.mockResolvedValue(undefined);

    mockedAccount.updateAccountProfile.mockResolvedValue({
      id: 1,
      login: "Chef Pro",
      email: "chef1@mail.test",
    });

    jest.spyOn(window, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows auth page when there is no token", async () => {
    render(<App />);

    expect(await screen.findByText("Добро пожаловать в CookBook")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("logs in through UI and loads recipe feed", async () => {
    render(<App />);
    await loginThroughUi();

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    expect(screen.getByText("Салат с тунцом")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /chef1/i })).toBeInTheDocument();
    expect(mockedAuth.loginRequest).toHaveBeenCalledWith({
      email: "chef1@mail.test",
      password: "secret1",
    });
    expect(mockedRecipes.getAllRecipesApi).toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access-123");
  });

  it("restores authorized user from localStorage and filters by subscriptions", async () => {
    seedAuthorizedUser();
    setupHappyPath();
    mockedFollow.getUserSubscriptionsApi.mockResolvedValue(["AuthorA"]);

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Только подписки" }));

    expect(screen.getByText("Паста карбонара")).toBeInTheDocument();
    expect(screen.queryByText("Салат с тунцом")).not.toBeInTheDocument();
  });

  it("drops to auth page when saved currentUser is broken JSON", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, "seed-token");
    localStorage.setItem(REFRESH_TOKEN_KEY, "seed-refresh");
    localStorage.setItem("currentUser", "{bad json");
    mockedAuth.getAccessToken.mockReturnValue("token");

    render(<App />);

    expect(await screen.findByText("Добро пожаловать в CookBook")).toBeInTheDocument();
    expect(mockedAuth.clearTokens).toHaveBeenCalled();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("subscribes to an author from feed and shows it in subscriptions page", async () => {
    seedAuthorizedUser();
    setupHappyPath();

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    const card = screen.getByText("Паста карбонара").closest("div") as HTMLElement;
    await user.click(within(card).getByRole("button", { name: "Подписаться" }));

    await waitFor(() => {
      expect(mockedFollow.followUserApi).toHaveBeenCalledWith(1, 10);
    });

    expect(await screen.findByRole("button", { name: "Вы подписаны" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Подписки" }));
    expect(await screen.findByRole("button", { name: "AuthorA" })).toBeInTheDocument();
  });

  it("unsubscribes from subscriptions page and shows empty state", async () => {
    seedAuthorizedUser();
    setupHappyPath();
    mockedFollow.getUserSubscriptionsApi.mockResolvedValue(["AuthorA"]);

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Подписки" }));
    await user.click(screen.getByRole("button", { name: "Отписаться" }));

    await waitFor(() => {
      expect(mockedFollow.unfollowUserApi).toHaveBeenCalledWith(1, 10);
    });

    expect(await screen.findByText("У вас пока нет подписок")).toBeInTheDocument();
  });

  it("opens author page and then opens recipe details", async () => {
    seedAuthorizedUser();
    setupHappyPath();

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "AuthorA" }));

    expect(await screen.findByText("Рецепты автора")).toBeInTheDocument();
    expect(screen.queryByText("Салат с тунцом")).not.toBeInTheDocument();

    await user.click(screen.getByText("Паста карбонара"));
    expect(await screen.findByRole("heading", { name: "Паста карбонара" })).toBeInTheDocument();
    expect(screen.getByText("Сварить пасту")).toBeInTheDocument();
  });

  it("creates a new recipe and shows it on My recipes page", async () => {
    seedAuthorizedUser();
    setupHappyPath();

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Добавить рецепт/i }));
    await user.type(screen.getByPlaceholderText("Например: Паста Карбонара"), "Домашний бургер");
    await user.type(screen.getByPlaceholderText("Ингредиент 1"), "Булочка");
    await user.type(screen.getByPlaceholderText("Опишите этот шаг..."), "Собрать бургер");
    await user.click(screen.getByRole("button", { name: "Сохранить рецепт" }));

    await waitFor(() => {
      expect(mockedRecipes.saveRecipeApi).toHaveBeenCalled();
    });

    expect(await screen.findByText("Домашний бургер")).toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith("Рецепт успешно добавлен!");
  });

  it("updates profile settings and refreshes username in header", async () => {
    seedAuthorizedUser();
    setupHappyPath();

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Настройки" }));

    const loginInput = screen.getByLabelText("Имя пользователя");
    await user.clear(loginInput);
    await user.type(loginInput, "Chef Pro");
    await user.type(screen.getByLabelText("Текущий пароль"), "secret1");
    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    expect(await screen.findByText("Настройки успешно сохранены!")).toBeInTheDocument();
    expect(mockedAccount.updateAccountProfile).toHaveBeenCalledWith({
      id: 1,
      login: "Chef Pro",
      email: "chef1@mail.test",
      currentPassword: "secret1",
      newPassword: undefined,
    });
    expect(screen.getByRole("button", { name: /Chef Pro/i })).toBeInTheDocument();
  });

  it("shows an error message when recipe loading fails after auto-login", async () => {
    seedAuthorizedUser();
    mockedAuth.getAccessToken.mockReturnValue("token");
    mockedFollow.getUserSubscriptionsApi.mockResolvedValue([]);
    mockedRecipes.getAllRecipesApi.mockRejectedValue(new Error("boom"));

    render(<App />);

    expect(
      await screen.findByText("Произошла ошибка при загрузке рецептов. Повторите попытку позже."),
    ).toBeInTheDocument();
  });

  it("subscribes to two different authors and shows both on subscriptions page (FOLLOW-04)", async () => {
    seedAuthorizedUser();
    setupHappyPath();

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();

    const cardA = screen.getByText("Паста карбонара").closest("div") as HTMLElement;
    await user.click(within(cardA).getByRole("button", { name: "Подписаться" }));
    await waitFor(() => {
      expect(mockedFollow.followUserApi).toHaveBeenCalledWith(1, 10);
    });

    const cardB = screen.getByText("Салат с тунцом").closest("div") as HTMLElement;
    await user.click(within(cardB).getByRole("button", { name: "Подписаться" }));
    await waitFor(() => {
      expect(mockedFollow.followUserApi).toHaveBeenCalledWith(1, 11);
    });

    await user.click(screen.getByRole("button", { name: "Подписки" }));
    expect(await screen.findByRole("button", { name: "AuthorA" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "AuthorB" })).toBeInTheDocument();
  });

  it("does not call unfollow when there is no subscription and shows empty state (FOLLOW-05)", async () => {
    seedAuthorizedUser();
    setupHappyPath();
    mockedFollow.getUserSubscriptionsApi.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Подписки" }));

    expect(await screen.findByText("У вас пока нет подписок")).toBeInTheDocument();
    expect(mockedFollow.unfollowUserApi).not.toHaveBeenCalled();
  });

  it("shows empty recipes state when subscriptions filter is enabled but user has no subscriptions (RECIPE-08)", async () => {
    seedAuthorizedUser();
    setupHappyPath();
    mockedFollow.getUserSubscriptionsApi.mockResolvedValue([]);

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Только подписки" }));

    expect(await screen.findByText("Рецептов пока нет. Начните с добавления первого рецепта!")).toBeInTheDocument();
  });

  it("shows empty author recipes state when opening an author with no recipes (RECIPE-09)", async () => {
    seedAuthorizedUser();
    setupHappyPath();
    mockedFollow.getUserSubscriptionsApi.mockResolvedValue(["GhostAuthor"]);

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Подписки" }));
    await user.click(await screen.findByRole("button", { name: "GhostAuthor" }));

    expect(await screen.findByText("Рецепты автора")).toBeInTheDocument();
    expect(await screen.findByText("У этого автора пока нет рецептов.")).toBeInTheDocument();
  });

  it("registers a new user through UI and loads recipe feed (AUTH-01 UI)", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Добро пожаловать в CookBook")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Регистрация" }));

    await user.type(screen.getByPlaceholderText("Например, Анна"), "Chef New");
    await user.type(screen.getByPlaceholderText("you@example.com"), "newuser@mail.test");
    await user.type(screen.getByPlaceholderText("Минимум 6 символов"), "secret1");
    await user.type(screen.getByPlaceholderText("Ещё раз пароль"), "secret1");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    await waitFor(() => {
      expect(mockedAuth.registerRequest).toHaveBeenCalledWith({
        login: "Chef New",
        email: "newuser@mail.test",
        password: "secret1",
      });
    });

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    expect(mockedAuth.loginRequest).toHaveBeenCalledWith({
      email: "newuser@mail.test",
      password: "secret1",
    });
  });

  it("registers a new user and shows empty subscriptions page (FOLLOW-01)", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Добро пожаловать в CookBook")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Регистрация" }));

    await user.type(screen.getByPlaceholderText("Например, Анна"), "Chef New");
    await user.type(screen.getByPlaceholderText("you@example.com"), "newuser2@mail.test");
    await user.type(screen.getByPlaceholderText("Минимум 6 символов"), "secret1");
    await user.type(screen.getByPlaceholderText("Ещё раз пароль"), "secret1");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Подписки" }));
    expect(await screen.findByText("У вас пока нет подписок")).toBeInTheDocument();
  });

  it("creates a new recipe with two steps and step 2 image upload (RECIPE-01)", async () => {
    seedAuthorizedUser();
    setupHappyPath();
    mockedRecipes.saveRecipeApi.mockResolvedValue({
      id: 1000,
      authorId: 1,
      title: "Carbonara X",
      authorLogin: "chef1",
      createdAt: "2026-03-15T10:00:00.000Z",
      steps: [
        { id: 1, stepNo: 1, description: "Boil pasta", imageData: null },
        { id: 2, stepNo: 2, description: "Mix sauce", imageData: "base64img" },
      ],
      imageData: "base64main",
    } as any);

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Добавить рецепт/i }));

    await user.type(screen.getByPlaceholderText("Например: Паста Карбонара"), "Carbonara X");
    await user.type(screen.getByPlaceholderText("Ингредиент 1"), "Pasta");

    const stepTextareas = screen.getAllByPlaceholderText("Опишите этот шаг...");
    await user.type(stepTextareas[0], "Boil pasta");

    await user.click(screen.getByRole("button", { name: "Добавить шаг" }));

    const stepTextareasAfter = screen.getAllByPlaceholderText("Опишите этот шаг...");
    await user.type(stepTextareasAfter[1], "Mix sauce");

    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
    const fileInput = fileInputs[fileInputs.length - 1];
    const imageFile = new File([new Uint8Array([1, 2, 3])], "step2.png", { type: "image/png" });
    await user.upload(fileInput, imageFile);

    await user.click(screen.getByRole("button", { name: "Сохранить рецепт" }));

    await waitFor(() => {
      expect(mockedRecipes.saveRecipeApi).toHaveBeenCalled();
    });

    const saveArg = mockedRecipes.saveRecipeApi.mock.calls[0]?.[0] as any;
    expect(saveArg.title).toBe("Carbonara X");
    expect(Array.isArray(saveArg.steps)).toBe(true);
    expect(saveArg.steps).toHaveLength(2);
    expect(saveArg.steps[0]).toEqual(
      expect.objectContaining({
        stepNo: 1,
        description: "Boil pasta",
        imageData: undefined,
      }),
    );
    expect(saveArg.steps[1]).toEqual(
      expect.objectContaining({
        stepNo: 2,
        description: "Mix sauce",
        imageData: expect.any(String),
      }),
    );

    expect(await screen.findByText("Carbonara X")).toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith("Рецепт успешно добавлен!");
  });

  it("shows empty recipe feed state when backend returns no recipes (RECIPE-03)", async () => {
    seedAuthorizedUser();
    mockedAuth.getAccessToken.mockReturnValue("token");
    mockedFollow.getUserSubscriptionsApi.mockResolvedValue([]);
    mockedRecipes.getAllRecipesApi.mockResolvedValue([] as any);

    render(<App />);

    expect(await screen.findByText("Рецептов пока нет. Начните с добавления первого рецепта!")).toBeInTheDocument();
  });

  it("shows registration error when backend rejects register request", async () => {
    mockedAuth.registerRequest.mockRejectedValue(new Error("duplicate"));

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Добро пожаловать в CookBook")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Регистрация" }));

    await user.type(screen.getByPlaceholderText("Например, Анна"), "Chef New");
    await user.type(screen.getByPlaceholderText("you@example.com"), "dup@mail.test");
    await user.type(screen.getByPlaceholderText("Минимум 6 символов"), "secret1");
    await user.type(screen.getByPlaceholderText("Ещё раз пароль"), "secret1");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    expect(
      await screen.findByText("Ошибка при регистрации. Возможно, пользователь с таким email уже существует."),
    ).toBeInTheDocument();
    expect(mockedAuth.loginRequest).not.toHaveBeenCalled();
  });

  it("shows validation error when trying to save recipe without any steps", async () => {
    seedAuthorizedUser();
    setupHappyPath();

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Паста карбонара")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Добавить рецепт/i }));

    await user.type(screen.getByPlaceholderText("Например: Паста Карбонара"), "No steps recipe");
    await user.type(screen.getByPlaceholderText("Ингредиент 1"), "Ingredient");

    const stepTextareas = screen.getAllByPlaceholderText("Опишите этот шаг...");
    await user.clear(stepTextareas[0]);

    await user.click(screen.getByRole("button", { name: "Сохранить рецепт" }));

    expect(await screen.findByText("Добавьте хотя бы один шаг приготовления")).toBeInTheDocument();
    expect(mockedRecipes.saveRecipeApi).not.toHaveBeenCalled();
  });
});
