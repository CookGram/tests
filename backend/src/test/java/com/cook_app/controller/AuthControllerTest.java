package com.cook_app.controller;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.dto.UpdateAccountRequest;
import com.cook_app.entieties.jwt.JwtRequest;
import com.cook_app.entieties.jwt.JwtResponse;
import com.cook_app.service.AccountService;
import com.cook_app.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private static final Logger log = LoggerFactory.getLogger(AuthControllerTest.class);

    private AuthService authService;
    private AccountService accountService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        accountService = mock(AccountService.class);

        objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        AuthController controller = new AuthController(authService, accountService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void login_returns200_onSuccess() throws Exception {
        log.info("Проверяем, что POST /api/account/login возвращает 200 при успешном логине");

        JwtResponse resp = new JwtResponse("access", "refresh");
        when(authService.login(any(JwtRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/account/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new JwtRequest("user", "pass"))))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

        verify(authService).login(any(JwtRequest.class));
        verifyNoMoreInteractions(authService);

        log.info("Успешно проверили, что POST /api/account/login возвращает 200 при успешном логине");
    }

    @Test
    void login_returns500_onException() throws Exception {
        log.info("Проверяем, что POST /api/account/login возвращает 500, если AuthService выбрасывает исключение");

        when(authService.login(any(JwtRequest.class))).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(post("/api/account/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new JwtRequest("user", "pass"))))
                .andExpect(status().isInternalServerError());

        verify(authService).login(any(JwtRequest.class));
        verifyNoMoreInteractions(authService);

        log.info("Успешно проверили, что POST /api/account/login возвращает 500, если AuthService выбрасывает исключение");
    }

    @Test
    void createAccount_returns201_onSuccess() throws Exception {
        log.info("Проверяем, что POST /api/account/auth возвращает 201 при успешном создании аккаунта");

        Account created = new Account();
        when(accountService.createAccount(any(Account.class))).thenReturn(created);

        mockMvc.perform(post("/api/account/auth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"e@e.com\",\"login\":\"u\",\"password\":\"p\"}"))
                .andExpect(status().isCreated());

        verify(accountService).createAccount(any(Account.class));
        verifyNoMoreInteractions(accountService);

        log.info("Успешно проверили, что POST /api/account/auth возвращает 201 при успешном создании аккаунта");
    }

    @Test
    void createAccount_returns500_onIllegalArgumentException() throws Exception {
        log.info("Проверяем, что POST /api/account/auth возвращает 500, если AccountService выбрасывает IllegalArgumentException");

        when(accountService.createAccount(any(Account.class))).thenThrow(new IllegalArgumentException("bad"));

        mockMvc.perform(post("/api/account/auth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"e@e.com\",\"login\":\"u\",\"password\":\"p\"}"))
                .andExpect(status().isInternalServerError());

        verify(accountService).createAccount(any(Account.class));
        verifyNoMoreInteractions(accountService);

        log.info("Успешно проверили, что POST /api/account/auth возвращает 500, если AccountService выбрасывает IllegalArgumentException");
    }

    @Test
    void getAccountProfile_returns200_whenFound() throws Exception {
        log.info("Проверяем, что GET /api/account/profile возвращает 200, если профиль найден по email");

        Account acc = new Account();
        when(accountService.getByEmail(eq("a@b.com"))).thenReturn(Optional.of(acc));

        mockMvc.perform(get("/api/account/profile")
                        .param("email", "a@b.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").exists());

        verify(accountService).getByEmail("a@b.com");
        verifyNoMoreInteractions(accountService);

        log.info("Успешно проверили, что GET /api/account/profile возвращает 200, если профиль найден по email");
    }

    @Test
    void getAccountProfile_returns404_whenNotFound() throws Exception {
        log.info("Проверяем, что GET /api/account/profile возвращает 404, если профиль не найден по email");

        when(accountService.getByEmail(eq("missing@b.com"))).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/account/profile")
                        .param("email", "missing@b.com"))
                .andExpect(status().isNotFound());

        verify(accountService).getByEmail("missing@b.com");
        verifyNoMoreInteractions(accountService);

        log.info("Успешно проверили, что GET /api/account/profile возвращает 404, если профиль не найден по email");
    }

    @Test
    void updateAccount_returns200_onSuccess() throws Exception {
        log.info("Проверяем, что PUT /api/account/{id} возвращает 200 при успешном обновлении аккаунта");

        Account updated = new Account();
        when(accountService.updateAccount(eq(10L), any(UpdateAccountRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/account/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateAccountRequest(null, null, null))))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").exists());

        verify(accountService).updateAccount(eq(10L), any(UpdateAccountRequest.class));
        verifyNoMoreInteractions(accountService);

        log.info("Успешно проверили, что PUT /api/account/{id} возвращает 200 при успешном обновлении аккаунта");
    }

    @Test
    void updateAccount_returns400_onIllegalArgument() throws Exception {
        log.info("Проверяем, что PUT /api/account/{id} возвращает 400, если AccountService выбрасывает IllegalArgumentException");

        when(accountService.updateAccount(eq(10L), any(UpdateAccountRequest.class)))
                .thenThrow(new IllegalArgumentException("login already used"));

        mockMvc.perform(put("/api/account/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("\"login already used\""));

        verify(accountService).updateAccount(eq(10L), any(UpdateAccountRequest.class));
        verifyNoMoreInteractions(accountService);

        log.info("Успешно проверили, что PUT /api/account/{id} возвращает 400, если AccountService выбрасывает IllegalArgumentException");
    }

    @Test
    void updateAccount_returns500_onOtherException() throws Exception {
        log.info("Проверяем, что PUT /api/account/{id} возвращает 500, если AccountService выбрасывает другое исключение");

        when(accountService.updateAccount(eq(10L), any(UpdateAccountRequest.class)))
                .thenThrow(new RuntimeException("boom"));

        mockMvc.perform(put("/api/account/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string("\"Error while updating profile\""));

        verify(accountService).updateAccount(eq(10L), any(UpdateAccountRequest.class));
        verifyNoMoreInteractions(accountService);

        log.info("Успешно проверили, что PUT /api/account/{id} возвращает 500, если AccountService выбрасывает другое исключение");
    }
}