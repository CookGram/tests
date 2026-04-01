package com.cook_app.service.impl;

import com.cook_app.component.JwtProvider;
import com.cook_app.entieties.Account;
import com.cook_app.entieties.jwt.JwtAuthentication;
import com.cook_app.entieties.jwt.JwtRequest;
import com.cook_app.entieties.jwt.JwtResponse;
import com.cook_app.service.AccountService;
import io.jsonwebtoken.Claims;
import jakarta.security.auth.message.AuthException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplAdditionalTest {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImplAdditionalTest.class);

    @Mock AccountService accountService;
    @Mock JwtProvider jwtProvider;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(accountService, jwtProvider, passwordEncoder);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAccessToken_success_returnsAccessToken_whenRefreshValidAndMatchesStored() throws Exception {
        log.info("Проверяем, что getAccessToken возвращает access-токен, если refresh валиден и совпадает с сохранённым");

        JwtRequest loginReq = mock(JwtRequest.class);
        when(loginReq.getEmail()).thenReturn("user@example.com");
        when(loginReq.getPassword()).thenReturn("plain");

        Account acc = mock(Account.class);
        when(acc.getLogin()).thenReturn("user");
        when(acc.getPassword()).thenReturn("HASH");

        when(accountService.getByEmail("user@example.com")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("plain", "HASH")).thenReturn(true);

        when(jwtProvider.generateAccessToken(acc)).thenReturn("AT1");
        when(jwtProvider.generateRefreshToken(acc)).thenReturn("RT1");

        authService.login(loginReq);

        when(jwtProvider.validateRefreshToken("RT1")).thenReturn(true);
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("user");
        when(jwtProvider.getRefreshClaims("RT1")).thenReturn(claims);

        when(accountService.getByLogin("user")).thenReturn(Optional.of(acc));
        when(jwtProvider.generateAccessToken(acc)).thenReturn("AT2");

        JwtResponse res = authService.getAccessToken("RT1");

        assertThat(res).isNotNull();
        assertThat(res.getAccessToken()).isEqualTo("AT2");
        assertThat(res.getRefreshToken()).isNull();

        log.info("Успешно проверили, что getAccessToken возвращает access-токен, если refresh валиден и совпадает с сохранённым");
    }

    @Test
    void getAccessToken_returnsNullTokens_whenRefreshValidButNotEqualStored() throws Exception {
        log.info("Проверяем, что getAccessToken возвращает null-токены, если refresh валиден, но не совпадает с сохранённым");

        JwtRequest loginReq = mock(JwtRequest.class);
        when(loginReq.getEmail()).thenReturn("user@example.com");
        when(loginReq.getPassword()).thenReturn("plain");

        Account acc = mock(Account.class);
        when(acc.getLogin()).thenReturn("user");
        when(acc.getPassword()).thenReturn("HASH");

        when(accountService.getByEmail("user@example.com")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("plain", "HASH")).thenReturn(true);

        when(jwtProvider.generateAccessToken(acc)).thenReturn("AT1");
        when(jwtProvider.generateRefreshToken(acc)).thenReturn("RT1");

        authService.login(loginReq);

        clearInvocations(jwtProvider);

        when(jwtProvider.validateRefreshToken("OTHER")).thenReturn(true);
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("user");
        when(jwtProvider.getRefreshClaims("OTHER")).thenReturn(claims);

        JwtResponse res = authService.getAccessToken("OTHER");

        assertThat(res.getAccessToken()).isNull();
        assertThat(res.getRefreshToken()).isNull();
        verify(jwtProvider, never()).generateAccessToken(any());

        log.info("Успешно проверили, что getAccessToken возвращает null-токены, если refresh валиден, но не совпадает с сохранённым");
    }

    @Test
    void getAccessToken_throwsAuthException_whenAccountNotFound() throws Exception {
        log.info("Проверяем, что getAccessToken выбрасывает AuthException, если аккаунт не найден по логину из refresh-токена");

        JwtRequest loginReq = mock(JwtRequest.class);
        when(loginReq.getEmail()).thenReturn("user@example.com");
        when(loginReq.getPassword()).thenReturn("plain");

        Account acc = mock(Account.class);
        when(acc.getLogin()).thenReturn("user");
        when(acc.getPassword()).thenReturn("HASH");

        when(accountService.getByEmail("user@example.com")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("plain", "HASH")).thenReturn(true);

        when(jwtProvider.generateAccessToken(acc)).thenReturn("AT1");
        when(jwtProvider.generateRefreshToken(acc)).thenReturn("RT1");

        authService.login(loginReq);

        when(jwtProvider.validateRefreshToken("RT1")).thenReturn(true);
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("user");
        when(jwtProvider.getRefreshClaims("RT1")).thenReturn(claims);

        when(accountService.getByLogin("user")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getAccessToken("RT1"))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("Пользователь не найден");

        log.info("Успешно проверили, что getAccessToken выбрасывает AuthException, если аккаунт не найден по логину из refresh-токена");
    }

    @Test
    void refresh_success_rotatesRefreshToken_whenValidAndMatchesStored() throws Exception {
        log.info("Проверяем, что refresh возвращает новые токены и выполняет ротацию refresh, если refresh валиден и совпадает с сохранённым");

        JwtRequest loginReq = mock(JwtRequest.class);
        when(loginReq.getEmail()).thenReturn("user@example.com");
        when(loginReq.getPassword()).thenReturn("plain");

        Account acc = mock(Account.class);
        when(acc.getLogin()).thenReturn("user");
        when(acc.getPassword()).thenReturn("HASH");

        when(accountService.getByEmail("user@example.com")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("plain", "HASH")).thenReturn(true);

        when(jwtProvider.generateAccessToken(acc)).thenReturn("AT1");
        when(jwtProvider.generateRefreshToken(acc)).thenReturn("RT1");

        authService.login(loginReq);

        when(jwtProvider.validateRefreshToken("RT1")).thenReturn(true);
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("user");
        when(jwtProvider.getRefreshClaims("RT1")).thenReturn(claims);

        when(accountService.getByLogin("user")).thenReturn(Optional.of(acc));

        when(jwtProvider.generateAccessToken(acc)).thenReturn("AT2");
        when(jwtProvider.generateRefreshToken(acc)).thenReturn("RT2");

        JwtResponse res = authService.refresh("RT1");

        assertThat(res.getAccessToken()).isEqualTo("AT2");
        assertThat(res.getRefreshToken()).isEqualTo("RT2");

        when(jwtProvider.validateRefreshToken("RT1")).thenReturn(true);
        when(jwtProvider.getRefreshClaims("RT1")).thenReturn(claims);

        assertThatThrownBy(() -> authService.refresh("RT1"))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("Невалидный JWT токен");

        log.info("Успешно проверили, что refresh возвращает новые токены и выполняет ротацию refresh, если refresh валиден и совпадает с сохранённым");
    }

    @Test
    void getAuthInfo_returnsAuthenticationFromSecurityContext() {
        log.info("Проверяем, что getAuthInfo возвращает объект аутентификации из SecurityContextHolder");

        JwtAuthentication auth = mock(JwtAuthentication.class);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThat(authService.getAuthInfo()).isSameAs(auth);

        log.info("Успешно проверили, что getAuthInfo возвращает объект аутентификации из SecurityContextHolder");
    }
}