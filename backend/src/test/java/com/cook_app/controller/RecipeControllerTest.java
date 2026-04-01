package com.cook_app.controller;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.Recipe;
import com.cook_app.service.AccountService;
import com.cook_app.service.RecipeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class RecipeControllerTest {

    private static final Logger log = LoggerFactory.getLogger(RecipeControllerTest.class);

    private RecipeService recipeService;
    private AccountService accountService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        recipeService = mock(RecipeService.class);
        accountService = mock(AccountService.class);

        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        RecipeController controller = new RecipeController(recipeService, accountService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void getAllRecipes_returns200() throws Exception {
        log.info("Проверяем, что GET /api/recipes возвращает 200 и список рецептов при успешной работе сервисов");

        Recipe r = new Recipe();
        r.setAuthorId(1L);
        r.setTitle("Pasta");
        when(recipeService.getAllRecipes()).thenReturn(List.of(r));

        Account author = new Account();
        author.setLogin("john");
        when(accountService.getAccountById(1L)).thenReturn(author);

        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0]").exists());

        verify(recipeService).getAllRecipes();
        verify(accountService).getAccountById(1L);
        verifyNoMoreInteractions(recipeService, accountService);

        log.info("Успешно проверили, что GET /api/recipes возвращает 200 и список рецептов при успешной работе сервисов");
    }

    @Test
    void getAllRecipes_returns500_onException() throws Exception {
        log.info("Проверяем, что GET /api/recipes возвращает 500, если RecipeService выбрасывает исключение");

        when(recipeService.getAllRecipes()).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isInternalServerError());

        verify(recipeService).getAllRecipes();
        verifyNoMoreInteractions(recipeService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что GET /api/recipes возвращает 500, если RecipeService выбрасывает исключение");
    }

    @Test
    void getSubscribedAuthorsRecipes_returns200() throws Exception {
        log.info("Проверяем, что GET /api/recipes/subscribed возвращает 200 и список рецептов подписок при успешной работе сервисов");

        Recipe r = new Recipe();
        r.setAuthorId(2L);
        r.setTitle("Soup");
        when(recipeService.getSubscribedAuthorsRecipes(99L)).thenReturn(List.of(r));

        Account author = new Account();
        author.setLogin("anna");
        when(accountService.getAccountById(2L)).thenReturn(author);

        mockMvc.perform(get("/api/recipes/subscribed").param("userId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").exists());

        verify(recipeService).getSubscribedAuthorsRecipes(99L);
        verify(accountService).getAccountById(2L);
        verifyNoMoreInteractions(recipeService, accountService);

        log.info("Успешно проверили, что GET /api/recipes/subscribed возвращает 200 и список рецептов подписок при успешной работе сервисов");
    }

    @Test
    void getRecipesByAuthor_returns200() throws Exception {
        log.info("Проверяем, что GET /api/recipes/author/{authorId} возвращает 200 и список рецептов автора при успешной работе сервисов");

        Recipe r = new Recipe();
        r.setAuthorId(7L);
        r.setTitle("Cake");
        when(recipeService.getRecipesByAuthor(7L)).thenReturn(List.of(r));

        Account author = new Account();
        author.setLogin("kate");
        when(accountService.getAccountById(7L)).thenReturn(author);

        mockMvc.perform(get("/api/recipes/author/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").exists());

        verify(recipeService).getRecipesByAuthor(7L);
        verify(accountService).getAccountById(7L);
        verifyNoMoreInteractions(recipeService, accountService);

        log.info("Успешно проверили, что GET /api/recipes/author/{authorId} возвращает 200 и список рецептов автора при успешной работе сервисов");
    }

    @Test
    void getRecipeById_returns200_onSuccess() throws Exception {
        log.info("Проверяем, что GET /api/recipes/{id} возвращает 200 и рецепт при успешном получении рецепта сервисом");

        Recipe r = new Recipe();
        r.setAuthorId(3L);
        r.setTitle("Salad");
        when(recipeService.getRecipeById(123L)).thenReturn(r);

        Account author = new Account();
        author.setLogin("bob");
        when(accountService.getAccountById(3L)).thenReturn(author);

        mockMvc.perform(get("/api/recipes/123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").exists());

        verify(recipeService).getRecipeById(123L);
        verify(accountService).getAccountById(3L);
        verifyNoMoreInteractions(recipeService, accountService);

        log.info("Успешно проверили, что GET /api/recipes/{id} возвращает 200 и рецепт при успешном получении рецепта сервисом");
    }

    @Test
    void getRecipeById_returns404_onException() throws Exception {
        log.info("Проверяем, что GET /api/recipes/{id} возвращает 404, если RecipeService выбрасывает исключение при поиске рецепта");

        when(recipeService.getRecipeById(123L)).thenThrow(new RuntimeException("not found"));

        mockMvc.perform(get("/api/recipes/123"))
                .andExpect(status().isNotFound());

        verify(recipeService).getRecipeById(123L);
        verifyNoMoreInteractions(recipeService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что GET /api/recipes/{id} возвращает 404, если RecipeService выбрасывает исключение при поиске рецепта");
    }

    @Test
    void saveRecipe_returns500_onException() throws Exception {
        log.info("Проверяем, что POST /api/recipes/save возвращает 500, если RecipeService выбрасывает исключение при сохранении");

        when(recipeService.saveRecipe(any(Recipe.class))).thenThrow(new RuntimeException("boom"));

        String reqJson = "{\"authorId\": 1, \"title\": \"X\"}";

        mockMvc.perform(post("/api/recipes/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isInternalServerError());

        verify(recipeService).saveRecipe(any(Recipe.class));
        verifyNoMoreInteractions(recipeService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что POST /api/recipes/save возвращает 500, если RecipeService выбрасывает исключение при сохранении");
    }
}