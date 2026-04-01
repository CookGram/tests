package com.cook_app.controller;

import com.cook_app.entieties.jwt.JwtResponse;
import com.cook_app.service.AccountService;
import com.cook_app.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerAdditionalTest {

    private static final Logger log = LoggerFactory.getLogger(AuthControllerAdditionalTest.class);

    private AuthService authService;
    private AccountService accountService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        accountService = mock(AccountService.class);

        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        AuthController controller = new AuthController(authService, accountService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    private static String jsonString(String value) {
        return "\"" + value.replace("\"", "\\\"") + "\"";
    }

    @Test
    void token_returns200_onSuccess() throws Exception {
        log.info("Проверяем, что POST /api/account/token возвращает 200 при успешном получении access-токена");

        when(authService.getAccessToken("RT")).thenReturn(new JwtResponse("AT", null));

        mockMvc.perform(post("/api/account/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString("RT")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

        verify(authService).getAccessToken("RT");
        verifyNoMoreInteractions(authService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что POST /api/account/token возвращает 200 при успешном получении access-токена");
    }

    @Test
    void token_returns500_onException() throws Exception {
        log.info("Проверяем, что POST /api/account/token возвращает 500, если AuthService выбрасывает исключение");

        when(authService.getAccessToken("RT")).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(post("/api/account/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString("RT")))
                .andExpect(status().isInternalServerError());

        verify(authService).getAccessToken("RT");
        verifyNoMoreInteractions(authService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что POST /api/account/token возвращает 500, если AuthService выбрасывает исключение");
    }

    @Test
    void refresh_returns200_onSuccess() throws Exception {
        log.info("Проверяем, что POST /api/account/refresh возвращает 200 при успешном обновлении refresh-токена");

        when(authService.refresh("RT")).thenReturn(new JwtResponse("AT", "NEW_RT"));

        mockMvc.perform(post("/api/account/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString("RT")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

        verify(authService).refresh("RT");
        verifyNoMoreInteractions(authService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что POST /api/account/refresh возвращает 200 при успешном обновлении refresh-токена");
    }

    @Test
    void refresh_returns500_onException() throws Exception {
        log.info("Проверяем, что POST /api/account/refresh возвращает 500, если AuthService выбрасывает исключение");

        when(authService.refresh("RT")).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(post("/api/account/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonString("RT")))
                .andExpect(status().isInternalServerError());

        verify(authService).refresh("RT");
        verifyNoMoreInteractions(authService);
        verifyNoInteractions(accountService);

        log.info("Успешно проверили, что POST /api/account/refresh возвращает 500, если AuthService выбрасывает исключение");
    }

    @Test
    void getAccountProfile_returns500_whenServiceThrows() throws Exception {
        log.info("Проверяем, что GET /api/account/profile возвращает 500, если AccountService выбрасывает исключение");

        when(accountService.getByEmail("a@b.com")).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/api/account/profile").param("email", "a@b.com"))
                .andExpect(status().isInternalServerError());

        verify(accountService).getByEmail("a@b.com");
        verifyNoMoreInteractions(accountService);
        verifyNoInteractions(authService);

        log.info("Успешно проверили, что GET /api/account/profile возвращает 500, если AccountService выбрасывает исключение");
    }
}