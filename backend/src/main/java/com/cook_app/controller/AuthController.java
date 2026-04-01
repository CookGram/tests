package com.cook_app.controller;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.dto.AccountProfileDTO;
import com.cook_app.entieties.dto.UpdateAccountRequest;
import com.cook_app.entieties.jwt.JwtRequest;
import com.cook_app.entieties.jwt.JwtResponse;
import com.cook_app.entieties.jwt.RefreshJwtRequest;
import com.cook_app.service.AccountService;
import com.cook_app.service.AuthService;
import jakarta.security.auth.message.AuthException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final AccountService accountService;

    public AuthController(AuthService authService, AccountService accountService) {
        this.authService = authService;
        this.accountService = accountService;
    }

    @PostMapping("account/login")
    public ResponseEntity<JwtResponse> login(@RequestBody JwtRequest authRequest) throws AuthException {
        try {
            final JwtResponse token = authService.login(authRequest);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            log.error("Ошибка при логине:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("account/token")
    public ResponseEntity<JwtResponse> getNewAccessToken(@RequestBody RefreshJwtRequest request) throws AuthException {
        try {
            final JwtResponse token = authService.getAccessToken(request.getRefreshToken());
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            log.error("Ошибка при получении токена:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("account/refresh")
    public ResponseEntity<JwtResponse> getNewRefreshToken(@RequestBody RefreshJwtRequest request) throws AuthException {
        try {
            final JwtResponse token = authService.refresh(request.getRefreshToken());
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            log.error("Ошибка при обновлении токена:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("account/auth")
    public ResponseEntity<?> createAccount(@RequestBody Account account) {
        try {
            return new ResponseEntity<>(accountService.createAccount(account), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            log.error("Ошибка при создании аккаунта:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("account/profile")
    public ResponseEntity<AccountProfileDTO> getAccountProfile(@RequestParam String email) {
        try {
            return accountService.getByEmail(email)
                    .map(AccountProfileDTO::new)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (Exception e) {
            log.error("Ошибка при получении информации о профиле:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("account/{id}")
    public ResponseEntity<?> updateAccount(
            @PathVariable Long id,
            @RequestBody UpdateAccountRequest request
    ) {
        try {
            Account updated = accountService.updateAccount(id, request);
            return ResponseEntity.ok(new AccountProfileDTO(updated));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error while updating profile");
        }
    }
}