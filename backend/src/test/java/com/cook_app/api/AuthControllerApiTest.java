package com.cook_app.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthControllerApiTest extends BaseApiIntegrationTest {

    @Test
    @DisplayName("AUTH-01: Создание аккаунта")
    void createAccount_success() throws Exception {
        UserData user = createUser();

        assertNotNull(user.id());
        assertNotNull(user.login());
        assertNotNull(user.email());
        assertEquals(PASSWORD, user.rawPassword());
    }

    @Test
    @DisplayName("AUTH-02: Логин")
    void login_success() throws Exception {
        UserData user = createUser();

        Tokens tokens = login(user);

        assertNotNull(tokens.accessToken());
        assertNotNull(tokens.refreshToken());
        assertEquals("Bearer", tokens.type());
    }
}
