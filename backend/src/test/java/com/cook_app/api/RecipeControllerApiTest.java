package com.cook_app.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RecipeControllerApiTest extends BaseApiIntegrationTest {

    @Test
    @DisplayName("RECIPE-01: Сохранение рецепта с шагами")
    void saveRecipe_withSteps_success() throws Exception {
        UserData author = createUser();
        Tokens tokens = login(author);

        String title = "Carbonara_" + randomSuffix();
        String recipeImageBase64 = base64("img");
        String stepImageBase64 = base64("step-img");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authorId", author.id());
        body.put("title", title);
        body.put("imageData", recipeImageBase64);
        body.put("steps", List.of(
                stepPayload((short) 1, "Boil pasta", null),
                stepPayload((short) 2, "Mix sauce", stepImageBase64)
        ));

        mockMvc.perform(post("/api/recipes/save")
                        .header("Authorization", bearer(tokens.accessToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.authorId").value(author.id()))
                .andExpect(jsonPath("$.authorLogin").value(author.login()))
                .andExpect(jsonPath("$.title").value(title))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.steps", hasSize(2)))
                .andExpect(jsonPath("$.steps[0].id").isNumber())
                .andExpect(jsonPath("$.steps[0].stepNo").value(1))
                .andExpect(jsonPath("$.steps[0].description").value("Boil pasta"))
                .andExpect(jsonPath("$.steps[1].id").isNumber())
                .andExpect(jsonPath("$.steps[1].stepNo").value(2))
                .andExpect(jsonPath("$.steps[1].description").value("Mix sauce"));
    }

    @Test
    @DisplayName("RECIPE-02: Получение всех рецептов")
    void getAllRecipes_containsSavedRecipe() throws Exception {
        UserData author = createUser();
        Tokens tokens = login(author);

        String title = "Recipe_" + randomSuffix();
        Long recipeId = saveRecipe(author.id(), title, tokens.accessToken(), false);

        mockMvc.perform(get("/api/recipes")
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[*].id", hasItem(recipeId.intValue())))
                .andExpect(jsonPath("$[*].title", hasItem(title)))
                .andExpect(jsonPath("$[*].authorId", hasItem(author.id().intValue())));
    }

    @Test
    @DisplayName("RECIPE-03: Получение всех рецептов на пустой базе")
    void getAllRecipes_emptyDb_returnsEmptyArray() throws Exception {
        UserData author = createUser();
        Tokens tokens = login(author);
        mockMvc.perform(get("/api/recipes")
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("RECIPE-04: Получение рецепта по существующему идентификатору")
    void getRecipeById_existing_success() throws Exception {
        UserData author = createUser();
        Tokens tokens = login(author);

        String title = "RecipeById_" + randomSuffix();
        Long recipeId = saveRecipe(author.id(), title, tokens.accessToken(), true);

        mockMvc.perform(get("/api/recipes/{id}", recipeId)
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(recipeId))
                .andExpect(jsonPath("$.authorId").value(author.id()))
                .andExpect(jsonPath("$.authorLogin").value(author.login()))
                .andExpect(jsonPath("$.title").value(title))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @DisplayName("RECIPE-05: Получение рецепта по несуществующему идентификатору")
    void getRecipeById_notExisting_returns404() throws Exception {
        UserData user = createUser();
        Tokens tokens = login(user);

        mockMvc.perform(get("/api/recipes/{id}", 999_999_999L)
                        .header("Authorization", bearer(tokens.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("RECIPE-06: Получение рецептов автора")
    void getRecipesByAuthor_returnsOnlyAuthorRecipes() throws Exception {
        UserData a1 = createUser();
        UserData a2 = createUser();

        Tokens tokenA1 = login(a1);
        Tokens tokenA2 = login(a2);

        String a1r1 = "A1_R1_" + randomSuffix();
        String a1r2 = "A1_R2_" + randomSuffix();
        String a2r1 = "A2_R1_" + randomSuffix();

        saveRecipe(a1.id(), a1r1, tokenA1.accessToken(), false);
        saveRecipe(a1.id(), a1r2, tokenA1.accessToken(), false);
        saveRecipe(a2.id(), a2r1, tokenA2.accessToken(), false);

        mockMvc.perform(get("/api/recipes/author/{authorId}", a1.id())
                        .header("Authorization", bearer(tokenA1.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[*].title", hasItems(a1r1, a1r2)))
                .andExpect(jsonPath("$[*].title", not(hasItem(a2r1))))
                .andExpect(jsonPath("$[*].authorId", everyItem(is(a1.id().intValue()))));
    }

    @Test
    @DisplayName("RECIPE-07: Получение рецептов по подпискам")
    void getSubscribedRecipes_returnsOnlyFollowedAuthorRecipes() throws Exception {
        UserData user = createUser();
        UserData followed = createUser();
        UserData other = createUser();

        Tokens tokenUser = login(user);
        Tokens tokenFollowed = login(followed);
        Tokens tokenOther = login(other);

        String f1 = "F1_" + randomSuffix();
        String f2 = "F2_" + randomSuffix();
        String o1 = "O1_" + randomSuffix();

        saveRecipe(followed.id(), f1, tokenFollowed.accessToken(), false);
        saveRecipe(followed.id(), f2, tokenFollowed.accessToken(), false);
        saveRecipe(other.id(), o1, tokenOther.accessToken(), false);
        mockMvc.perform(post("/api/subscription/{id}", followed.id())
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokenUser.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/recipes/subscribed")
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokenUser.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[*].title", hasItems(f1, f2)))
                .andExpect(jsonPath("$[*].title", not(hasItem(o1))))
                .andExpect(jsonPath("$[*].authorId", everyItem(is(followed.id().intValue()))));
    }

    @Test
    @DisplayName("RECIPE-08: Получение рецептов по подпискам при отсутствии подписок")
    void getSubscribedRecipes_whenNoSubscriptions_returnsEmptyArray() throws Exception {
        UserData user = createUser();
        Tokens tokenUser = login(user);

        mockMvc.perform(get("/api/recipes/subscribed")
                        .queryParam("userId", user.id().toString())
                        .header("Authorization", bearer(tokenUser.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("RECIPE-09: Получение рецептов автора при отсутствии рецептов")
    void getRecipesByAuthor_whenNoRecipes_returnsEmptyArray() throws Exception {
        UserData a1 = createUser();
        Tokens tokenA1 = login(a1);

        mockMvc.perform(get("/api/recipes/author/{authorId}", a1.id())
                        .header("Authorization", bearer(tokenA1.accessToken()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }
}