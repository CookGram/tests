import "@testing-library/jest-dom";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "../../src/types/recipe";
import * as accountApi from "../../src/api/account";
import { renderSimpleSettingsPage, defaultOnBack, defaultOnSaveSettings } from "./testUtils";
import { LABELS, DEFAULT_USER, VALIDATION_MESSAGES, NETWORK_ERROR_ALERT } from "./constants";

jest.mock("../../src/api/account");

const mockUpdateAccountProfile = accountApi.updateAccountProfile as jest.MockedFunction<
  typeof accountApi.updateAccountProfile
>;

const getLoginInput = () => screen.getByLabelText(LABELS.LABEL_LOGIN);
const getEmailInput = () => screen.getByLabelText(LABELS.LABEL_EMAIL);
const getCurrentPasswordInput = () => screen.getByLabelText(LABELS.LABEL_CURRENT_PASSWORD);
const getNewPasswordInput = () => screen.getByLabelText(LABELS.LABEL_NEW_PASSWORD);
const getConfirmPasswordInput = () => screen.getByLabelText(LABELS.LABEL_CONFIRM_PASSWORD);
const getSaveButton = () => screen.getByRole("button", { name: LABELS.SAVE });
const getCancelButton = () => screen.getByRole("button", { name: LABELS.CANCEL });
const getBackButton = () => screen.getByRole("button", { name: LABELS.BACK });

function mockApiSuccess(overrides?: Partial<accountApi.AccountProfile>) {
  mockUpdateAccountProfile.mockResolvedValue({
    id: 1,
    login: DEFAULT_USER.login,
    email: DEFAULT_USER.email,
    ...overrides,
  });
}

describe("SimpleSettingsPage", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    renderSimpleSettingsPage();
    user = userEvent.setup();
  });

  describe("рендер", () => {
    it("отображает заголовок «Настройки профиля»", () => {
      expect(screen.getByRole("heading", { name: LABELS.TITLE })).toBeInTheDocument();
    });

    it("отображает кнопку «Назад»", () => {
      expect(getBackButton()).toBeInTheDocument();
    });

    it("отображает секцию «Основная информация» и поля логина и email", () => {
      expect(screen.getByText(LABELS.SECTION_MAIN)).toBeInTheDocument();
      expect(getLoginInput()).toBeInTheDocument();
      expect(getEmailInput()).toBeInTheDocument();
    });

    it("отображает секцию «Изменение пароля» и три поля пароля", () => {
      expect(screen.getByText(LABELS.SECTION_PASSWORD)).toBeInTheDocument();
      expect(getCurrentPasswordInput()).toBeInTheDocument();
      expect(getNewPasswordInput()).toBeInTheDocument();
      expect(getConfirmPasswordInput()).toBeInTheDocument();
    });

    it("отображает подсказку «Оставьте поля пароля пустыми, если не хотите его менять»", () => {
      expect(screen.getByText((content) => content.includes(LABELS.PASSWORD_EMPTY_HINT))).toBeInTheDocument();
    });

    it("поле email только для чтения", () => {
      expect(getEmailInput()).toHaveAttribute("readOnly");
    });

    it("начальные значения формы берутся из user (login, email)", () => {
      expect(getLoginInput()).toHaveValue(DEFAULT_USER.login);
      expect(getEmailInput()).toHaveValue(DEFAULT_USER.email);
    });

    it("отображаются кнопки «Отмена» и «Сохранить изменения»", () => {
      expect(getCancelButton()).toBeInTheDocument();
      expect(getSaveButton()).toBeInTheDocument();
    });

    it("кнопка «Сохранить» недоступна, когда нет изменений", () => {
      expect(getSaveButton()).toBeDisabled();
    });
  });

  describe("валидация: имя пользователя", () => {
    it("пустой логин — ошибка «Имя пользователя обязательно»", async () => {
      await user.clear(getLoginInput());
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.LOGIN_REQUIRED)).toBeInTheDocument();
    });

    it("логин из одного символа — ошибка «Имя должно быть не менее 2 символов»", async () => {
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "a");
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.LOGIN_MIN)).toBeInTheDocument();
    });

    it("логин более 100 символов — ошибка «Имя должно быть не более 100 символов»", async () => {
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "a".repeat(101));
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.LOGIN_MAX)).toBeInTheDocument();
    });
  });

  describe("валидация: пароль", () => {
    it("при вводе нового пароля без текущего — «Введите текущий пароль»", async () => {
      await user.type(getNewPasswordInput(), "newpass1");
      await user.type(getConfirmPasswordInput(), "newpass1");
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED)).toBeInTheDocument();
    });

    it("новый пароль короче 6 символов — «Новый пароль должен быть не менее 6 символов»", async () => {
      await user.type(getCurrentPasswordInput(), "oldpass");
      await user.type(getNewPasswordInput(), "12345");
      await user.type(getConfirmPasswordInput(), "12345");
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.NEW_PASSWORD_MIN)).toBeInTheDocument();
    });

    it("новый пароль длиннее 12 символов — «Пароль должен быть не более 12 символов»", async () => {
      await user.type(getCurrentPasswordInput(), "oldpass");
      await user.type(getNewPasswordInput(), "1234567890123");
      await user.type(getConfirmPasswordInput(), "1234567890123");
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.NEW_PASSWORD_MAX)).toBeInTheDocument();
    });

    it("новый пароль с недопустимыми символами — «Пароль может содержать только латинские/русские буквы и цифры»", async () => {
      await user.type(getCurrentPasswordInput(), "oldpass");
      await user.type(getNewPasswordInput(), "pass@word");
      await user.type(getConfirmPasswordInput(), "pass@word");
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.NEW_PASSWORD_CHARS)).toBeInTheDocument();
    });

    it("новый пароль без подтверждения — «Подтвердите новый пароль»", async () => {
      cleanup();
      renderSimpleSettingsPage();
      const u = userEvent.setup();
      await u.type(getCurrentPasswordInput(), "oldpass");
      await u.type(getNewPasswordInput(), "newpass1");
      await u.click(getSaveButton());
      const errors = screen.getAllByText(VALIDATION_MESSAGES.CONFIRM_REQUIRED);
      expect(errors.some((el) => el.classList.contains("text-red-600"))).toBe(true);
    });

    it("новый пароль и подтверждение не совпадают — «Пароли не совпадают»", async () => {
      await user.type(getCurrentPasswordInput(), "oldpass");
      await user.type(getNewPasswordInput(), "newpass1");
      await user.type(getConfirmPasswordInput(), "newpass2");
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.PASSWORDS_MISMATCH)).toBeInTheDocument();
    });

    it("изменение имени без текущего пароля — «Для изменения имени введите текущий пароль»", async () => {
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "NewName");
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.CURRENT_PASSWORD_FOR_NAME)).toBeInTheDocument();
    });
  });

  describe("кнопки «Назад» и «Отмена»", () => {
    it("клик «Назад» вызывает onBack", async () => {
      await user.click(getBackButton());
      expect(defaultOnBack).toHaveBeenCalledTimes(1);
    });

    it("клик «Отмена» вызывает onBack", async () => {
      await user.click(getCancelButton());
      expect(defaultOnBack).toHaveBeenCalledTimes(1);
    });

    it("при отмене форма сбрасывается к исходным значениям user", async () => {
      cleanup();
      const onBack = jest.fn();
      const { unmount } = renderSimpleSettingsPage({ onBack });
      const u = userEvent.setup();
      await u.type(getLoginInput(), "Extra");
      await u.click(getCancelButton());
      expect(onBack).toHaveBeenCalled();
      unmount();
      renderSimpleSettingsPage();
      expect(getLoginInput()).toHaveValue(DEFAULT_USER.login);
      cleanup();
    });
  });

  describe("отправка формы", () => {
    it("при отсутствии изменений submit не вызывает API и не вызывает onSaveSettings", async () => {
      const submitButton = getSaveButton();
      expect(submitButton).toBeDisabled();
      const form = document.querySelector("form") as HTMLFormElement;
      expect(form).toBeTruthy();
      form?.requestSubmit();
      expect(mockUpdateAccountProfile).not.toHaveBeenCalled();
      expect(defaultOnSaveSettings).not.toHaveBeenCalled();
    });

    it("при валидном изменении логина вызывается updateAccountProfile и onSaveSettings", async () => {
      mockApiSuccess({ login: "NewLogin" });
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "NewLogin");
      await user.type(getCurrentPasswordInput(), "currentpass");
      await user.click(getSaveButton());

      await screen.findByText(LABELS.SUCCESS_MESSAGE);
      expect(mockUpdateAccountProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          login: "NewLogin",
          email: DEFAULT_USER.email,
          currentPassword: "currentpass",
        }),
      );
      expect(defaultOnSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          login: "NewLogin",
          name: "NewLogin",
          email: DEFAULT_USER.email,
        }),
      );
    });

    it("при валидном изменении пароля передаются currentPassword и newPassword", async () => {
      mockApiSuccess();
      await user.type(getCurrentPasswordInput(), "oldpass");
      await user.type(getNewPasswordInput(), "newpass1");
      await user.type(getConfirmPasswordInput(), "newpass1");
      await user.click(getSaveButton());

      await screen.findByText(LABELS.SUCCESS_MESSAGE);
      expect(mockUpdateAccountProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPassword: "oldpass",
          newPassword: "newpass1",
        }),
      );
    });

    it("после успешного сохранения показывается сообщение «Настройки успешно сохранены!»", async () => {
      mockApiSuccess({ login: "NewLogin" });
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "NewLogin");
      await user.type(getCurrentPasswordInput(), "pass");
      await user.click(getSaveButton());

      expect(await screen.findByText(LABELS.SUCCESS_MESSAGE)).toBeInTheDocument();
    });

    it("при user.id не число — onSaveSettings вызывается без вызова API", async () => {
      cleanup();
      const userWithBadId: User = { ...DEFAULT_USER, id: "not-a-number" };
      const onSave = jest.fn();
      const { unmount } = renderSimpleSettingsPage({
        user: userWithBadId,
        onSaveSettings: onSave,
      });
      const u = userEvent.setup();
      await u.clear(getLoginInput());
      await u.type(getLoginInput(), "NewName");
      await u.type(getCurrentPasswordInput(), "anypass");
      await u.click(getSaveButton());

      expect(mockUpdateAccountProfile).not.toHaveBeenCalled();
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          login: "NewName",
          name: "NewName",
          email: userWithBadId.email,
        }),
      );
      unmount();
      cleanup();
    });

    it("при ошибке API показывается alert", async () => {
      const alertSpy = jest.spyOn(global, "alert").mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockUpdateAccountProfile.mockRejectedValue(new Error("Server error"));
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "NewLogin");
      await user.type(getCurrentPasswordInput(), "pass");
      await user.click(getSaveButton());

      await screen.findByText(LABELS.SAVE);
      expect(alertSpy).toHaveBeenCalledWith("Server error");
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it("при ошибке сети (Failed to fetch) показывается alert про подключение", async () => {
      const alertSpy = jest.spyOn(global, "alert").mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockUpdateAccountProfile.mockRejectedValue(new Error("Failed to fetch"));
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "NewLogin");
      await user.type(getCurrentPasswordInput(), "pass");
      await user.click(getSaveButton());

      await screen.findByText(LABELS.SAVE);
      expect(alertSpy).toHaveBeenCalledWith(NETWORK_ERROR_ALERT);
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it("во время сохранения кнопка показывает «Сохранение...» и недоступна", async () => {
      const resolveBag: { resolve: (v: accountApi.AccountProfile) => void } = { resolve: () => {} };
      const promise = new Promise<accountApi.AccountProfile>((r) => {
        resolveBag.resolve = r;
      });
      mockUpdateAccountProfile.mockReturnValue(promise);
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "NewLogin");
      await user.type(getCurrentPasswordInput(), "pass");
      await user.click(getSaveButton());

      expect(screen.getByRole("button", { name: LABELS.SAVING })).toBeDisabled();
      resolveBag.resolve({ id: 1, login: "NewLogin", email: DEFAULT_USER.email });
    });
  });

  it("при неверном текущем пароле показывает ошибку от сервера", async () => {
    const alertSpy = jest.spyOn(global, "alert").mockImplementation(() => {});
    mockUpdateAccountProfile.mockRejectedValue(new Error("Invalid current password"));
    await user.type(getCurrentPasswordInput(), "wrongpass");
    await user.type(getNewPasswordInput(), "newpass1");
    await user.type(getConfirmPasswordInput(), "newpass1");
    await user.click(getSaveButton());

    expect(alertSpy).toHaveBeenCalledWith("Invalid current password");
    alertSpy.mockRestore();
  });

  describe("видимость пароля", () => {
    it("переключение видимости текущего пароля меняет type поля", async () => {
      const container = getCurrentPasswordInput().closest("div");
      const toggle = within(container!).getByRole("button", { name: "Показать пароль" });
      expect(getCurrentPasswordInput()).toHaveAttribute("type", "password");
      await user.click(toggle);
      expect(getCurrentPasswordInput()).toHaveAttribute("type", "text");
      await user.click(within(container!).getByRole("button", { name: "Скрыть пароль" }));
      expect(getCurrentPasswordInput()).toHaveAttribute("type", "password");
    });

    it("переключение видимости нового пароля меняет type поля", async () => {
      const container = getNewPasswordInput().closest("div");
      const toggle = within(container!).getByRole("button", { name: "Показать пароль" });
      expect(getNewPasswordInput()).toHaveAttribute("type", "password");
      await user.click(toggle);
      expect(getNewPasswordInput()).toHaveAttribute("type", "text");
      await user.click(within(container!).getByRole("button", { name: "Скрыть пароль" }));
      expect(getNewPasswordInput()).toHaveAttribute("type", "password");
    });

    it("переключение видимости подтверждения пароля меняет type поля", async () => {
      const container = getConfirmPasswordInput().closest("div");
      const toggle = within(container!).getByRole("button", { name: "Показать пароль" });
      expect(getConfirmPasswordInput()).toHaveAttribute("type", "password");
      await user.click(toggle);
      expect(getConfirmPasswordInput()).toHaveAttribute("type", "text");
      await user.click(within(container!).getByRole("button", { name: "Скрыть пароль" }));
      expect(getConfirmPasswordInput()).toHaveAttribute("type", "password");
    });
  });

  describe("очистка ошибки при вводе", () => {
    it("ошибка поля логина исчезает после ввода в это поле", async () => {
      await user.clear(getLoginInput());
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.LOGIN_REQUIRED)).toBeInTheDocument();
      await user.type(getLoginInput(), "ab");
      expect(screen.queryByText(VALIDATION_MESSAGES.LOGIN_REQUIRED)).not.toBeInTheDocument();
    });

    it("при ошибке валидации поле логина получает красную обводку", async () => {
      await user.clear(getLoginInput());
      await user.click(getSaveButton());
      expect(screen.getByText(VALIDATION_MESSAGES.LOGIN_REQUIRED)).toBeInTheDocument();
      const loginInput = getLoginInput();
      expect(loginInput.className).toMatch(/border-red-500/);
    });
  });
});
