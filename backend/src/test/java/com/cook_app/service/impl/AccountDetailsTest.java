package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

import static org.assertj.core.api.Assertions.assertThat;

class AccountDetailsTest {

    private static final Logger log = LoggerFactory.getLogger(AccountDetailsTest.class);

    @Test
    void getters_returnDataFromAccount_andAuthoritiesEmpty() {
        log.info("Проверяем, что AccountDetails возвращает данные аккаунта и пустой список authorities при отсутствии ролей");

        Account acc = new Account();
        acc.setLogin("login1");
        acc.setPassword("pass1");

        AccountDetails details = new AccountDetails(acc);

        assertThat(details.getUsername()).isEqualTo("login1");
        assertThat(details.getPassword()).isEqualTo("pass1");

        Collection<? extends GrantedAuthority> auth = details.getAuthorities();
        assertThat(auth).isNotNull();
        assertThat(auth).isEmpty();

        log.info("Успешно проверили, что AccountDetails возвращает данные аккаунта и пустой список authorities при отсутствии ролей");
    }
}