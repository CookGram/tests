package com.cook_app.service.impl;

import com.cook_app.entieties.Recipe;
import com.cook_app.entieties.RecipeStep;
import com.cook_app.repository.RecipeRepository;
import com.cook_app.repository.RecipeStepRepository;
import com.cook_app.service.RecipeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RecipeServiceImpl implements RecipeService {

    private static final Logger log = LoggerFactory.getLogger(RecipeServiceImpl.class);

    private final RecipeRepository recipeRepository;
    private final RecipeStepRepository recipeStepRepository;

    public RecipeServiceImpl(RecipeRepository recipeRepository,
                             RecipeStepRepository recipeStepRepository) {
        this.recipeRepository = recipeRepository;
        this.recipeStepRepository = recipeStepRepository;
    }

    @Override
    public List<Recipe> getAllRecipes() {
        log.info("Получение списка всех рецептов");
        List<Recipe> recipes = recipeRepository.findAllRecipes();
        log.info("Успешно получен список всех рецептов, данные={}", recipes);
        return recipes;
    }

    @Override
    public List<Recipe> getSubscribedAuthorsRecipes(Long userId) {
        log.info("Получение рецептов из подписок для userId={}", userId);
        List<Recipe> recipes = recipeRepository.findSubscribedAuthorsRecipes(userId);
        log.info("Успешно получены рецепты из подписок для userId={}, данные={}", userId, recipes);
        return recipes;
    }

    @Override
    public List<Recipe> getRecipesByAuthor(Long authorId) {
        log.info("Получение рецептов для автора authorId={}", authorId);
        List<Recipe> recipes = recipeRepository.findByAuthorIdOrderByCreatedAtDesc(authorId);
        log.info("Успешно получены рецепты для автора authorId={}, данные={}", authorId, recipes);
        return recipes;
    }

    @Override
    public Recipe getRecipeById(Long recipeId) {
        log.info("Получение рецепта по id={}", recipeId);
        return recipeRepository.findByIdWithSteps(recipeId)
                .orElseThrow(() -> {
                    log.warn("Рецепт с id={} не найден", recipeId);
                    return new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Рецепт не найден");
                });
    }

    @Override
    public Recipe saveRecipe(Recipe recipe) {
        log.info("Сохранение рецепта для автора authorId={}, данные={}",
                recipe.getAuthorId(), recipe);
        Recipe savedRecipe = recipeRepository.save(recipe);

        if (recipe.getSteps() != null) {
            for (RecipeStep step : recipe.getSteps()) {
                step.setRecipe(savedRecipe);
                recipeStepRepository.save(step);
            }
            log.info("Успешно сохранён рецепт id={} с шагами={}", savedRecipe.getId(), recipe.getSteps());
        } else {
            log.info("Успешно сохранён рецепт id={} без шагов", savedRecipe.getId());
        }

        return savedRecipe;
    }
}
