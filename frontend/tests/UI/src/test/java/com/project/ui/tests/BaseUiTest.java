package com.project.ui.tests;

import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.Selenide;
import com.project.ui.models.TestBot;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;

import static com.codeborne.selenide.WebDriverRunner.clearBrowserCache;

public abstract class BaseUiTest {

    protected static final String BROWSER = "chrome";
    protected static final String BASE_URL = "http://localhost:3000";

    protected static final TestBot TEST_BOT = new TestBot("testbot3@mail.ru", "testbot3", "password");

    @BeforeAll
    public static void setUp() {
        Configuration.browser = BROWSER;
        Configuration.baseUrl = BASE_URL;
        System.setProperty("chromeoptions.prefs", "intl.accept_languages=ru");
        clearBrowserCache();
        Selenide.open("/");
    }

    @AfterAll
    public static void tearDown() {
        Selenide.closeWebDriver();
    }
}