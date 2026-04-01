package com.cook_app.repository;

import com.cook_app.entieties.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query("SELECT r FROM Recipe r ORDER BY r.createdAt DESC")
    List<Recipe> findAllRecipes();

    @Query("SELECT r FROM Recipe r WHERE r.authorId IN" +
            " (SELECT s.followeeId FROM Follow s WHERE s.followerId = :userId) " +
            "ORDER BY r.createdAt DESC")
    List<Recipe> findSubscribedAuthorsRecipes(@Param("userId") Long userId);

    @Query("SELECT r FROM Recipe r LEFT JOIN FETCH r.steps WHERE r.id = :id")
    Optional<Recipe> findByIdWithSteps(@Param("id") Long id);

    List<Recipe> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

}
