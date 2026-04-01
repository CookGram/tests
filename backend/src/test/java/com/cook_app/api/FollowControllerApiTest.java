package com.cook_app.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FollowControllerApiTest extends BaseApiIntegrationTest {

    @Test
    @DisplayName("FOLLOW-01: Получение списка подписок нового пользователя")
    void getSubscriptions_newUser_emptyList() throws Exception {
        UserData user = createUser();
        Tokens tokens = login(user);

        mockMvc.perform(get("/api/subscription")
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("FOLLOW-02: Подписка на пользователя")
    void subscribe_success() throws Exception {
        UserData user = createUser();
        UserData target = createUser();
        Tokens tokens = login(user);

        mockMvc.perform(post("/api/subscription/{id}", target.id())
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().string(isEmptyString()));

        mockMvc.perform(get("/api/subscription")
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[*].id", hasItem(target.id().intValue())))
                .andExpect(jsonPath("$[?(@.id==" + target.id() + ")].login", hasItem(target.login())));
    }

    @Test
    @DisplayName("FOLLOW-03: Отписка от пользователя")
    void unsubscribe_success() throws Exception {
        UserData user = createUser();
        UserData target = createUser();
        Tokens tokens = login(user);

        mockMvc.perform(post("/api/subscription/{id}", target.id())
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/subscription/{id}", target.id())
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent())
                .andExpect(content().string(isEmptyString()));

        mockMvc.perform(get("/api/subscription")
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[*].id", not(hasItem(target.id().intValue()))));
    }

    @Test
    @DisplayName("FOLLOW-04: Подписка на двух пользователей")
    void subscribe_twoUsers_success() throws Exception {
        UserData user = createUser();
        UserData t1 = createUser();
        UserData t2 = createUser();
        Tokens tokens = login(user);

        mockMvc.perform(post("/api/subscription/{id}", t1.id())
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/subscription/{id}", t2.id())
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/subscription")
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[*].id", hasItems(t1.id().intValue(), t2.id().intValue())));
    }

    @Test
    @DisplayName("FOLLOW-05: Отписка от пользователя, на которого не было подписки")
    void unsubscribe_whenNotSubscribed_returns204() throws Exception {
        UserData user = createUser();
        UserData target = createUser();
        Tokens tokens = login(user);

        mockMvc.perform(delete("/api/subscription/{id}", target.id())
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent())
                .andExpect(content().string(isEmptyString()));
    }
}