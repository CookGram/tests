package com.cook_app.controller;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.Recipe;
import com.cook_app.entieties.RecipeStep;
import com.cook_app.entieties.dto.RecipeDTO;
import com.cook_app.service.AccountService;
import com.cook_app.service.RecipeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "http://localhost:3000")
public class RecipeController {

    private static final Logger log = LoggerFactory.getLogger(RecipeController.class);

    private final RecipeService recipeService;
    private final AccountService accountService;

    public RecipeController(RecipeService recipeService,
                            AccountService accountService) {
        this.recipeService = recipeService;
        this.accountService = accountService;
    }

    private String resolveAuthorName(Long authorId) {
        if (authorId == null) {
            return null;
        }
        try {
            Account author = accountService.getAccountById(authorId);
            return author != null ? author.getLogin() : null;
        } catch (Exception e) {
            log.warn("Не удалось получить автора по id={}", authorId, e);
            return null;
        }
    }

    @GetMapping
    public ResponseEntity<List<RecipeDTO>> getAllRecipes() {
        log.info("Запрос GET /api/recipes");
        try {
            List<Recipe> recipes = recipeService.getAllRecipes();
            List<RecipeDTO> recipeDTOs = recipes.stream()
                    .map(recipe -> {
                        String authorLogin = resolveAuthorName(recipe.getAuthorId());
                        return new RecipeDTO(recipe, authorLogin);
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(recipeDTOs);
        } catch (Exception e) {
            log.error("Ошибка при получении всех рецептов", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/subscribed")
    public ResponseEntity<List<RecipeDTO>> getSubscribedAuthorsRecipes(@RequestParam Long userId) {
        log.info("Запрос GET /api/recipes/subscribed?userId={}", userId);
        try {
            List<Recipe> recipes = recipeService.getSubscribedAuthorsRecipes(userId);
            List<RecipeDTO> recipeDTOs = recipes.stream()
                    .map(recipe -> {
                        String authorLogin = resolveAuthorName(recipe.getAuthorId());
                        return new RecipeDTO(recipe, authorLogin);
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(recipeDTOs);
        } catch (Exception e) {
            log.error("Ошибка при получении рецептов подписок для userId={}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<RecipeDTO>> getRecipesByAuthor(@PathVariable Long authorId) {
        log.info("Запрос GET /api/recipes/author/{}", authorId);
        try {
            List<Recipe> recipes = recipeService.getRecipesByAuthor(authorId);
            List<RecipeDTO> recipeDTOs = recipes.stream()
                    .map(recipe -> {
                        String authorLogin = resolveAuthorName(recipe.getAuthorId());
                        return new RecipeDTO(recipe, authorLogin);
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(recipeDTOs);
        } catch (Exception e) {
            log.error("Ошибка при получении рецептов автора authorId={}", authorId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{recipeId}")
    public ResponseEntity<RecipeDTO> getRecipeById(@PathVariable Long recipeId) {
        log.info("Запрос GET /api/recipes/{}", recipeId);
        try {
            Recipe recipe = recipeService.getRecipeById(recipeId);
            String authorLogin = resolveAuthorName(recipe.getAuthorId());
            return ResponseEntity.ok(new RecipeDTO(recipe, authorLogin));
        } catch (Exception e) {
            log.error("Ошибка при получении рецепта recipeId={}", recipeId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/save")
    public ResponseEntity<RecipeDTO> saveRecipe(@RequestBody RecipeDTO recipeDTO) {
        log.info("Запрос POST /api/recipes/save, данные={}", recipeDTO);
        try {
            Recipe recipe = new Recipe();
            recipe.setAuthorId(recipeDTO.getAuthorId());
            recipe.setTitle(recipeDTO.getTitle());
            recipe.setImageData(recipeDTO.getImageData());

            if (recipeDTO.getSteps() != null) {
                List<RecipeStep> steps = recipeDTO.getSteps().stream()
                        .map(stepDTO -> {
                            RecipeStep step = new RecipeStep();
                            step.setStepNo(stepDTO.getStepNo());
                            step.setDescription(stepDTO.getDescription());
                            step.setImageData(stepDTO.getImageData());
                            step.setRecipe(recipe); // важно не забыть связь
                            return step;
                        })
                        .collect(Collectors.toList());
                recipe.setSteps(steps);
            }

            Recipe savedRecipe = recipeService.saveRecipe(recipe);
            String authorLogin = resolveAuthorName(savedRecipe.getAuthorId());
            RecipeDTO savedDto = new RecipeDTO(savedRecipe, authorLogin);
            log.info("Успешно сохранён рецепт, данные={}", savedDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedDto);
        } catch (Exception e) {
            log.error("Ошибка при сохранении рецепта для автора authorId={}", recipeDTO.getAuthorId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
