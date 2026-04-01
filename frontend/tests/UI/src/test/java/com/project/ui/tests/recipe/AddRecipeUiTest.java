package com.project.ui.tests.recipe;
import com.codeborne.selenide.SelenideElement;
import com.project.ui.tests.BaseUiTest;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import static com.codeborne.selenide.Condition.*;
import static com.codeborne.selenide.CollectionCondition.size;
import static com.codeborne.selenide.Selectors.byText;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.$$;

public class AddRecipeUiTest extends BaseUiTest {
    private void loginWithTestBot() {
        $(byText("Регистрация")).shouldBe(visible).click();
        $("input[placeholder='you@example.com']").shouldBe(visible)
                .setValue(TEST_BOT.login());
        $("input[placeholder='Например, Анна']").shouldBe(visible)
                .setValue(TEST_BOT.name());
        $("input[placeholder='Минимум 6 символов']").shouldBe(visible)
                .setValue(TEST_BOT.password());
        $("input[placeholder='Ещё раз пароль']").shouldBe(visible)
                .setValue(TEST_BOT.password());
        $(byText("Зарегистрироваться")).shouldBe(enabled).click();
        $(byText("Настройки")).shouldBe(visible);
        $(byText("Подписки")).shouldBe(visible);
    }

    private void openAddRecipePage() {
        $(byText("Добавить рецепт")).shouldBe(visible).click();
        $(byText("Добавить рецепт")).shouldBe(visible);
        $(byText("Название рецепта *")).shouldBe(visible);
    }

    private SelenideElement titleInput() {
        return $("input[placeholder='Например: Паста Карбонара']");
    }

    private SelenideElement firstStepTextarea() {
        return $$("textarea[placeholder='Опишите этот шаг...']").first();
    }

    private SelenideElement addStepButton() {
        return $(byText("Добавить шаг"));
    }

    private SelenideElement saveRecipeButton() {
        return $(byText("Сохранить рецепт"));
    }

    private File tempFileWithSize(String suffix, long sizeBytes) throws IOException {
        File f = File.createTempFile("e2e-test-", suffix);
        byte[] data = new byte[(int) sizeBytes];
        Files.write(f.toPath(), data);
        f.deleteOnExit();
        return f;
    }

    @Test
    void backButtonReturnsToFeedAndDoesNotSave() {
        loginWithTestBot();
        openAddRecipePage();
        titleInput().setValue("Рецепт для проверки Назад");
        firstStepTextarea().setValue("Описание шага 1");
        $(byText("Назад")).shouldBe(visible).click();
        $(byText("Настройки")).shouldBe(visible);
        $(byText("Подписки")).shouldBe(visible);
        $(byText("Название рецепта *")).shouldNotBe(visible);
    }

    @Test
    void stepDescriptionIsRequiredForAtLeastOneStep() {
        loginWithTestBot();
        openAddRecipePage();
        titleInput().setValue("Рецепт без шага");
        saveRecipeButton().click();
        $(byText("Добавьте хотя бы один шаг приготовления")).shouldBe(visible);
        $(byText("Название рецепта *")).shouldBe(visible);
    }

    @Test
    void cannotAddMoreThanTenSteps() {
        loginWithTestBot();
        openAddRecipePage();
        for (int i = 0; i < 9; i++) {
            addStepButton().shouldBe(visible).click();
        }
        $$(byText("Шаг 1 *")).first().shouldBe(visible);
        int stepHeadersCount = $$(byText("Шаг 1 *")).size()
                + $$(byText("Шаг 2 *")).size()
                + $$(byText("Шаг 3 *")).size()
                + $$(byText("Шаг 4 *")).size()
                + $$(byText("Шаг 5 *")).size()
                + $$(byText("Шаг 6 *")).size()
                + $$(byText("Шаг 7 *")).size()
                + $$(byText("Шаг 8 *")).size()
                + $$(byText("Шаг 9 *")).size()
                + $$(byText("Шаг 10 *")).size();
        assert stepHeadersCount == 10;
        addStepButton().shouldNot(exist);
        $(byText("Максимальное количество шагов достигнуто")).shouldBe(visible);
    }

    @Test
    void cannotRemoveLastStep() {
        loginWithTestBot();
        openAddRecipePage();
        addStepButton().click();
        $(byText("Шаг 2 *")).shouldBe(visible);
        SelenideElement step2Card = $(byText("Шаг 2 *")).closest("div");
        SelenideElement removeStep2Btn = step2Card.$("button[type='button']");
        removeStep2Btn.click();
        $(byText("Шаг 1 *")).shouldBe(visible);
        SelenideElement step1Card = $(byText("Шаг 1 *")).closest("div");
        step1Card.$$("[type='button']").filter(visible).shouldHave(size(0));
    }

    @Test
    void removingStepDoesNotMoveItsDataToAnotherStep() {
        loginWithTestBot();
        openAddRecipePage();
        addStepButton().click();
        SelenideElement step1 = $$( "textarea[placeholder='Опишите этот шаг...']" ).get(0);
        SelenideElement step2 = $$( "textarea[placeholder='Опишите этот шаг...']" ).get(1);
        step1.setValue("Шаг 1 текст");
        step2.setValue("Шаг 2 текст");
        SelenideElement step2Card = $(byText("Шаг 2 *")).closest("div");
        SelenideElement removeStep2Btn = step2Card.$("button[type='button']");
        removeStep2Btn.click();
        $$( "textarea[placeholder='Опишите этот шаг...']" )
                .shouldHave(size(1))
                .first().shouldHave(value("Шаг 1 текст"));
        $(byText("Шаг 2 *")).shouldNot(exist);
    }

    @Test
    void photoFormatValidationForMainAndStep() throws IOException {
        loginWithTestBot();
        openAddRecipePage();
        File badMp4 = tempFileWithSize(".mp4", 1024);
        SelenideElement mainInput = $(byText("Нажмите для загрузки изображения"))
                .closest("label").$("input[type='file']");
        mainInput.uploadFile(badMp4);
        $(byText("Ошибка загрузки изображения: неверный формат. Допустимые форматы: JPEG, JPG, PNG"))
                .shouldBe(visible);
        SelenideElement stepInput = $(byText("Загрузить изображение"))
                .closest("label").$("input[type='file']");
        stepInput.uploadFile(badMp4);
        String alertText = com.codeborne.selenide.WebDriverRunner.getWebDriver()
                .switchTo().alert().getText();
        assert alertText.contains("неверный формат");
        com.codeborne.selenide.WebDriverRunner.getWebDriver()
                .switchTo().alert().accept();
    }

    @Test
    void photoSizeValidationForMainAndStep() throws IOException {
        loginWithTestBot();
        openAddRecipePage();
        long eightMb = 8L * 1024L * 1024L;
        File bigJpg = tempFileWithSize(".jpg", eightMb);
        SelenideElement mainInput = $(byText("Нажмите для загрузки изображения"))
                .closest("label").$("input[type='file']");
        mainInput.uploadFile(bigJpg);
        $(byText("Ошибка загрузки изображения: размер файла превышает 5 МБ"))
                .shouldBe(visible);
        SelenideElement stepInput = $(byText("Загрузить изображение"))
                .closest("label").$("input[type='file']");
        stepInput.uploadFile(bigJpg);
        String alertText = com.codeborne.selenide.WebDriverRunner.getWebDriver()
                .switchTo().alert().getText();
        assert alertText.contains("размер файла превышает 5 МБ");
        com.codeborne.selenide.WebDriverRunner.getWebDriver()
                .switchTo().alert().accept();
    }

    @Test
    void saveRecipeWithPhotos() throws IOException {
        loginWithTestBot();
        openAddRecipePage();
        titleInput().setValue("Рецепт с фото");
        firstStepTextarea().setValue("Описание шага 1");
        addStepButton().click();
        $$( "textarea[placeholder='Опишите этот шаг...']" ).get(1)
                .setValue("Описание шага 2");
        File okJpg = tempFileWithSize(".jpg", 1024 * 100);
        SelenideElement mainInput = $(byText("Нажмите для загрузки изображения"))
                .closest("label").$("input[type='file']");
        mainInput.uploadFile(okJpg);
        SelenideElement step2Input = $$(byText("Загрузить изображение"))
                .get(1).closest("label").$("input[type='file']");
        step2Input.uploadFile(okJpg);
        saveRecipeButton().click();
        $(byText("Настройки")).shouldBe(visible);
        $(byText("Рецепт с фото")).shouldBe(visible);
    }
    @Test
    void saveRecipeWithTextOnly() {
        loginWithTestBot();
        openAddRecipePage();
        titleInput().setValue("Текстовый рецепт");
        firstStepTextarea().setValue("Описание шага 1");
        saveRecipeButton().click();
        $(byText("Настройки")).shouldBe(visible);
        $(byText("Текстовый рецепт")).shouldBe(visible);
    }
}