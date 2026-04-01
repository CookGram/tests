package com.cook_app.controller;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.dto.AccountDTO;
import com.cook_app.service.FollowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/subscription")
@CrossOrigin(origins = "http://localhost:3000")
public class FollowController {

    private static final Logger log = LoggerFactory.getLogger(FollowController.class);

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    /**
     * GET /api/subscription
     * Получить всех пользователей, на которых ты подписан.
     */
    @GetMapping
    public ResponseEntity<List<AccountDTO>> getSubscriptions(@RequestParam Long userId) {
        log.info("Запрос GET /api/subscription для userId={}", userId);
        try {
            List<Account> accounts = followService.getSubscriptions(userId);
            List<AccountDTO> dtos = accounts.stream()
                    .map(AccountDTO::new)
                    .collect(Collectors.toList());
            log.info("Успешно получены подписки для userId={}, данные={}", userId, dtos);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Ошибка при получении подписок для userId={}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/subscription/{id}
     * Подписаться на пользователя.
     */
    @PostMapping("/{id}")
    public ResponseEntity<Void> subscribe(@PathVariable("id") Long targetUserId,
                                          @RequestParam Long userId) {
        log.info("Запрос POST /api/subscription/{} от userId={}", targetUserId, userId);
        try {
            followService.subscribe(userId, targetUserId);
            log.info("Успешно выполнена подписка: userId={} -> targetUserId={}", userId, targetUserId);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Ошибка при подписке userId={} на targetUserId={}", userId, targetUserId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * DELETE /api/subscription/{id}
     * Отписаться от пользователя.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> unsubscribe(@PathVariable("id") Long targetUserId,
                                            @RequestParam Long userId) {
        log.info("Запрос DELETE /api/subscription/{} от userId={}", targetUserId, userId);
        try {
            followService.unsubscribe(userId, targetUserId);
            log.info("Успешно выполнена отписка: userId={} от targetUserId={}", userId, targetUserId);
            return ResponseEntity.noContent().build(); // 204
        } catch (Exception e) {
            log.error("Ошибка при отписке userId={} от targetUserId={}", userId, targetUserId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
