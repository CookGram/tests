package com.cook_app.component;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class JwtFilterTest {

    private static final Logger log = LoggerFactory.getLogger(JwtFilterTest.class);

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilter_withoutValidBearerToken_doesNotAuthenticate_butCallsChain() throws Exception {
        log.info("Проверяем, что без Bearer-токена в заголовке Authorization аутентификация не устанавливается");

        JwtProvider jwtProvider = mock(JwtProvider.class);
        JwtFilter filter = new JwtFilter(jwtProvider);

        MockHttpServletRequest req = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
        verifyNoInteractions(jwtProvider);
        verifyNoMoreInteractions(chain);

        log.info("Успешно проверили, что без Bearer-токена в заголовке Authorization аутентификация не устанавливается");
    }

    @Test
    void doFilter_withValidBearerToken_setsAuthentication_andCallsChain() throws Exception {
        log.info("Проверяем, что при заголовке Authorization=Bearer ok и валидном токене устанавливается аутентификация");

        JwtProvider jwtProvider = mock(JwtProvider.class);
        when(jwtProvider.validateAccessToken("ok")).thenReturn(true);
        when(jwtProvider.getAccessClaims("ok")).thenReturn(mock(Claims.class));

        JwtFilter filter = new JwtFilter(jwtProvider);

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer ok");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().isAuthenticated()).isTrue();

        verify(jwtProvider).validateAccessToken("ok");
        verify(jwtProvider).getAccessClaims("ok");
        verify(chain).doFilter(req, res);
        verifyNoMoreInteractions(jwtProvider, chain);

        log.info("Успешно проверили, что при заголовке Authorization=Bearer ok и валидном токене устанавливается аутентификация");
    }

    @Test
    void doFilter_authorizationHeaderBearerWithoutSpace_isIgnored_equivalenceClass() throws Exception {
        log.info("Проверяем класс эквивалентности: Authorization=Bearer (без пробела) не считается Bearer-токеном и игнорируется");

        JwtProvider jwtProvider = mock(JwtProvider.class);
        JwtFilter filter = new JwtFilter(jwtProvider);

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
        verifyNoInteractions(jwtProvider);
        verifyNoMoreInteractions(chain);

        log.info("Успешно проверили класс эквивалентности: Authorization=Bearer (без пробела) не считается Bearer-токеном и игнорируется");
    }

    @Test
    void doFilter_authorizationHeaderLeadingSpaceBeforeBearer_isIgnored_equivalenceClass() throws Exception {
        log.info("Проверяем класс эквивалентности: Authorization начинается с пробела (\" Bearer ok\"), поэтому токен не извлекается и игнорируется");

        JwtProvider jwtProvider = mock(JwtProvider.class);
        JwtFilter filter = new JwtFilter(jwtProvider);

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", " Bearer ok");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
        verifyNoInteractions(jwtProvider);
        verifyNoMoreInteractions(chain);

        log.info("Успешно проверили класс эквивалентности: Authorization начинается с пробела (\" Bearer ok\"), поэтому токен не извлекается и игнорируется");
    }

    @Test
    void doFilter_authorizationHeaderBearerSpaceEmptyToken_boundaryCondition() throws Exception {
        log.info("Проверяем граничное условие: Authorization=Bearer (с пробелом) и пустой токен, ожидаем что аутентификация не установится");

        JwtProvider jwtProvider = mock(JwtProvider.class);
        JwtFilter filter = new JwtFilter(jwtProvider);

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer ");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();

        verify(jwtProvider).validateAccessToken("");
        verify(jwtProvider, never()).getAccessClaims(any());
        verify(chain).doFilter(req, res);
        verifyNoMoreInteractions(jwtProvider, chain);

        log.info("Успешно проверили граничное условие: Authorization=Bearer (с пробелом) и пустой токен, аутентификация не установилась");
    }

    @Test
    void doFilter_authorizationHeaderBearerToken_parsesToken_equivalenceClass() throws Exception {
        log.info("Проверяем класс эквивалентности: валидный формат Authorization=Bearer 123 извлекает токен 123 и устанавливает аутентификацию");

        JwtProvider jwtProvider = mock(JwtProvider.class);
        when(jwtProvider.validateAccessToken("123")).thenReturn(true);
        when(jwtProvider.getAccessClaims("123")).thenReturn(mock(Claims.class));

        JwtFilter filter = new JwtFilter(jwtProvider);

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer 123");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().isAuthenticated()).isTrue();

        verify(jwtProvider).validateAccessToken("123");
        verify(jwtProvider).getAccessClaims("123");
        verify(chain).doFilter(req, res);
        verifyNoMoreInteractions(jwtProvider, chain);

        log.info("Успешно проверили класс эквивалентности: валидный формат Authorization=Bearer 123 извлекает токен 123 и устанавливает аутентификацию");
    }
}