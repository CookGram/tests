package com.cook_app.service;

import com.cook_app.entieties.Recipe;

import java.util.List;

public interface RecipeService {
     List<Recipe> getAllRecipes();
    List<Recipe> getSubscribedAuthorsRecipes(Long userId);
    List<Recipe> getRecipesByAuthor(Long authorId);
    Recipe getRecipeById(Long recipeId);
    Recipe saveRecipe(Recipe recipe);
}
