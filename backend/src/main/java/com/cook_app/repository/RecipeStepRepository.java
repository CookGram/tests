package com.cook_app.repository;

import com.cook_app.entieties.RecipeStep;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeStepRepository  extends JpaRepository<RecipeStep, Long> {
}
