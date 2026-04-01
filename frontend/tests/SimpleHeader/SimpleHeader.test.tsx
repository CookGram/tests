import "@testing-library/jest-dom";
import { screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderSimpleHeader,
  defaultOnLogout,
  defaultOnSubscriptionsClick,
  defaultOnUserNameClick,
  defaultOnCookBookClick,
  defaultOnSettingsClick,
} from "./testUtils";
import { DEFAULT_USER, LABELS } from "./constants";

const getLogoButton = () => screen.getByRole("button", { name: LABELS.LOGO });
const getSubscriptionsButton = () => screen.getByRole("button", { name: LABELS.SUBSCRIPTIONS });
const getSettingsButton = () => screen.getByRole("button", { name: LABELS.SETTINGS });
const getLogoutButton = () => screen.getByRole("button", { name: LABELS.LOGOUT });

describe("SimpleHeader", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
    renderSimpleHeader();
    user = userEvent.setup();
  });

  describe("рендер", () => {
    it("всегда отображает логотип и кнопку «CookBook»", () => {
      expect(getLogoButton()).toBeInTheDocument();
      expect(screen.getByText(LABELS.LOGO)).toBeInTheDocument();
    });

    it("при user === null отображается только логотип (без Подписки, Настройки, Выйти)", () => {
      cleanup();
      renderSimpleHeader({ user: null });
      expect(getLogoButton()).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: LABELS.SUBSCRIPTIONS })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: LABELS.SETTINGS })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: LABELS.LOGOUT })).not.toBeInTheDocument();
    });

    it("при наличии user отображаются кнопки Подписки, Настройки, имя пользователя, Выйти", () => {
      expect(getSubscriptionsButton()).toBeInTheDocument();
      expect(getSettingsButton()).toBeInTheDocument();
      expect(screen.getByText(DEFAULT_USER.name)).toBeInTheDocument();
      expect(getLogoutButton()).toBeInTheDocument();
    });

    it("имя пользователя отображается из user.name", () => {
      expect(screen.getByText(DEFAULT_USER.name)).toBeInTheDocument();
    });
  });

  describe("клики по кнопкам", () => {
    it("клик по «CookBook» вызывает onCookBookClick", async () => {
      await user.click(getLogoButton());
      expect(defaultOnCookBookClick).toHaveBeenCalledTimes(1);
    });

    it("клик по «Подписки» вызывает onSubscriptionsClick", async () => {
      await user.click(getSubscriptionsButton());
      expect(defaultOnSubscriptionsClick).toHaveBeenCalledTimes(1);
    });

    it("клик по «Настройки» вызывает onSettingsClick", async () => {
      await user.click(getSettingsButton());
      expect(defaultOnSettingsClick).toHaveBeenCalledTimes(1);
    });

    it("клик по имени пользователя вызывает onUserNameClick", async () => {
      await user.click(screen.getByText(DEFAULT_USER.name));
      expect(defaultOnUserNameClick).toHaveBeenCalledTimes(1);
    });

    it("клик по «Выйти» вызывает onLogout", async () => {
      await user.click(getLogoutButton());
      expect(defaultOnLogout).toHaveBeenCalledTimes(1);
    });
  });
});
