package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import com.cook_app.repository.AccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountDetailsServiceTest {

    private static final Logger log = LoggerFactory.getLogger(AccountDetailsServiceTest.class);

    @Mock
    AccountRepository accountRepository;

    @Test
    void loadUserByUsername_returnsAccountDetails_whenUserFound() {
        log.info("Проверяем, что loadUserByUsername возвращает AccountDetails, если пользователь найден по логину");

        Account acc = new Account();
        acc.setLogin("john");
        acc.setPassword("HASH");

        when(accountRepository.findByLogin("john")).thenReturn(Optional.of(acc));

        AccountDetailsService service = new AccountDetailsService(accountRepository);
        AccountDetails details = service.loadUserByUsername("john");

        assertThat(details).isNotNull();
        assertThat(details.getUsername()).isEqualTo("john");
        assertThat(details.getPassword()).isEqualTo("HASH");

        verify(accountRepository).findByLogin("john");
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что loadUserByUsername возвращает AccountDetails, если пользователь найден по логину");
    }

    @Test
    void loadUserByUsername_throws_whenUserNotFound() {
        log.info("Проверяем, что loadUserByUsername выбрасывает UsernameNotFoundException, если пользователь не найден по логину");

        when(accountRepository.findByLogin("missing")).thenReturn(Optional.empty());

        AccountDetailsService service = new AccountDetailsService(accountRepository);

        assertThatThrownBy(() -> service.loadUserByUsername("missing"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("missing")
                .hasMessageContaining("NOT_FOUND");

        verify(accountRepository).findByLogin("missing");
        verifyNoMoreInteractions(accountRepository);

        log.info("Успешно проверили, что loadUserByUsername выбрасывает UsernameNotFoundException, если пользователь не найден по логину");
    }
}