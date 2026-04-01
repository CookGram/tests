package com.cook_app.service.impl;

import com.cook_app.component.JwtProvider;
import com.cook_app.entieties.Account;
import com.cook_app.entieties.jwt.JwtRequest;
import com.cook_app.entieties.jwt.JwtResponse;
import com.cook_app.service.AccountService;
import jakarta.security.auth.message.AuthException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImplTest.class);

    @Mock
    AccountService accountService;

    @Mock
    JwtProvider jwtProvider;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    AuthServiceImpl authService;

    @Test
    void login_success_generatesTokensAndStoresRefresh() throws Exception {
        log.info("Проверяем, что login возвращает токены при корректных email и пароле");

        JwtRequest req = mock(JwtRequest.class);
        when(req.getEmail()).thenReturn("user@example.com");
        when(req.getPassword()).thenReturn("plain");

        Account acc = mock(Account.class);
        when(acc.getLogin()).thenReturn("user");
        when(acc.getPassword()).thenReturn("HASH");

        when(accountService.getByEmail("user@example.com")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("plain", "HASH")).thenReturn(true);

        when(jwtProvider.generateAccessToken(acc)).thenReturn("AT");
        when(jwtProvider.generateRefreshToken(acc)).thenReturn("RT");

        JwtResponse res = authService.login(req);

        assertThat(res).isNotNull();
        verify(jwtProvider).generateAccessToken(acc);
        verify(jwtProvider).generateRefreshToken(acc);

        log.info("Успешно проверили, что login возвращает токены при корректных email и пароле");
    }

    @Test
    void login_wrongPassword_throws() throws Exception {
        log.info("Проверяем, что login выбрасывает AuthException при неверном пароле");

        JwtRequest req = mock(JwtRequest.class);
        when(req.getEmail()).thenReturn("user@example.com");
        when(req.getPassword()).thenReturn("plain");

        Account acc = mock(Account.class);
        when(acc.getPassword()).thenReturn("HASH");

        when(accountService.getByEmail("user@example.com")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("plain", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(AuthException.class);

        verify(jwtProvider, never()).generateAccessToken(any());
        verify(jwtProvider, never()).generateRefreshToken(any());

        log.info("Успешно проверили, что login выбрасывает AuthException при неверном пароле");
    }

    @Test
    void getAccessToken_invalidRefresh_returnsNullTokens() throws Exception {
        log.info("Проверяем, что getAccessToken возвращает null-токены при невалидном refresh-токене");

        when(jwtProvider.validateRefreshToken("BAD")).thenReturn(false);

        JwtResponse res = authService.getAccessToken("BAD");

        assertThat(res).isNotNull();
        verify(jwtProvider).validateRefreshToken("BAD");
        verify(jwtProvider, never()).getRefreshClaims(anyString());

        log.info("Успешно проверили, что getAccessToken возвращает null-токены при невалидном refresh-токене");
    }

    @Test
    void refresh_invalidRefresh_throws() {
        log.info("Проверяем, что refresh выбрасывает AuthException при невалидном refresh-токене");

        when(jwtProvider.validateRefreshToken("BAD")).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh("BAD"))
                .isInstanceOf(AuthException.class);

        verify(jwtProvider).validateRefreshToken("BAD");
        verify(jwtProvider, never()).getRefreshClaims(anyString());

        log.info("Успешно проверили, что refresh выбрасывает AuthException при невалидном refresh-токене");
    }
}