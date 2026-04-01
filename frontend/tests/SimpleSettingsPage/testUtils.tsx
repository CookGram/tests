import { render, type RenderOptions } from "@testing-library/react";
import { SimpleSettingsPage } from "../../src/components/SimpleSettingsPage";
import type { User } from "../../src/types/recipe";
import { DEFAULT_USER } from "./constants";

export const defaultOnBack = jest.fn();
export const defaultOnSaveSettings = jest.fn();

export function renderSimpleSettingsPage(
  props: { user?: User; onBack?: () => void; onSaveSettings?: (u: User) => void } = {}
) {
  const user = props.user ?? DEFAULT_USER;
  const onBack = props.onBack ?? defaultOnBack;
  const onSaveSettings = props.onSaveSettings ?? defaultOnSaveSettings;

  return render(<SimpleSettingsPage user={user} onBack={onBack} onSaveSettings={onSaveSettings} />);
}
