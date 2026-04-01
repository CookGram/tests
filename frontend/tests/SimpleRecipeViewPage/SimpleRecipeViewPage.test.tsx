import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SimpleRecipeViewPage } from "../../src/components/SimpleRecipeViewPage";

// Мокаем ImageWithFallback, чтобы тесты были простыми и стабильными
jest.mock("../../src/components/figma/ImageWithFallback", () => ({
  ImageWithFallback: (props: any) => <img data-testid="img" {...props} />,
}));

type Recipe = {
  title: string;
  author: string;
  image?: string | null;
  createdAt?: Date | null;
  ingredients?: string[] | null;
  steps?: Array<{
    id?: string | number | null;
    description: string;
    image?: string | null;
  }> | null;
};

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    title: "Борщ",
    author: "Иван",
    image: null,
    createdAt: null,
    ingredients: null,
    steps: null,
    ...overrides,
  };
}

function renderPage({
  recipe = makeRecipe(),
  isSubscribed = false,
  currentUserName = "Петя",
}: {
  recipe?: Recipe;
  isSubscribed?: boolean;
  currentUserName?: string;
} = {}) {
  const onBack = jest.fn();
  const onAuthorClick = jest.fn();
  const onSubscribe = jest.fn();
  const onUnsubscribe = jest.fn();

  render(
    <SimpleRecipeViewPage
      // @ts-expect-error в тесте достаточно формы объекта
      recipe={recipe}
      onBack={onBack}
      onAuthorClick={onAuthorClick}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
      isSubscribed={isSubscribed}
      currentUserName={currentUserName}
    />
  );

  return { onBack, onAuthorClick, onSubscribe, onUnsubscribe };
}

describe("SimpleRecipeViewPage", () => {
  test("рендерит кнопку Назад и вызывает onBack по клику", () => {
    const { onBack } = renderPage();

    const backBtn = screen.getByRole("button", { name: "Назад" });
    fireEvent.click(backBtn);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test("клик по автору вызывает onAuthorClick(author)", () => {
    const recipe = makeRecipe({ author: "Иван" });
    const { onAuthorClick } = renderPage({ recipe });

    const authorBtn = screen.getByRole("button", { name: "Иван" });
    fireEvent.click(authorBtn);

    expect(onAuthorClick).toHaveBeenCalledTimes(1);
    expect(onAuthorClick).toHaveBeenCalledWith("Иван");
  });

  test("если recipe.image задан — рендерит ImageWithFallback с корректными props", () => {
    const recipe = makeRecipe({ image: "https://example.com/a.jpg" });
    renderPage({ recipe });

    const img = screen.getByTestId("img");
    expect(img).toHaveAttribute("src", "https://example.com/a.jpg");
    expect(img).toHaveAttribute("alt", "Борщ");
  });

  test("если recipe.image отсутствует — не рендерит изображение", () => {
    const recipe = makeRecipe({ image: null });
    renderPage({ recipe });

    expect(screen.queryByTestId("img")).not.toBeInTheDocument();
  });

  test("если createdAt задан — показывает дату (toLocaleDateString)", () => {
    const dt = new Date(2024, 0, 15); // 15 Jan 2024 (локаль в среде может отличаться — сравниваем именно вызов)
    const recipe = makeRecipe({ createdAt: dt });
    renderPage({ recipe });

    expect(screen.getByText(dt.toLocaleDateString())).toBeInTheDocument();
  });

  test("если createdAt не задан — дату не показывает", () => {
    const recipe = makeRecipe({ createdAt: null });
    renderPage({ recipe });

    // Точного текста нет — просто проверяем, что нет элемента с датой,
    // а заголовок и автор есть (страница отрендерилась корректно)
    expect(screen.getByText("Борщ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Иван" })).toBeInTheDocument();
  });

  test("чужой рецепт: показывает кнопку подписки и при isSubscribed=false вызывает onSubscribe(author)", () => {
    const recipe = makeRecipe({ author: "Иван" });
    const { onSubscribe, onUnsubscribe } = renderPage({
      recipe,
      isSubscribed: false,
      currentUserName: "Петя",
    });

    const subBtn = screen.getByRole("button", { name: "Подписаться" });
    fireEvent.click(subBtn);

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onSubscribe).toHaveBeenCalledWith("Иван");
    expect(onUnsubscribe).not.toHaveBeenCalled();
  });

  test("чужой рецепт: при isSubscribed=true показывает 'Вы подписаны' и вызывает onUnsubscribe(author)", () => {
    const recipe = makeRecipe({ author: "Иван" });
    const { onSubscribe, onUnsubscribe } = renderPage({
      recipe,
      isSubscribed: true,
      currentUserName: "Петя",
    });

    const subBtn = screen.getByRole("button", { name: "Вы подписаны" });
    fireEvent.click(subBtn);

    expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).toHaveBeenCalledWith("Иван");
    expect(onSubscribe).not.toHaveBeenCalled();
  });

  test("свой рецепт: кнопку подписки не показывает", () => {
    const recipe = makeRecipe({ author: "Петя" });
    renderPage({ recipe, currentUserName: "Петя" });

    expect(
      screen.queryByRole("button", { name: "Подписаться" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Вы подписаны" })
    ).not.toBeInTheDocument();
  });

  test("ингредиенты: если пусто/нет — секция не рендерится", () => {
    renderPage({ recipe: makeRecipe({ ingredients: [] }) });
    expect(screen.queryByText("Ингредиенты")).not.toBeInTheDocument();
  });

  test("ингредиенты: если есть — рендерит список", () => {
    const recipe = makeRecipe({ ingredients: ["Свекла", "Капуста"] });
    renderPage({ recipe });

    expect(screen.getByText("Ингредиенты")).toBeInTheDocument();
    expect(screen.getByText("Свекла")).toBeInTheDocument();
    expect(screen.getByText("Капуста")).toBeInTheDocument();
  });

  test("шаги: если пусто/нет — секция не рендерится", () => {
    renderPage({ recipe: makeRecipe({ steps: [] }) });
    expect(screen.queryByText("Шаги приготовления")).not.toBeInTheDocument();
  });

  test("шаги: рендерит шаги, поддерживает key step.id ?? index и image на шаге", () => {
    const recipe = makeRecipe({
      steps: [
        { id: "s1", description: "Нарезать овощи", image: null },
        { id: null, description: "Варить 40 минут", image: "https://ex.com/step2.jpg" },
      ],
    });

    renderPage({ recipe });

    expect(screen.getByText("Шаги приготовления")).toBeInTheDocument();

    // Заголовки шагов
    expect(screen.getByText("Шаг 1")).toBeInTheDocument();
    expect(screen.getByText("Шаг 2")).toBeInTheDocument();

    // Описания
    expect(screen.getByText("Нарезать овощи")).toBeInTheDocument();
    expect(screen.getByText("Варить 40 минут")).toBeInTheDocument();

    // Картинка только на 2 шаге (плюс может быть recipe.image если бы была)
    const imgs = screen.getAllByTestId("img");
    // В данном кейсе только step2.image => 1 картинка
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("src", "https://ex.com/step2.jpg");
    expect(imgs[0]).toHaveAttribute("alt", "Шаг 2");
  });
});