package com.project.ui.core;

import org.openqa.selenium.By;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selectors.byText;
import static com.codeborne.selenide.Selenide.$;

public class FeedPage {

    private static final Logger log = LoggerFactory.getLogger(FeedPage.class);

    private static final By SETTINGS_BTN = byText("Настройки");
    private static final By SUBSCRIPTIONS_BTN = byText("Подписки");
    private static final By LOGOUT_BTN = byText("Выйти");

    public FeedPage() {
        check();
        log.info("Загрузилась страница входа");
    }

    public void check() throws Error {
        $(SETTINGS_BTN).shouldBe(visible.because("Не отобразилось поле логина"));
        $(SUBSCRIPTIONS_BTN).shouldBe(visible.because("Не отобразилась кнопка входа"));
        $(LOGOUT_BTN).shouldBe(visible.because("Не отобразилась кнопка входа"));
    }
}
