package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.dto.UpdateAccountRequest;
import com.cook_app.repository.AccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    private static final Logger log = LoggerFactory.getLogger(AccountServiceImplTest.class);

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    AccountRepository accountRepository;

    @InjectMocks
    AccountServiceImpl service;

    private static String pwd(int len) {
        return "a".repeat(len);
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 6, 13, 14})
    void createAccount_passwordLength_boundaries(int len) {
        log.info("Проверяем граничные условия длины пароля при создании аккаунта (длина пароля = {})", len);

        Account input = new Account();
        input.setEmail("free@example.com");
        input.setLogin("newLogin");
        input.setPassword(pwd(len));

        when(accountRepository.findByEmail("free@example.com")).thenReturn(Optional.empty());
        when(accountRepository.findByLogin("newLogin")).thenReturn(Optional.empty());

        boolean shouldBeValid = (len == 6 || len == 13);

        if (shouldBeValid) {
            when(passwordEncoder.encode(pwd(len))).thenReturn("ENC_" + len);
            when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

            Account saved = service.createAccount(input);

            assertThat(saved.getPassword()).isEqualTo("ENC_" + len);

            verify(accountRepository).findByEmail("free@example.com");
            verify(accountRepository).findByLogin("newLogin");
            verify(passwordEncoder).encode(pwd(len));
            verify(accountRepository).save(input);
        } else {
            assertThatThrownBy(() -> service.createAccount(input))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Пароль должен быть длиной");

            verify(accountRepository).findByEmail("free@example.com");
            verify(accountRepository).findByLogin("newLogin");
            verifyNoInteractions(passwordEncoder);
            verify(accountRepository, never()).save(any());
        }

        log.info("Успешно проверили граничные условия длины пароля при создании аккаунта (длина пароля = {})", len);
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 8, 14})
    void createAccount_passwordLength_equivalenceClasses(int len) {
        log.info("Проверяем классы эквивалентности длины пароля при создании аккаунта (длина пароля = {})", len);

        Account input = new Account();
        input.setEmail("free@example.com");
        input.setLogin("newLogin");
        input.setPassword(pwd(len));

        when(accountRepository.findByEmail("free@example.com")).thenReturn(Optional.empty());
        when(accountRepository.findByLogin("newLogin")).thenReturn(Optional.empty());

        boolean shouldBeValid = (len == 8);

        if (shouldBeValid) {
            when(passwordEncoder.encode(pwd(len))).thenReturn("ENC_" + len);
            when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

            Account saved = service.createAccount(input);

            assertThat(saved.getPassword()).isEqualTo("ENC_" + len);

            verify(accountRepository).findByEmail("free@example.com");
            verify(accountRepository).findByLogin("newLogin");
            verify(passwordEncoder).encode(pwd(len));
            verify(accountRepository).save(input);
        } else {
            assertThatThrownBy(() -> service.createAccount(input))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Пароль должен быть длиной");

            verify(accountRepository).findByEmail("free@example.com");
            verify(accountRepository).findByLogin("newLogin");
            verifyNoInteractions(passwordEncoder);
            verify(accountRepository, never()).save(any());
        }

        log.info("Успешно проверили классы эквивалентности длины пароля при создании аккаунта (длина пароля = {})", len);
    }

    @Test
    void getByEmail_returnsMatchingAccount_fromFindAllStream() {
        log.info("Проверяем, что поиск по email возвращает корректный аккаунт из списка accountRepository.findAll()");

        Account a1 = new Account();
        a1.setId(1L);
        a1.setEmail("a@example.com");
        a1.setLogin("a");

        Account a2 = new Account();
        a2.setId(2L);
        a2.setEmail("b@example.com");
        a2.setLogin("b");

        when(accountRepository.findAll()).thenReturn(List.of(a1, a2));

        Optional<Account> res = service.getByEmail("b@example.com");

        assertThat(res).isPresent();
        assertThat(res.get().getId()).isEqualTo(2L);
        verify(accountRepository).findAll();
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что поиск по email возвращает корректный аккаунт из списка accountRepository.findAll()");
    }

    @Test
    void createAccount_throwsIfEmailAlreadyExists() {
        log.info("Проверяем, что createAccount выбрасывает исключение, если email уже существует");

        Account input = new Account();
        input.setEmail("taken@example.com");
        input.setLogin("newLogin");
        input.setPassword("plain12");

        when(accountRepository.findByEmail("taken@example.com"))
                .thenReturn(Optional.of(new Account()));

        assertThatThrownBy(() -> service.createAccount(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("email");

        verify(accountRepository).findByEmail("taken@example.com");
        verify(accountRepository, never()).findByLogin(anyString());
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);

        log.info("Успешно проверили, что createAccount выбрасывает исключение, если email уже существует");
    }

    @Test
    void createAccount_throwsIfLoginAlreadyExists() {
        log.info("Проверяем, что createAccount выбрасывает исключение, если логин уже существует");

        Account input = new Account();
        input.setEmail("free@example.com");
        input.setLogin("takenLogin");
        input.setPassword("plain12");

        when(accountRepository.findByEmail("free@example.com"))
                .thenReturn(Optional.empty());
        when(accountRepository.findByLogin("takenLogin"))
                .thenReturn(Optional.of(new Account()));

        assertThatThrownBy(() -> service.createAccount(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("логином");

        verify(accountRepository).findByEmail("free@example.com");
        verify(accountRepository).findByLogin("takenLogin");
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);

        log.info("Успешно проверили, что createAccount выбрасывает исключение, если логин уже существует");
    }

    @Test
    void createAccount_encodesPasswordAndSaves() {
        log.info("Проверяем, что createAccount кодирует пароль и сохраняет аккаунт при валидных данных");

        Account input = new Account();
        input.setEmail("free@example.com");
        input.setLogin("newLogin");
        input.setPassword("plain12");

        when(accountRepository.findByEmail("free@example.com")).thenReturn(Optional.empty());
        when(accountRepository.findByLogin("newLogin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plain12")).thenReturn("ENC");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Account saved = service.createAccount(input);

        assertThat(saved.getPassword()).isEqualTo("ENC");

        verify(accountRepository).findByEmail("free@example.com");
        verify(accountRepository).findByLogin("newLogin");
        verify(passwordEncoder).encode("plain12");
        verify(accountRepository).save(any(Account.class));

        log.info("Успешно проверили, что createAccount кодирует пароль и сохраняет аккаунт при валидных данных");
    }

    @Test
    void updateAccount_updatesLoginWhenUnique() {
        log.info("Проверяем, что updateAccount обновляет логин, если новый логин уникален и текущий пароль верный");

        Account existing = new Account();
        existing.setId(10L);
        existing.setLogin("oldLogin");
        existing.setPassword("HASH");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(req.getCurrentPassword()).thenReturn("oldPass");
        when(req.getLogin()).thenReturn("newLogin");
        when(req.getNewPassword()).thenReturn(null);

        when(accountRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("oldPass", "HASH")).thenReturn(true);
        when(accountRepository.findByLogin("newLogin")).thenReturn(Optional.empty());
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Account updated = service.updateAccount(10L, req);

        assertThat(updated.getLogin()).isEqualTo("newLogin");
        assertThat(updated.getPassword()).isEqualTo("HASH");

        verify(accountRepository).findById(10L);
        verify(passwordEncoder).matches("oldPass", "HASH");
        verify(accountRepository).findByLogin("newLogin");
        verify(accountRepository).save(existing);
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что updateAccount обновляет логин, если новый логин уникален и текущий пароль верный");
    }

    @Test
    void updateAccount_updatesPasswordWhenNewPasswordProvided() {
        log.info("Проверяем, что updateAccount обновляет пароль, если задан новый пароль и текущий пароль верный");

        Account existing = new Account();
        existing.setId(10L);
        existing.setLogin("login");
        existing.setPassword("HASH");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(req.getCurrentPassword()).thenReturn("oldPass");
        when(req.getLogin()).thenReturn("login");
        when(req.getNewPassword()).thenReturn("newPass1");

        when(accountRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("oldPass", "HASH")).thenReturn(true);
        when(passwordEncoder.encode("newPass1")).thenReturn("NEW_HASH");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Account updated = service.updateAccount(10L, req);

        assertThat(updated.getPassword()).isEqualTo("NEW_HASH");

        verify(accountRepository).findById(10L);
        verify(passwordEncoder, atLeastOnce()).matches("oldPass", "HASH");
        verify(passwordEncoder).encode("newPass1");
        verify(accountRepository).save(existing);

        log.info("Успешно проверили, что updateAccount обновляет пароль, если задан новый пароль и текущий пароль верный");
    }
}