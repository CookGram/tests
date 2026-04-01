package com.project.ui.tests.login;

import com.project.ui.core.LoginPage;
import com.project.ui.tests.BaseUiTest;
import org.junit.jupiter.api.Test;

public class LoginUiTest extends BaseUiTest {

    @Test
    void userCanLogin() {
        new LoginPage().selectRegistrationFilter()
                .enterName(TEST_BOT.name())
                .enterEmail(TEST_BOT.login())
                .enterPassword(TEST_BOT.password())
                .enterSecondPassword(TEST_BOT.password())
                .clickRegistry();
    }
}
