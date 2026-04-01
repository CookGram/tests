import { useState } from "react";
import type { Recipe, RecipeStep, User } from "../types/recipe";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { saveRecipeApi } from "../api/recipes";
import type { RecipeDTO, RecipeStepDTO } from "../api/recipes";

const ArrowLeftIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const AlertIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const PLACEHOLDER_IMAGE =
  "https://img.freepik.com/premium-photo/fry-pan-white_102618-1612.jpg";

interface SimpleAddRecipePageProps {
  user: User;
  onBack: () => void;
  onSave: (recipe: Omit<Recipe, "id" | "createdAt">) => void;
}

interface StepWithFile extends Omit<RecipeStep, "id"> {
  imageFile?: File | null;
}

const validateImage = async (
  file: File
): Promise<{ valid: boolean; error?: string }> => {
  const allowedFormats = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error:
        "Ошибка загрузки изображения: неверный формат. Допустимые форматы: JPEG, JPG, PNG",
    };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Ошибка загрузки изображения: размер файла превышает 5 МБ",
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= 1920 && img.height <= 1080) {
        resolve({ valid: true });
      } else {
        resolve({
          valid: false,
          error: `Ошибка загрузки изображения: неверное разрешение. Требуемое: 1920x1080 пикселей. Текущее: ${img.width}x${img.height}`,
        });
      }
    };
    img.onerror = () => {
      resolve({
        valid: false,
        error: "Ошибка загрузки изображения: не удалось загрузить файл",
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

// конвертация File -> base64 без префикса data:
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });

export function SimpleAddRecipePage({
  user,
  onBack,
  onSave,
}: SimpleAddRecipePageProps) {
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<StepWithFile[]>([
    { description: "", image: "", imageFile: null },
  ]);
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});
  const [showMaxStepsMessage, setShowMaxStepsMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const [stepsError, setStepsError] = useState<string | null>(null);

  const MAX_STEPS = 10;
  const MAX_TITLE_LENGTH = 100;
  const MAX_STEP_DESCRIPTION_LENGTH = 100;

  const validateTitle = (value: string) => {
    if (!value.trim()) {
      setTitleError("Заполните это поле");
      return false;
    } else if (value.length > MAX_TITLE_LENGTH) {
      setTitleError(`Максимальная длина ${MAX_TITLE_LENGTH} символов`);
      return false;
    } else {
      setTitleError("");
      return true;
    }
  };

  const validateStep = (index: number, value: string) => {
    if (value.length > MAX_STEP_DESCRIPTION_LENGTH) {
      setStepErrors((prev) => ({
        ...prev,
        [index]: `Максимальная длина ${MAX_STEP_DESCRIPTION_LENGTH} символов`,
      }));
      return false;
    } else {
      setStepErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
      return true;
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
    setIngredientsError(null);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
    setIngredientsError(null);
  };

  const addStep = () => {
    if (steps.length >= MAX_STEPS) {
      setShowMaxStepsMessage(true);
      setTimeout(() => setShowMaxStepsMessage(false), 3000);
      return;
    }
    setSteps([...steps, { description: "", image: "", imageFile: null }]);
    setStepsError(null);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    setStepErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateStep = (index: number, field: "description", value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
    setStepsError(null);

    if (field === "description") {
      validateStep(index, value);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleError) {
      validateTitle(value);
    }
  };

  const handleMainImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setImageError("");
    const file = e.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    const validation = await validateImage(file);
    if (!validation.valid) {
      setImageError(validation.error || "Ошибка загрузки изображения");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeMainImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageError("");
  };

  const handleStepImageChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      updateStepImage(index, null, "");
      return;
    }

    const validation = await validateImage(file);
    if (!validation.valid) {
      alert(validation.error || "Ошибка загрузки изображения");
      e.target.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);
    updateStepImage(index, file, preview);
  };

  const updateStepImage = (
    index: number,
    file: File | null,
    preview: string
  ) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], imageFile: file, image: preview };
    setSteps(newSteps);
  };

  const removeStepImage = (index: number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], imageFile: null, image: "" };
    setSteps(newSteps);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!validateTitle(title)) {
      isValid = false;
    }

    const nonEmptySteps = steps.filter(
      (step) => step.description.trim() !== ""
    );
    if (nonEmptySteps.length === 0) {
      setStepsError("Добавьте хотя бы один шаг приготовления");
      isValid = false;
    }

    steps.forEach((step, index) => {
      if (step.description && !validateStep(index, step.description)) {
        isValid = false;
      }
    });

    const validIngredients = ingredients.filter((ing) => ing.trim() !== "");
    if (validIngredients.length === 0) {
      setIngredientsError("Добавьте хотя бы один ингредиент");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIngredientsError(null);
    setStepsError(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      let mainImageBase64: string | undefined;
      if (imageFile) {
        mainImageBase64 = await fileToBase64(imageFile);
      }

      const stepDtos: RecipeStepDTO[] = [];

      const nonEmptySteps = steps.filter(
        (step) => step.description.trim() !== ""
      );
      for (let i = 0; i < nonEmptySteps.length; i++) {
        const step = nonEmptySteps[i];
        let stepImageBase64: string | undefined;
        if (step.imageFile) {
          stepImageBase64 = await fileToBase64(step.imageFile);
        }

        stepDtos.push({
          stepNo: i + 1,
          description: step.description.trim(),
          imageData: stepImageBase64,
        });
      }

      const authorId = Number(user.id) || 1;

      const dto: Omit<RecipeDTO, "id" | "createdAt"> = {
        authorId,
        title: title.trim(),
        imageData: mainImageBase64,
        steps: stepDtos,
      };

      await saveRecipeApi(dto);

      const recipeForState: Omit<Recipe, "id" | "createdAt"> = {
        title: title.trim(),
        author: user.name,
        image: imagePreview || PLACEHOLDER_IMAGE,
        ingredients: ingredients.filter((ing) => ing.trim() !== ""),
        steps: nonEmptySteps.map((step, index) => ({
          id: (index + 1).toString(),
          description: step.description.trim(),
          image: step.image || undefined,
        })),
      };

      onSave(recipeForState);
    } catch (err: any) {
      console.error(err);
      const errorMessage = "Не удалось сохранить рецепт. Попробуйте ещё раз.";
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-2 rounded px-3 py-1 hover:bg-gray-100"
        >
          <ArrowLeftIcon />
          Назад
        </button>
        <h2>Добавить рецепт</h2>
      </div>

      {saveError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertIcon />
          <span>{"Не удалось сохранить рецепт. Попробуйте ещё раз."}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-medium">Основная информация</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Название рецепта *
              </label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => validateTitle(title)}
                placeholder="Например: Паста Карбонара"
                className={`mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 ${
                  titleError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                maxLength={MAX_TITLE_LENGTH}
                required
              />
              {titleError && (
                <p className="mt-1 text-sm text-red-600">{titleError}</p>
              )}
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Обязательное поле</span>
                <span>
                  {title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Главное изображение
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Форматы: JPEG, JPG, PNG. Размер: до 5 МБ. Разрешение: 1080x1920
                пикселей
              </p>

              {!imagePreview ? (
                <div className="mt-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 hover:bg-gray-100">
                    <UploadIcon />
                    <span className="mt-2 text-sm text-gray-600">
                      Нажмите для загрузки изображения
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleMainImageChange}
                      className="hidden"
                    />
                  </label>
                  {imageError && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertIcon />
                      {imageError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Превью"
                    className="h-48 w-auto rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeMainImage}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
                  >
                    <XIcon />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-medium">Ингредиенты *</h3>
          {ingredientsError && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertIcon />
              <span>{ingredientsError}</span>
            </div>
          )}
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={ingredient}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  placeholder={`Ингредиент ${index + 1}`}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="rounded border border-gray-300 p-2 hover:bg-gray-50"
                  >
                    <XIcon />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="flex items-center gap-2 rounded border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
              <PlusIcon />
              Добавить ингредиент
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Шаги приготовления *</h3>
            <span className="text-sm text-gray-500">
              {steps.length} из {MAX_STEPS} шагов
            </span>
          </div>

          {stepsError && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertIcon />
              <span>{stepsError}</span>
            </div>
          )}

          {showMaxStepsMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-orange-50 border border-orange-200 p-3 text-orange-800">
              <AlertIcon />
              <span className="text-sm">
                Достигнут лимит количества шагов ({MAX_STEPS})
              </span>
            </div>
          )}

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">Шаг {index + 1} *</h4>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="rounded p-1 hover:bg-gray-100"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Описание *
                    </label>
                    <textarea
                      value={step.description}
                      onChange={(e) =>
                        updateStep(index, "description", e.target.value)
                      }
                      onBlur={() => validateStep(index, step.description)}
                      placeholder="Опишите этот шаг..."
                      rows={3}
                      className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 ${
                        stepErrors[index]
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      maxLength={MAX_STEP_DESCRIPTION_LENGTH}
                    />
                    {stepErrors[index] && (
                      <p className="mt-1 text-sm text-red-600">
                        {stepErrors[index]}
                      </p>
                    )}
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>Обязательное поле</span>
                      <span>
                        {step.description.length}/{MAX_STEP_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Изображение для шага
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      Форматы: JPEG, JPG, PNG. Размер: до 5 МБ. Разрешение:
                      1080x1920 пикселей
                    </p>

                    {!step.image ? (
                      <div className="mt-2">
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 hover:bg-gray-100">
                          <UploadIcon />
                          <span className="mt-2 text-sm text-gray-600">
                            Загрузить изображение
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={(e) => handleStepImageChange(index, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-2 relative inline-block">
                        <ImageWithFallback
                          src={step.image}
                          alt={`Шаг ${index + 1}`}
                          className="h-32 w-auto rounded object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeStepImage(index)}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
                        >
                          <XIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {steps.length < MAX_STEPS ? (
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 rounded border border-gray-300 px-3 py-2 hover:bg-gray-50"
              >
                <PlusIcon />
                Добавить шаг
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-gray-500 bg-gray-50">
                <AlertIcon />
                <span>Максимальное количество шагов достигнуто</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? "Сохраняем..." : "Сохранить рецепт"}
          </button>
        </div>
      </form>
    </div>
  );
}
