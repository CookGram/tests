package com.cook_app.entieties.dto;

import com.cook_app.entieties.RecipeStep;

public class RecipeStepDTO {
    private Long id;
    private Short stepNo;
    private String description;
    private byte[] imageData;

    public RecipeStepDTO() {}

    public RecipeStepDTO(RecipeStep step) {
        this.id = step.getId();
        this.stepNo = step.getStepNo();
        this.description = step.getDescription();
        this.imageData = step.getImageData();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Short getStepNo() {
        return stepNo;
    }

    public void setStepNo(Short stepNo) {
        this.stepNo = stepNo;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public byte[] getImageData() {
        return imageData;
    }

    public void setImageData(byte[] imageData) {
        this.imageData = imageData;
    }
}
