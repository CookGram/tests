package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import com.cook_app.repository.AccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AccountDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(AccountDetailsService.class);

    private final AccountRepository accountRepository;

    public AccountDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public AccountDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("Загрузка пользователя по логину: {}", username);
        Optional<Account> user = accountRepository.findByLogin(username);
        return user
                .map(account -> {
                    log.info("Успешно найден пользователь с логином: {}", username);
                    return new AccountDetails(account);
                })
                .orElseThrow(() -> {
                    log.warn("Пользователь {} не найден", username);
                    return new UsernameNotFoundException(username + "NOT_FOUND");
                });
    }
}
