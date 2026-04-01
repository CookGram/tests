package com.cook_app.service.impl;

import com.cook_app.entieties.Recipe;
import com.cook_app.entieties.RecipeStep;
import com.cook_app.repository.RecipeRepository;
import com.cook_app.repository.RecipeStepRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecipeServiceImplTest {

    private static final Logger log = LoggerFactory.getLogger(RecipeServiceImplTest.class);

    @Mock
    RecipeRepository recipeRepository;

    @Mock
    RecipeStepRepository recipeStepRepository;

    @InjectMocks
    RecipeServiceImpl service;

    @Test
    void getAllRecipes_returnsRepositoryResult() {
        log.info("Проверяем, что getAllRecipes возвращает список рецептов из recipeRepository.findAllRecipes()");

        Recipe r1 = mock(Recipe.class);
        Recipe r2 = mock(Recipe.class);
        when(recipeRepository.findAllRecipes()).thenReturn(List.of(r1, r2));

        List<Recipe> res = service.getAllRecipes();

        assertThat(res).hasSize(2);
        verify(recipeRepository).findAllRecipes();
        verifyNoMoreInteractions(recipeRepository);

        log.info("Успешно проверили, что getAllRecipes возвращает список рецептов из recipeRepository.findAllRecipes()");
    }

    @Test
    void getSubscribedAuthorsRecipes_returnsRepositoryResult() {
        log.info("Проверяем, что getSubscribedAuthorsRecipes возвращает список рецептов из recipeRepository.findSubscribedAuthorsRecipes(userId)");

        Recipe r = mock(Recipe.class);
        when(recipeRepository.findSubscribedAuthorsRecipes(7L)).thenReturn(List.of(r));

        List<Recipe> res = service.getSubscribedAuthorsRecipes(7L);

        assertThat(res).hasSize(1);
        verify(recipeRepository).findSubscribedAuthorsRecipes(7L);

        log.info("Успешно проверили, что getSubscribedAuthorsRecipes возвращает список рецептов из recipeRepository.findSubscribedAuthorsRecipes(userId)");
    }

    @Test
    void getRecipesByAuthor_returnsRepositoryResult() {
        log.info("Проверяем, что getRecipesByAuthor возвращает список рецептов из recipeRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)");

        Recipe r = mock(Recipe.class);
        when(recipeRepository.findByAuthorIdOrderByCreatedAtDesc(3L)).thenReturn(List.of(r));

        List<Recipe> res = service.getRecipesByAuthor(3L);

        assertThat(res).hasSize(1);
        verify(recipeRepository).findByAuthorIdOrderByCreatedAtDesc(3L);

        log.info("Успешно проверили, что getRecipesByAuthor возвращает список рецептов из recipeRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)");
    }

    @Test
    void getRecipeById_returnsRecipe_whenFound() {
        log.info("Проверяем, что getRecipeById возвращает рецепт, если recipeRepository.findByIdWithSteps(id) возвращает значение");

        Recipe recipe = mock(Recipe.class);
        when(recipeRepository.findByIdWithSteps(5L)).thenReturn(Optional.of(recipe));

        Recipe res = service.getRecipeById(5L);

        assertThat(res).isSameAs(recipe);
        verify(recipeRepository).findByIdWithSteps(5L);

        log.info("Успешно проверили, что getRecipeById возвращает рецепт, если recipeRepository.findByIdWithSteps(id) возвращает значение");
    }

    @Test
    void getRecipeById_throws404_whenNotFound() {
        log.info("Проверяем, что getRecipeById выбрасывает ResponseStatusException 404, если рецепт не найден");

        when(recipeRepository.findByIdWithSteps(404L)).thenReturn(Optional.empty());

        Throwable t = catchThrowable(() -> service.getRecipeById(404L));
        assertThat(t).isInstanceOf(ResponseStatusException.class);
        ResponseStatusException rse = (ResponseStatusException) t;
        assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        verify(recipeRepository).findByIdWithSteps(404L);

        log.info("Успешно проверили, что getRecipeById выбрасывает ResponseStatusException 404, если рецепт не найден");
    }

    @Test
    void saveRecipe_savesRecipeAndSteps_whenStepsProvided() {
        log.info("Проверяем, что saveRecipe сохраняет рецепт и сохраняет шаги, если шаги переданы (steps != null)");

        Recipe recipe = mock(Recipe.class);
        when(recipe.getAuthorId()).thenReturn(1L);

        Recipe saved = mock(Recipe.class);
        when(saved.getId()).thenReturn(10L);

        RecipeStep s1 = mock(RecipeStep.class);
        RecipeStep s2 = mock(RecipeStep.class);
        when(recipe.getSteps()).thenReturn(List.of(s1, s2));

        when(recipeRepository.save(recipe)).thenReturn(saved);
        when(recipeStepRepository.save(any(RecipeStep.class))).thenAnswer(inv -> inv.getArgument(0));

        Recipe res = service.saveRecipe(recipe);

        assertThat(res).isSameAs(saved);
        verify(recipeRepository).save(recipe);
        verify(s1).setRecipe(saved);
        verify(s2).setRecipe(saved);
        verify(recipeStepRepository).save(s1);
        verify(recipeStepRepository).save(s2);

        log.info("Успешно проверили, что saveRecipe сохраняет рецепт и сохраняет шаги, если шаги переданы (steps != null)");
    }

    @Test
    void saveRecipe_savesRecipeWithoutSteps_whenNullSteps() {
        log.info("Проверяем, что saveRecipe сохраняет только рецепт и не сохраняет шаги, если steps равен null");

        Recipe recipe = mock(Recipe.class);
        when(recipe.getAuthorId()).thenReturn(1L);
        when(recipe.getSteps()).thenReturn(null);

        Recipe saved = mock(Recipe.class);
        when(recipeRepository.save(recipe)).thenReturn(saved);

        Recipe res = service.saveRecipe(recipe);

        assertThat(res).isSameAs(saved);
        verify(recipeRepository).save(recipe);
        verifyNoInteractions(recipeStepRepository);

        log.info("Успешно проверили, что saveRecipe сохраняет только рецепт и не сохраняет шаги, если steps равен null");
    }
}