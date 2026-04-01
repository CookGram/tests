package com.cook_app.controller;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.Recipe;
import com.cook_app.entieties.RecipeStep;
import com.cook_app.service.AccountService;
import com.cook_app.service.RecipeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RecipeControllerAdditionalTest {

    private static final Logger log = LoggerFactory.getLogger(RecipeControllerAdditionalTest.class);

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
    void saveRecipe_returns201_onSuccess_withSteps_andCallsServiceWithMappedEntity() throws Exception {
        log.info("Проверяем, что POST /api/recipes/save возвращает 201 и корректно маппит рецепт со шагами в сущность");

        String json = """
            {
              "authorId": 5,
              "title": "Pizza",
              "imageData": "aW1n",
              "steps": [
                {"stepNo": 1, "description": "do1", "imageData": "czE="},
                {"stepNo": 2, "description": "do2", "imageData": "czI="}
              ]
            }
            """;

        Recipe saved = new Recipe();
        saved.setId(100L);
        saved.setAuthorId(5L);
        saved.setTitle("Pizza");

        when(recipeService.saveRecipe(any(Recipe.class))).thenReturn(saved);

        Account author = new Account();
        author.setLogin("chef");
        when(accountService.getAccountById(5L)).thenReturn(author);

        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);

        mockMvc.perform(post("/api/recipes/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").exists());

        verify(recipeService).saveRecipe(captor.capture());
        Recipe passed = captor.getValue();

        assertThat(passed.getAuthorId()).isEqualTo(5L);
        assertThat(passed.getTitle()).isEqualTo("Pizza");

        Object recipeImageData = passed.getImageData();
        assertThat(recipeImageData).isNotNull();

        byte[] bytes = (byte[]) recipeImageData;
        assertThat(bytes.length).isGreaterThan(0);

        assertThat(passed.getSteps()).hasSize(2);

        RecipeStep st1 = passed.getSteps().get(0);
        assertThat(((Number) st1.getStepNo()).intValue()).isEqualTo(1);
        assertThat(st1.getDescription()).isEqualTo("do1");

        Object stepImageData = st1.getImageData();
        assertThat(stepImageData).isNotNull();
        bytes = (byte[]) stepImageData;
        assertThat(bytes.length).isGreaterThan(0);

        RecipeStep st2 = passed.getSteps().get(1);
        assertThat(((Number) st2.getStepNo()).intValue()).isEqualTo(2);
        assertThat(st2.getDescription()).isEqualTo("do2");

        verify(accountService).getAccountById(5L);
        verifyNoMoreInteractions(recipeService, accountService);

        log.info("Успешно проверили, что POST /api/recipes/save возвращает 201 и корректно маппит рецепт со шагами в сущность");
    }

    @Test
    void getAllRecipes_whenAuthorIdNull_returns500_andDoesNotCallAccountService() throws Exception {
        log.info("Проверяем, что GET /api/recipes возвращает 500, если у рецепта authorId равен null");

        Recipe r = new Recipe();
        r.setAuthorId(null);
        r.setTitle("NoAuthor");
        when(recipeService.getAllRecipes()).thenReturn(List.of(r));

        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isInternalServerError());

        verify(recipeService).getAllRecipes();
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что GET /api/recipes возвращает 500, если у рецепта authorId равен null");
    }

    @Test
    void getAllRecipes_whenAccountServiceThrows_resolveAuthorNameReturnsNull_andStill200() throws Exception {
        log.info("Проверяем, что GET /api/recipes возвращает 200, даже если AccountService падает при получении автора");

        Recipe r = new Recipe();
        r.setAuthorId(7L);
        r.setTitle("Cake");
        when(recipeService.getAllRecipes()).thenReturn(List.of(r));

        when(accountService.getAccountById(7L)).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").exists());

        verify(recipeService).getAllRecipes();
        verify(accountService).getAccountById(7L);
        verifyNoMoreInteractions(recipeService, accountService);

        log.info("Успешно проверили, что GET /api/recipes возвращает 200, даже если AccountService падает при получении автора");
    }

    @Test
    void getSubscribedAuthorsRecipes_returns500_onException() throws Exception {
        log.info("Проверяем, что GET /api/recipes/subscribed возвращает 500, если RecipeService выбрасывает исключение");

        when(recipeService.getSubscribedAuthorsRecipes(9L)).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/recipes/subscribed").param("userId", "9"))
                .andExpect(status().isInternalServerError());

        verify(recipeService).getSubscribedAuthorsRecipes(9L);
        verifyNoMoreInteractions(recipeService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что GET /api/recipes/subscribed возвращает 500, если RecipeService выбрасывает исключение");
    }

    @Test
    void getRecipesByAuthor_returns500_onException() throws Exception {
        log.info("Проверяем, что GET /api/recipes/author/{authorId} возвращает 500, если RecipeService выбрасывает исключение");

        when(recipeService.getRecipesByAuthor(3L)).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/recipes/author/3"))
                .andExpect(status().isInternalServerError());

        verify(recipeService).getRecipesByAuthor(3L);
        verifyNoMoreInteractions(recipeService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что GET /api/recipes/author/{authorId} возвращает 500, если RecipeService выбрасывает исключение");
    }
}