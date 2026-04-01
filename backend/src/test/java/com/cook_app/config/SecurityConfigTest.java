package com.cook_app.config;

import com.cook_app.component.JwtFilter;
import com.cook_app.service.impl.AccountDetailsService;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecurityConfigTest {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfigTest.class);

    @Test
    void passwordEncoder_isBCrypt() {
        log.info("Проверяем, что SecurityConfig.passwordEncoder() возвращает BCryptPasswordEncoder");

        SecurityConfig cfg = new SecurityConfig(mock(JwtFilter.class), mock(AccountDetailsService.class));

        PasswordEncoder enc = cfg.passwordEncoder();

        assertThat(enc).isNotNull();
        assertThat(enc).isInstanceOf(BCryptPasswordEncoder.class);

        log.info("Успешно проверили, что SecurityConfig.passwordEncoder() возвращает BCryptPasswordEncoder");
    }

    @Test
    void authenticationProvider_isDao_andCreated() {
        log.info("Проверяем, что SecurityConfig.authenticationProvider() создаёт DaoAuthenticationProvider");

        AccountDetailsService ads = mock(AccountDetailsService.class);
        SecurityConfig cfg = new SecurityConfig(mock(JwtFilter.class), ads);

        AuthenticationProvider provider = cfg.authenticationProvider();

        assertThat(provider).isNotNull();
        assertThat(provider).isInstanceOf(DaoAuthenticationProvider.class);

        log.info("Успешно проверили, что SecurityConfig.authenticationProvider() создаёт DaoAuthenticationProvider");
    }
}