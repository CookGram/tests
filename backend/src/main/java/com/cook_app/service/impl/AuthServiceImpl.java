package com.cook_app.service.impl;

import com.cook_app.component.JwtProvider;
import com.cook_app.entieties.Account;
import com.cook_app.entieties.jwt.JwtAuthentication;
import com.cook_app.entieties.jwt.JwtRequest;
import com.cook_app.entieties.jwt.JwtResponse;
import com.cook_app.service.AccountService;
import com.cook_app.service.AuthService;
import io.jsonwebtoken.Claims;
import jakarta.security.auth.message.AuthException;
import lombok.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    private final AccountService accountService;
    private final Map<String, String> refreshStorage = new HashMap<>();
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AccountService accountService, JwtProvider jwtProvider, PasswordEncoder passwordEncoder) {
        this.accountService = accountService;
        this.jwtProvider = jwtProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public JwtResponse login(JwtRequest authRequest) throws AuthException {
        final Account account = accountService.getByEmail(authRequest.getEmail())
                .orElseThrow(() -> new AuthException("Пользователь не найден"));

        if (!passwordEncoder.matches(authRequest.getPassword(), account.getPassword())) {
            throw new AuthException("Неправильный пароль");
        }

        final String accessToken = jwtProvider.generateAccessToken(account);
        final String refreshToken = jwtProvider.generateRefreshToken(account);

        refreshStorage.put(account.getLogin(), refreshToken);

        return new JwtResponse(accessToken, refreshToken);
    }

    @Override
    public JwtResponse getAccessToken(@NonNull String refreshToken) throws AuthException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            final Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            final String username = claims.getSubject(); // subject = login

            final String savedRefreshToken = refreshStorage.get(username);
            if (savedRefreshToken != null && savedRefreshToken.equals(refreshToken)) {
                final Account account = accountService.getByLogin(username)
                        .orElseThrow(() -> new AuthException("Пользователь не найден"));

                final String accessToken = jwtProvider.generateAccessToken(account);
                return new JwtResponse(accessToken, null);
            }
        }
        return new JwtResponse(null, null);
    }

    @Override
    public JwtResponse refresh(String refreshToken) throws AuthException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            final Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            final String username = claims.getSubject(); // subject = login

            final String savedRefreshToken = refreshStorage.get(username);
            if (savedRefreshToken != null && savedRefreshToken.equals(refreshToken)) {
                final Account account = accountService.getByLogin(username)
                        .orElseThrow(() -> new AuthException("Пользователь не найден"));

                final String accessToken = jwtProvider.generateAccessToken(account);
                final String newRefreshToken = jwtProvider.generateRefreshToken(account);

                refreshStorage.put(account.getLogin(), newRefreshToken);
                return new JwtResponse(accessToken, newRefreshToken);
            }
        }
        throw new AuthException("Невалидный JWT токен");
    }

    @Override
    public JwtAuthentication getAuthInfo() {
        return (JwtAuthentication) SecurityContextHolder.getContext().getAuthentication();
    }
}
