import { render } from "@testing-library/react";
import { SimpleSubscriptionsPage } from "../../src/components/SimpleSubscriptionsPage";
import { User } from "../../src/types/recipe";

export const mockUser: User = {
  id: "user1",
  name: "Текущий Пользователь",
  login: "current_user",
  email: "user@example.com",
  subscriptions: ["Анна Кулинарова", "Петр Поваров", "Мария Сладкоежкина"],
};

interface RenderSimpleSubscriptionsPageProps {
  user?: User;
  onBack?: () => void;
  onUnsubscribe?: (authorName: string) => void;
  onAuthorClick?: (authorName: string) => void;
}

export function renderSimpleSubscriptionsPage(props: RenderSimpleSubscriptionsPageProps = {}) {
  const defaultProps = {
    user: mockUser,
    onBack: jest.fn(),
    onUnsubscribe: jest.fn(),
    onAuthorClick: jest.fn(),
  };

  return render(<SimpleSubscriptionsPage {...defaultProps} {...props} />);
}
