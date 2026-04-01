import { render, type RenderOptions } from "@testing-library/react";
import { SimpleHeader } from "../../src/components/SimpleHeader";
import type { User } from "../../src/types/recipe";
import { DEFAULT_USER } from "./constants";

export const defaultOnLogout = jest.fn();
export const defaultOnSubscriptionsClick = jest.fn();
export const defaultOnUserNameClick = jest.fn();
export const defaultOnCookBookClick = jest.fn();
export const defaultOnSettingsClick = jest.fn();

export function renderSimpleHeader(
  props: {
    user?: User | null;
    onLogout?: () => void;
    onSubscriptionsClick?: () => void;
    onUserNameClick?: () => void;
    onCookBookClick?: () => void;
    onSettingsClick?: () => void;
  } = {},
) {
  const user = props.user === undefined ? DEFAULT_USER : props.user;
  const onLogout = props.onLogout ?? defaultOnLogout;
  const onSubscriptionsClick = props.onSubscriptionsClick ?? defaultOnSubscriptionsClick;
  const onUserNameClick = props.onUserNameClick ?? defaultOnUserNameClick;
  const onCookBookClick = props.onCookBookClick ?? defaultOnCookBookClick;
  const onSettingsClick = props.onSettingsClick ?? defaultOnSettingsClick;

  return render(
    <SimpleHeader
      user={user}
      onLogout={onLogout}
      onSubscriptionsClick={onSubscriptionsClick}
      onUserNameClick={onUserNameClick}
      onCookBookClick={onCookBookClick}
      onSettingsClick={onSettingsClick}
    />,
  );
}
