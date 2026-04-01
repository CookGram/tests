import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { SimpleAddRecipePage } from "../../src/components/SimpleAddRecipePage";
import { saveRecipeApi } from "../../src/api/recipes";

jest.mock("../../src/api/recipes", () => ({
  saveRecipeApi: jest.fn(),
}));

jest.mock("../../src/components/figma/ImageWithFallback", () => ({
  ImageWithFallback: (props: any) => <img data-testid="step-img" {...props} />,
}));

const PLACEHOLDER_IMAGE =
  "https://img.freepik.com/premium-photo/fry-pan-white_102618-1612.jpg";

type User = { id: string; name: string };

function getMainFileInput(): HTMLInputElement {
  // Блок "Главное изображение" -> текст "Нажмите для загрузки изображения"
  const label = screen.getByText("Нажмите для загрузки изображения").closest("label");
  if (!label) throw new Error("Main image label not found");
  const input = label.querySelector('input[type="file"]') as HTMLInputElement | null;
  if (!input) throw new Error("Main image input not found");
  return input;
}

function getStepFileInput(stepIndex = 0): HTMLInputElement {
  // В шаге есть текст "Загрузить изображение"
  const uploadLabels = screen.getAllByText("Загрузить изображение").map((n) => n.closest("label"));
  const label = uploadLabels[stepIndex];
  if (!label) throw new Error("Step image label not found");
  const input = label.querySelector('input[type="file"]') as HTMLInputElement | null;
  if (!input) throw new Error("Step image input not found");
  return input;
}

function getTitleInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Например: Паста Карбонара") as HTMLInputElement;
}

function getIngredientInput(n: number): HTMLInputElement {
  return screen.getByPlaceholderText(`Ингредиент ${n}`) as HTMLInputElement;
}

function getStepTextarea(stepNo: number): HTMLTextAreaElement {
  // stepNo начинается с 1, placeholder одинаковый — берём по порядку
  const all = screen.getAllByPlaceholderText("Опишите этот шаг...") as HTMLTextAreaElement[];
  return all[stepNo - 1];
}

describe("SimpleAddRecipePage – full coverage", () => {
  const user: User = { id: "5", name: "Анна" };

  const onBack = jest.fn();
  const onSave = jest.fn();

  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    jest.clearAllMocks();
    onBack.mockClear();
    onSave.mockClear();

    // стабилизируем createObjectURL
    URL.createObjectURL = jest.fn(() => "blob:preview");

    // мок alert/console
    jest.spyOn(window, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    (window.alert as any).mockRestore?.();
    (console.error as any).mockRestore?.();
    jest.useRealTimers();
  });

  /**
   * Мок Image + управление validateImage:
   * - если setNextImageError(true) => onerror
   * - иначе onload с заданными width/height
   */
  let nextImageShouldError = false;
  let nextImageSize: { w: number; h: number } = { w: 1920, h: 1080 };

  function setNextImageOk(w = 1920, h = 1080) {
    nextImageShouldError = false;
    nextImageSize = { w, h };
  }

  function setNextImageError() {
    nextImageShouldError = true;
  }

  class MockImage {
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    width = 0;
    height = 0;

    set src(_val: string) {
      if (nextImageShouldError) {
        // error branch
        this.onerror?.();
        return;
      }
      // load branch
      this.width = nextImageSize.w;
      this.height = nextImageSize.h;
      this.onload?.();
    }
  }

  // мок FileReader для fileToBase64
  class MockFileReader {
    result: string | ArrayBuffer | null = null;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;

    readAsDataURL(_file: File) {
      // base64 с префиксом data:
      this.result = "data:image/png;base64,BASE64PAYLOAD";
      this.onload?.();
    }
  }

  beforeEach(() => {
    // @ts-expect-error
    global.Image = MockImage;
    // @ts-expect-error
    global.FileReader = MockFileReader;
  });

  function renderPage() {
    render(<SimpleAddRecipePage user={user as any} onBack={onBack} onSave={onSave} />);
  }

  it("вызывает onBack по кнопкам 'Назад' и 'Отмена'", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it("валидация названия: пустое -> ошибка; затем ввод исправляет; слишком длинное -> ошибка", async () => {
    renderPage();

    const title = getTitleInput();

    // blur при пустом
    fireEvent.blur(title);
    expect(await screen.findByText("Заполните это поле")).toBeInTheDocument();

    // handleTitleChange: если titleError уже есть, будет re-validate и очистка
    await userEvent.type(title, "Паста");
    await waitFor(() => {
      expect(screen.queryByText("Заполните это поле")).not.toBeInTheDocument();
    });

    // слишком длинное
    const long = "a".repeat(101);
    fireEvent.change(title, { target: { value: long } });
    fireEvent.blur(title);

    expect(
      await screen.findByText("Максимальная длина 100 символов")
    ).toBeInTheDocument();
  });

  it("ингредиенты: add/remove + валидация 'хотя бы один' при submit", async () => {
    renderPage();

    // добавили второй ингредиент
    fireEvent.click(screen.getByRole("button", { name: "Добавить ингредиент" }));
    expect(getIngredientInput(2)).toBeInTheDocument();

    // удаляем второй (кнопка X появится, когда ингредиентов > 1)
    const ingredientRow2 = getIngredientInput(2).closest("div")!;
    const removeBtn2 = within(ingredientRow2).getByRole("button");
    fireEvent.click(removeBtn2);
    expect(screen.queryByPlaceholderText("Ингредиент 2")).not.toBeInTheDocument();

    // оставим ингредиент пустым, добавим валидный шаг, чтобы упереться в ingredientsError
    await userEvent.type(getTitleInput(), "Суп");
    await userEvent.type(getStepTextarea(1), "Сделать что-то");

    fireEvent.click(screen.getByRole("button", { name: "Сохранить рецепт" }));

    expect(
      await screen.findByText("Добавьте хотя бы один ингредиент")
    ).toBeInTheDocument();

    // при вводе ингредиента ошибка должна сброситься
    await userEvent.type(getIngredientInput(1), "Картошка");
    await waitFor(() => {
      expect(
        screen.queryByText("Добавьте хотя бы один ингредиент")
      ).not.toBeInTheDocument();
    });
  });

  it("шаги: валидация 'хотя бы один' + длина > 100 + удаление stepErrors при исправлении", async () => {
    renderPage();

    await userEvent.type(getTitleInput(), "Рецепт");
    await userEvent.type(getIngredientInput(1), "Соль");

    // шаг пустой -> stepsError
    fireEvent.click(screen.getByRole("button", { name: "Сохранить рецепт" }));
    expect(
      await screen.findByText("Добавьте хотя бы один шаг приготовления")
    ).toBeInTheDocument();

    // слишком длинное описание
    const tooLong = "x".repeat(101);
    fireEvent.change(getStepTextarea(1), { target: { value: tooLong } });
    fireEvent.blur(getStepTextarea(1));

    expect(
      await screen.findByText("Максимальная длина 100 символов")
    ).toBeInTheDocument();

    // исправляем -> stepErrors должен исчезнуть
    fireEvent.change(getStepTextarea(1), { target: { value: "Коротко" } });
    await waitFor(() => {
      expect(screen.queryByText("Максимальная длина 100 символов")).not.toBeInTheDocument();
    });
  });

  it("валидация названия: при длине <= 100 ошибка 'Максимальная длина 100 символов' не появляется", async () => {
    renderPage();

    const title = getTitleInput();

    const ok = "a".repeat(100);

    fireEvent.change(title, { target: { value: ok } });
    fireEvent.blur(title);

    await waitFor(() => {
      expect(screen.queryByText("Максимальная длина 100 символов")).not.toBeInTheDocument();
    });

    
    expect(screen.queryByText("Заполните это поле")).not.toBeInTheDocument();
  });

  it("валидация названия: слишком короткое название (нижняя граница 0)", async () => {
    renderPage();

    const title = getTitleInput();

    const ok = "a".repeat(1);

    fireEvent.change(title, { target: { value: ok } });
    fireEvent.blur(title);

    await waitFor(() => {
      expect(screen.queryByText("Максимальная длина 100 символов")).not.toBeInTheDocument();
    });

    
    expect(screen.queryByText("Заполните это поле")).not.toBeInTheDocument();
  });

  it("removeStep: удаляет шаг и удаляет ошибку для этого шага", async () => {
    renderPage();

    // сделаем 2 шага
    fireEvent.click(screen.getByRole("button", { name: "Добавить шаг" }));
    expect(screen.getAllByText(/Шаг \d \*/)).toHaveLength(2);

    // сделаем ошибку на шаге 2 (слишком длинный)
    const tooLong = "y".repeat(101);
    fireEvent.change(getStepTextarea(2), { target: { value: tooLong } });
    fireEvent.blur(getStepTextarea(2));
    expect(await screen.findByText("Максимальная длина 100 символов")).toBeInTheDocument();

    // удаляем шаг 2 (у него есть кнопка X в заголовке шага)
    const step2Card = screen.getByText("Шаг 2 *").closest("div")!;
    const removeBtn = within(step2Card).getAllByRole("button").find((b) => b.getAttribute("type") === "button")!;
    fireEvent.click(removeBtn);

    // осталось 1 шаг, и ошибка исчезла
    expect(screen.getAllByText(/Шаг \d \*/)).toHaveLength(1);
    expect(screen.queryByText("Максимальная длина 100 символов")).not.toBeInTheDocument();
  });

  it("главное изображение: no file -> сбрасывает; invalid format / too big / bad resolution / onerror / valid + remove", async () => {
    renderPage();

    const input = getMainFileInput();

    // no file
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.queryByAltText("Превью")).not.toBeInTheDocument();

    // invalid format
    const badType = new File(["x"], "a.gif", { type: "image/gif" });
    setNextImageOk();
    fireEvent.change(input, { target: { files: [badType] } });

    expect(
      await screen.findByText(/неверный формат/i)
    ).toBeInTheDocument();

    // too big
    const big = new File(["x"], "a.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 }); // >5MB
    fireEvent.change(input, { target: { files: [big] } });

    expect(
      await screen.findByText(/превышает 5 МБ/i)
    ).toBeInTheDocument();

    // bad resolution
    const okFile = new File(["x"], "a.png", { type: "image/png" });
    Object.defineProperty(okFile, "size", { value: 1000 });
    setNextImageOk(3000, 2000);
    fireEvent.change(input, { target: { files: [okFile] } });

    expect(
      await screen.findByText(/неверное разрешение/i)
    ).toBeInTheDocument();

    // onerror
    const okFile2 = new File(["x"], "b.png", { type: "image/png" });
    Object.defineProperty(okFile2, "size", { value: 1000 });
    setNextImageError();
    fireEvent.change(input, { target: { files: [okFile2] } });

    expect(
      await screen.findByText(/не удалось загрузить файл/i)
    ).toBeInTheDocument();

    // valid -> preview + remove
    const okFile3 = new File(["x"], "c.png", { type: "image/png" });
    Object.defineProperty(okFile3, "size", { value: 1000 });
    setNextImageOk(1920, 1080);

    fireEvent.change(input, { target: { files: [okFile3] } });

    expect(await screen.findByAltText("Превью")).toBeInTheDocument();

    // removeMainImage (кнопка X на превью)
    const previewBlock = screen.getByAltText("Превью").closest("div")!;
    const removeBtn = within(previewBlock).getByRole("button");
    fireEvent.click(removeBtn);

    expect(screen.queryByAltText("Превью")).not.toBeInTheDocument();
  });

  it("изображение шага: no file -> очищает; invalid -> alert; valid -> показывает ImageWithFallback + removeStepImage", async () => {
    renderPage();

    const stepInput = getStepFileInput(0);

    // no file
    fireEvent.change(stepInput, { target: { files: [] } });
    expect(screen.queryByTestId("step-img")).not.toBeInTheDocument();

    // invalid format -> alert
    const bad = new File(["x"], "s.gif", { type: "image/gif" });
    fireEvent.change(stepInput, { target: { files: [bad] } });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalled();
    });

    // valid -> preview + ImageWithFallback
    const good = new File(["x"], "s.png", { type: "image/png" });
    Object.defineProperty(good, "size", { value: 1000 });
    setNextImageOk(1920, 1080);

    fireEvent.change(stepInput, { target: { files: [good] } });

    const img = await screen.findByTestId("step-img");
    expect(img).toHaveAttribute("src", "blob:preview");
    expect(img).toHaveAttribute("alt", "Шаг 1");

    // removeStepImage (кнопка X около картинки шага)
    const imgWrap = img.closest("div")!;
    const removeBtn = within(imgWrap).getByRole("button");
    fireEvent.click(removeBtn);

    expect(screen.queryByTestId("step-img")).not.toBeInTheDocument();
  });

  it("submit success: если main image не выбран -> recipe.image = PLACEHOLDER_IMAGE", async () => {
    (saveRecipeApi as jest.Mock).mockResolvedValueOnce({});

    renderPage();

    await userEvent.type(getTitleInput(), "Салат");
    await userEvent.type(getIngredientInput(1), "Огурец");
    await userEvent.type(getStepTextarea(1), "Нарезать");

    fireEvent.click(screen.getByRole("button", { name: "Сохранить рецепт" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].image).toBe(PLACEHOLDER_IMAGE);
  });

  it("authorId fallback: если user.id не число -> authorId = 1", async () => {
    (saveRecipeApi as jest.Mock).mockResolvedValueOnce({});

    render(
      <SimpleAddRecipePage
        user={{ id: "abc", name: "Анна" } as any}
        onBack={onBack}
        onSave={onSave}
      />
    );

    await userEvent.type(getTitleInput(), "Суп");
    await userEvent.type(getIngredientInput(1), "Вода");
    await userEvent.type(getStepTextarea(1), "Кипятить");

    fireEvent.click(screen.getByRole("button", { name: "Сохранить рецепт" }));

    await waitFor(() => expect(saveRecipeApi).toHaveBeenCalledTimes(1));
    expect((saveRecipeApi as jest.Mock).mock.calls[0][0].authorId).toBe(1);
  });
});