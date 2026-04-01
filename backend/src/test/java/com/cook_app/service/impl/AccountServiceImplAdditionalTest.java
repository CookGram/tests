package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.dto.UpdateAccountRequest;
import com.cook_app.repository.AccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class AccountServiceImplAdditionalTest {

    private static final Logger log = LoggerFactory.getLogger(AccountServiceImplAdditionalTest.class);

    @Mock PasswordEncoder passwordEncoder;
    @Mock AccountRepository accountRepository;

    @InjectMocks AccountServiceImpl service;

    @Test
    void getByLogin_returnsMatchingAccount_fromFindAllStream() {
        log.info("Проверяем, что getByLogin возвращает найденный аккаунт по логину из accountRepository.findAll()");

        Account a1 = new Account(); a1.setLogin("a");
        Account a2 = new Account(); a2.setLogin("b");

        when(accountRepository.findAll()).thenReturn(List.of(a1, a2));

        assertThat(service.getByLogin("b")).isPresent();
        verify(accountRepository).findAll();
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что getByLogin возвращает найденный аккаунт по логину из accountRepository.findAll()");
    }

    @Test
    void getByEmail_returnsEmpty_whenNoMatch() {
        log.info("Проверяем, что getByEmail возвращает пустой результат, если email не найден в accountRepository.findAll()");

        Account a1 = new Account(); a1.setEmail("a@a.com");
        when(accountRepository.findAll()).thenReturn(List.of(a1));

        assertThat(service.getByEmail("missing@a.com")).isEmpty();
        verify(accountRepository).findAll();
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что getByEmail возвращает пустой результат, если email не найден в accountRepository.findAll()");
    }

    @Test
    void createAccount_skipsUniqChecks_whenEmailAndLoginBlank_butEncodesAndSaves() {
        log.info("Проверяем, что createAccount пропускает проверки уникальности при пустых email/login и кодирует пароль, затем сохраняет аккаунт");

        Account input = new Account();
        input.setEmail("   ");
        input.setLogin("");
        input.setPassword("plainn");

        when(passwordEncoder.encode("plainn")).thenReturn("ENC");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Account saved = service.createAccount(input);

        assertThat(saved.getPassword()).isEqualTo("ENC");
        verify(accountRepository, never()).findByEmail(anyString());
        verify(accountRepository, never()).findByLogin(anyString());
        verify(passwordEncoder).encode("plainn");
        verify(accountRepository).save(input);
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что createAccount пропускает проверки уникальности при пустых email/login и кодирует пароль, затем сохраняет аккаунт");
    }

    @Test
    void deleteAccount_convertsStringIdToLong_andDelegatesToRepository() {
        log.info("Проверяем, что deleteAccount конвертирует строковый id в Long и вызывает accountRepository.deleteById");

        service.deleteAccount("123");
        verify(accountRepository).deleteById(123L);
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что deleteAccount конвертирует строковый id в Long и вызывает accountRepository.deleteById");
    }

    @Test
    void updateAccount_throws_whenUserNotFound() {
        log.info("Проверяем, что updateAccount выбрасывает исключение, если пользователь не найден по id");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(accountRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateAccount(10L, req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Пользователь не найден");

        verify(accountRepository).findById(10L);
        verifyNoMoreInteractions(accountRepository);
        verifyNoInteractions(passwordEncoder);

        log.info("Успешно проверили, что updateAccount выбрасывает исключение, если пользователь не найден по id");
    }

    @Test
    void updateAccount_throws_whenCurrentPasswordNullOrBlank() {
        log.info("Проверяем, что updateAccount выбрасывает IllegalArgumentException, если текущий пароль пустой или состоит из пробелов");

        Account existing = new Account();
        existing.setId(10L);
        existing.setLogin("old");
        existing.setPassword("HASH");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(req.getCurrentPassword()).thenReturn("   ");
        when(accountRepository.findById(10L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.updateAccount(10L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Текущий пароль");

        verify(accountRepository).findById(10L);
        verify(accountRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder);

        log.info("Успешно проверили, что updateAccount выбрасывает IllegalArgumentException, если текущий пароль пустой или состоит из пробелов");
    }

    @Test
    void updateAccount_throws_whenCurrentPasswordDoesNotMatch() {
        log.info("Проверяем, что updateAccount выбрасывает IllegalArgumentException, если текущий пароль не совпадает с сохранённым");

        Account existing = new Account();
        existing.setId(10L);
        existing.setLogin("old");
        existing.setPassword("HASH");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(req.getCurrentPassword()).thenReturn("wrong");
        when(accountRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("wrong", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> service.updateAccount(10L, req))
                .isInstanceOf(IllegalArgumentException.class);

        verify(accountRepository).findById(10L);
        verify(passwordEncoder).matches("wrong", "HASH");
        verify(accountRepository, never()).save(any());

        log.info("Успешно проверили, что updateAccount выбрасывает IllegalArgumentException, если текущий пароль не совпадает с сохранённым");
    }

    @Test
    void updateAccount_throws_whenNewLoginAlreadyUsedByOtherUser() {
        log.info("Проверяем, что updateAccount выбрасывает исключение, если новый логин уже занят другим пользователем");

        Account existing = new Account();
        existing.setId(10L);
        existing.setLogin("old");
        existing.setPassword("HASH");

        Account other = new Account();
        other.setId(999L);
        other.setLogin("taken");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(req.getCurrentPassword()).thenReturn("ok");
        when(req.getLogin()).thenReturn("taken");

        when(accountRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("ok", "HASH")).thenReturn(true);
        when(accountRepository.findByLogin("taken")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.updateAccount(10L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("логином");

        verify(accountRepository).findById(10L);
        verify(passwordEncoder).matches("ok", "HASH");
        verify(accountRepository).findByLogin("taken");
        verify(accountRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());

        log.info("Успешно проверили, что updateAccount выбрасывает исключение, если новый логин уже занят другим пользователем");
    }

    @Test
    void updateAccount_doesNotCheckUniq_whenLoginSameAsExisting() {
        log.info("Проверяем, что updateAccount не проверяет уникальность, если новый логин совпадает с текущим логином пользователя");

        Account existing = new Account();
        existing.setId(10L);
        existing.setLogin("same");
        existing.setPassword("HASH");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(req.getCurrentPassword()).thenReturn("ok");
        when(req.getLogin()).thenReturn("same");
        when(req.getNewPassword()).thenReturn(null);

        when(accountRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("ok", "HASH")).thenReturn(true);
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Account updated = service.updateAccount(10L, req);

        assertThat(updated.getLogin()).isEqualTo("same");
        verify(accountRepository).findById(10L);
        verify(passwordEncoder).matches("ok", "HASH");
        verify(accountRepository, never()).findByLogin(anyString());
        verify(accountRepository).save(existing);

        log.info("Успешно проверили, что updateAccount не проверяет уникальность, если новый логин совпадает с текущим логином пользователя");
    }

    @Test
    void updateAccount_whenNewPasswordProvided_butSecondMatchesFails_throws() {
        log.info("Проверяем, что updateAccount выбрасывает исключение, если при смене пароля повторная проверка текущего пароля не проходит");

        Account existing = new Account();
        existing.setId(10L);
        existing.setLogin("login");
        existing.setPassword("HASH");

        UpdateAccountRequest req = mock(UpdateAccountRequest.class);
        when(req.getCurrentPassword()).thenReturn("oldPass");
        when(req.getLogin()).thenReturn("login");
        when(req.getNewPassword()).thenReturn("newPass");

        when(accountRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("oldPass", "HASH")).thenReturn(true, false);

        assertThatThrownBy(() -> service.updateAccount(10L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Текущий пароль");

        verify(accountRepository).findById(10L);
        verify(passwordEncoder, times(2)).matches("oldPass", "HASH");
        verify(accountRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());

        log.info("Успешно проверили, что updateAccount выбрасывает исключение, если при смене пароля повторная проверка текущего пароля не проходит");
    }
}