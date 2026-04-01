package com.cook_app.entieties.dto;

import com.cook_app.entieties.Recipe;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class RecipeDTO {
    private Long id;
    private Long authorId;
    private String authorLogin;
    private String title;
    private byte[] imageData;
    private LocalDateTime createdAt;
    private List<RecipeStepDTO> steps;

    public RecipeDTO() {}

    public RecipeDTO(Recipe recipe, String authorLogin) {
        this.id = recipe.getId();
        this.authorId = Long.valueOf(recipe.getAuthorId());
        this.authorLogin = authorLogin;
        this.title = recipe.getTitle();
        this.imageData = recipe.getImageData();
        this.createdAt = recipe.getCreatedAt();

        if (recipe.getSteps() != null) {
            this.steps = recipe.getSteps().stream()
                    .map(RecipeStepDTO::new)
                    .collect(Collectors.toList());
        }
    }

    public String getAuthorLogin() {
        return authorLogin;
    }

    public void setAuthorLogin(String authorLogin) {
        this.authorLogin = authorLogin;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public byte[] getImageData() {
        return imageData;
    }

    public void setImageData(byte[] imageData) {
        this.imageData = imageData;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<RecipeStepDTO> getSteps() {
        return steps;
    }

    public void setSteps(List<RecipeStepDTO> steps) {
        this.steps = steps;
    }
}
