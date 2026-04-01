package com.project.ui.core;

import org.openqa.selenium.By;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static com.codeborne.selenide.Condition.clickable;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selectors.byText;
import static com.codeborne.selenide.Selectors.byXpath;
import static com.codeborne.selenide.Selenide.$;

public class LoginPage {


    private static final Logger log = LoggerFactory.getLogger(LoginPage.class);

    private static final By EMAIL_FIELD = byXpath(".//input[@type='email']");
    private static final By NAME_FIELD = byXpath(".//input[@placeholder='Например, Анна']");
    private static final By PASSWORD_FIELD = byXpath(".//input[@placeholder='Минимум 6 символов']");
    private static final By SECOND_PASSWORD_FIELD = byXpath(".//input[@placeholder='Ещё раз пароль']");
    private static final By REGISTRATION_FILTER_BTN = byText("Регистрация");
    private static final By ENTER_BTN = byText("Войти");
    private static final By REGISTRATION_BTN = byText("Зарегистрироваться");

    public LoginPage() {
        check();
        log.info("Загрузилась страница входа");
    }

    public void check() throws Error {
        $(EMAIL_FIELD).shouldBe(visible.because("Не отобразилось поле логина"));
        $(ENTER_BTN).shouldBe(visible.because("Не отобразилась кнопка входа"));
    }

    public LoginPage selectRegistrationFilter() {
        $(REGISTRATION_FILTER_BTN).shouldBe(clickable.because("Не отобразилось поле логина"))
                .click();
        return this;
    }

    public LoginPage enterName(String name) {
        log.info("Вводим логин");
        $(NAME_FIELD).shouldBe(visible.because("Не отобразилось поле логина"))
                .setValue(name);
        return this;
    }

    public LoginPage enterEmail(String email) {
        log.info("Вводим логин");
        $(EMAIL_FIELD).shouldBe(visible.because("Не отобразилось поле логина"))
                .setValue(email);
        return this;
    }

    public LoginPage enterPassword(String password) {
        log.info("Вводим пароль");
        $(PASSWORD_FIELD).shouldBe(visible.because("Не отобразилось поле пароля"))
                .setValue(password);
        return this;
    }

    public LoginPage enterSecondPassword(String password) {
        log.info("Вводим пароль");
        $(SECOND_PASSWORD_FIELD).shouldBe(visible.because("Не отобразилось поле пароля"))
                .setValue(password);
        return this;
    }

    public void clickSubmit() {
        log.info("Кликаем на кнопку входа");
        $(ENTER_BTN).shouldBe(clickable.because("Не отобразилась кнопка входа"))
                .click();
    }

    public FeedPage clickRegistry() {
        log.info("Кликаем на кнопку входа");
        $(REGISTRATION_BTN).shouldBe(clickable.because("Не отобразилась кнопка входа"))
                .click();
        return new FeedPage();
    }
}
