import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SimpleAuthPage } from "../../src/components/SimpleAuthPage";

import * as authApi from "../../src/api/auth";

import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

jest.mock("../../src/api/auth", () => ({
        loginRequest: jest.fn(),
        registerRequest: jest.fn(),
        saveTokens: jest.fn(),
        fetchProfileByEmail: jest.fn(),
}));

describe("SimpleAuthPage – production suite", () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs in successfully", async () => {
    (authApi.loginRequest as jest.Mock).mockResolvedValue({ access: "a", refresh: "r" });
    (authApi.fetchProfileByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      login: "test",
      name: "Test",
      email: "test@mail.com",
    });

    render(<SimpleAuthPage onLogin={mockOnLogin} />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "test@mail.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "123456");

    fireEvent.click(screen.getByText("Войти"));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  it("shows login error on failure", async () => {
    (authApi.loginRequest as jest.Mock).mockRejectedValue(new Error("fail"));

    render(<SimpleAuthPage onLogin={mockOnLogin} />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "test@mail.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "123456");

    fireEvent.click(screen.getByText("Войти"));

    await waitFor(() => {
      expect(screen.getByText(/Не удалось войти/i)).toBeInTheDocument();
    });
  });

  it("alerts when login fields empty", async () => {
    window.alert = jest.fn();

    render(<SimpleAuthPage onLogin={mockOnLogin} />);

    fireEvent.click(screen.getByText("Войти"));

    expect(window.alert).toHaveBeenCalledWith("Заполните все поля");
  });

  it("switches to register mode", async () => {
    render(<SimpleAuthPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText("Регистрация"));

    expect(screen.getByText("Создайте новый аккаунт")).toBeInTheDocument();
  });

  it("registers successfully", async () => {
    (authApi.registerRequest as jest.Mock).mockResolvedValue({});
    (authApi.loginRequest as jest.Mock).mockResolvedValue({ access: "a" });
    (authApi.fetchProfileByEmail as jest.Mock).mockResolvedValue({
      id: 2,
      login: "user",
      name: "",
      email: "user@mail.com",
    });

    render(<SimpleAuthPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText("Регистрация"));

    await userEvent.type(screen.getByPlaceholderText("Например, Анна"), "Anna");
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@mail.com");
    await userEvent.type(screen.getByPlaceholderText("Минимум 6 символов"), "123456");
    await userEvent.type(screen.getByPlaceholderText("Ещё раз пароль"), "123456");

    fireEvent.click(screen.getByText("Зарегистрироваться"));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalled();
    });
  });

  it("validates short password", async () => {
    render(<SimpleAuthPage onLogin={mockOnLogin} />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "a@a.a");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "123");

    fireEvent.click(screen.getByText("Войти"));

    expect(screen.getByText(/не менее 6 символов/i)).toBeInTheDocument();
  });

  it("validates invalid password characters", async () => {
    render(<SimpleAuthPage onLogin={mockOnLogin} />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "a@a.a");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "!!!!!!!");

    fireEvent.click(screen.getByText("Войти"));

    expect(screen.getByText(/может содержать только/i)).toBeInTheDocument();
  });

  it("validates incorrect email length", async () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const form = screen.getByRole("button", { name: "Войти" }).closest("form");

    fireEvent.change(emailInput, { target: { value: "abc" } });
    fireEvent.change(passwordInput, { target: { value: "123456" } });

    fireEvent.submit(form!);

    expect(
        await screen.findByText("Email должен быть не менее 5 символов")
    ).toBeInTheDocument();
    });

  it("validates confirm password mismatch", async () => {
    render(<SimpleAuthPage onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByText("Регистрация"));

    await userEvent.type(screen.getByPlaceholderText("Например, Анна"), "Anna");
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "a@a.a");
    await userEvent.type(screen.getByPlaceholderText("Минимум 6 символов"), "123456");
    await userEvent.type(screen.getByPlaceholderText("Ещё раз пароль"), "654321");

    fireEvent.click(screen.getByText("Зарегистрироваться"));

    expect(screen.getByText(/Пароли не совпадают/i)).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    render(<SimpleAuthPage onLogin={mockOnLogin} />);

    const toggleBtn = screen.getByLabelText("Показать пароль");

    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText("Скрыть пароль")).toBeInTheDocument();
  });
});

describe("email validation branches", () => {
  it("validates email without @", async () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "abcdef" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "123456" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    expect(
      await screen.findByText("Введите корректный email")
    ).toBeInTheDocument();
  });

  it("validates email without dot", async () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@testcom" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "123456" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    expect(
      await screen.findByText("Введите корректный email")
    ).toBeInTheDocument();
  });
});

describe("password validation branches", () => {
  it("validates short password", async () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "123" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    expect(
      await screen.findByText("Пароль должен быть не менее 6 символов")
    ).toBeInTheDocument();
  });

  it("validates too long password", async () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "1234567890123" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    expect(
      await screen.findByText("Пароль должен быть не более 12 символов")
    ).toBeInTheDocument();
  });

  it("validates invalid characters in password", async () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "12345!!!" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    expect(
      await screen.findByText(
        "Пароль может содержать только латинские/русские буквы и цифры"
      )
    ).toBeInTheDocument();
  });
});

describe("register mode validation", () => {
  beforeEach(() => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);
    fireEvent.click(screen.getByText("Регистрация"));
  });

  it("validates required name", async () => {
    fireEvent.click(
        screen.getByRole("button", { name: "Регистрация" })
    );

    fireEvent.change(screen.getByPlaceholderText("Например, Анна"), {
        target: { value: " " }, // не пусто, но trim() будет пустым
    });

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
        target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Минимум 6 символов"), {
        target: { value: "123456" },
    });

    fireEvent.change(screen.getByPlaceholderText("Ещё раз пароль"), {
        target: { value: "123456" },
    });

    fireEvent.submit(
        screen.getByRole("button", { name: "Зарегистрироваться" }).closest("form")!
    );

    expect(await screen.findByText("Имя обязательно")).toBeInTheDocument();
  });

  it("validates password mismatch", async () => {
    fireEvent.change(screen.getByPlaceholderText("Например, Анна"), {
      target: { value: "Анна" },
    });

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Минимум 6 символов"), {
      target: { value: "123456" },
    });

    fireEvent.change(screen.getByPlaceholderText("Ещё раз пароль"), {
      target: { value: "654321" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Зарегистрироваться" }).closest("form")!);

    expect(await screen.findByText("Пароли не совпадают")).toBeInTheDocument();
  });
});

describe("password visibility toggle", () => {
  it("toggles password visibility", () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);

    const passwordInput = screen.getByPlaceholderText("••••••••");
    const toggleButton = screen.getByLabelText("Показать пароль");

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });
});

describe("error handling", () => {
  it("shows login error message", async () => {
    const mockedLogin = authApi.loginRequest as jest.Mock;
    mockedLogin.mockRejectedValue(new Error("fail"));

    render(<SimpleAuthPage onLogin={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@mail.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(
      await screen.findByText(
        "Не удалось войти. Проверьте введённые данные."
      )
    ).toBeInTheDocument();
  });
});

describe("SimpleAuthPage – extra coverage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });


  it("валидация регистрации: имя минимум 2 символа", async () => {
    render(<SimpleAuthPage onLogin={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Регистрация" }));

    await userEvent.type(screen.getByPlaceholderText("Например, Анна"), "A"); // 1 символ
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@mail.com");
    await userEvent.type(screen.getByPlaceholderText("Минимум 6 символов"), "123456");
    await userEvent.type(screen.getByPlaceholderText("Ещё раз пароль"), "123456");

    fireEvent.submit(
      screen.getByRole("button", { name: "Зарегистрироваться" }).closest("form")!
    );

    expect(await screen.findByText("Имя должно быть не менее 2 символов")).toBeInTheDocument();
  });

  it("очистка ошибок: updateField сбрасывает errors[field] и errors.submit при вводе", async () => {
    (authApi.loginRequest as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    render(<SimpleAuthPage onLogin={jest.fn()} />);

    // вызовем submit-ошибку (errors.submit)
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "test@mail.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "123456");
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(
      await screen.findByText("Не удалось войти. Проверьте введённые данные.")
    ).toBeInTheDocument();

    // теперь меняем email -> errors.submit должен очиститься
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "x");

    await waitFor(() => {
      expect(
        screen.queryByText("Не удалось войти. Проверьте введённые данные.")
      ).not.toBeInTheDocument();
    });

    // и добьём field error: сделаем ошибку email, потом ввод -> очистка errors.email
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "abc" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "123456" } });
    fireEvent.submit(screen.getByRole("button", { name: "Войти" }).closest("form")!);

    expect(await screen.findByText("Email должен быть не менее 5 символов")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "def");

    await waitFor(() => {
      expect(
        screen.queryByText("Email должен быть не менее 5 символов")
      ).not.toBeInTheDocument();
    });
  });

  it("регистрация: catch показывает регистрационную ошибку", async () => {
    (authApi.registerRequest as jest.Mock).mockRejectedValueOnce(new Error("reg fail"));

    render(<SimpleAuthPage onLogin={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Регистрация" }));

    await userEvent.type(screen.getByPlaceholderText("Например, Анна"), "Анна");
    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "user@mail.com");
    await userEvent.type(screen.getByPlaceholderText("Минимум 6 символов"), "123456");
    await userEvent.type(screen.getByPlaceholderText("Ещё раз пароль"), "123456");

    fireEvent.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    expect(
      await screen.findByText(
        "Ошибка при регистрации. Возможно, пользователь с таким email уже существует."
      )
    ).toBeInTheDocument();
  });

  it("displayName fallback: name=пробелы -> берётся login; login отсутствует -> берётся email", async () => {
    const onLogin = jest.fn();

    (authApi.loginRequest as jest.Mock).mockResolvedValue({ access: "a", refresh: "r" });

    // кейс 1: name из пробелов => displayName = login
    (authApi.fetchProfileByEmail as jest.Mock).mockResolvedValueOnce({
      id: 1,
      login: "login_from_profile",
      name: "   ",
      email: "e1@mail.com",
    });

    render(<SimpleAuthPage onLogin={onLogin} />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "e1@mail.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "123456");
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(onLogin.mock.calls[0][0]).toMatchObject({
      name: "login_from_profile",
      login: "login_from_profile",
      email: "e1@mail.com",
    });

    // кейс 2: name пустой, login null => displayName = email
    (authApi.fetchProfileByEmail as jest.Mock).mockResolvedValueOnce({
      id: 2,
      login: null,
      name: "",
      email: "e2@mail.com",
    });

    // ещё один логин
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(2));
    expect(onLogin.mock.calls[1][0]).toMatchObject({
      name: "e2@mail.com",
      login: "e2@mail.com",
      email: "e2@mail.com",
    });
  });
});
