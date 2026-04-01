package com.cook_app.service.impl;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.dto.UpdateAccountRequest;
import com.cook_app.repository.AccountRepository;
import com.cook_app.service.AccountService;
import lombok.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService {

    private static final int PASSWORD_MIN_LEN = 6;
    private static final int PASSWORD_MAX_LEN = 13;

    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;

    public AccountServiceImpl(PasswordEncoder passwordEncoder, AccountRepository accountRepository) {
        this.passwordEncoder = passwordEncoder;
        this.accountRepository = accountRepository;
    }

    private void validatePasswordLength(String password) {
        if (password == null) {
            throw new IllegalArgumentException("Пароль не должен быть пустым");
        }
        int len = password.length();
        if (len < PASSWORD_MIN_LEN || len > PASSWORD_MAX_LEN) {
            throw new IllegalArgumentException(
                    "Пароль должен быть длиной от " + PASSWORD_MIN_LEN + " до " + PASSWORD_MAX_LEN + " символов"
            );
        }
    }

    @Override
    public Optional<Account> getByLogin(@NonNull String login) {
        return accountRepository.findAll().stream()
                .filter(user -> login.equals(user.getLogin()))
                .findFirst();
    }

    @Override
    public Optional<Account> getByEmail(@NonNull String email) {
        return accountRepository.findAll().stream()
                .filter(user -> email.equals(user.getEmail()))
                .findFirst();
    }

    @Override
    public Account createAccount(Account account) {
        if (account.getEmail() != null && !account.getEmail().isBlank()) {
            accountRepository.findByEmail(account.getEmail())
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Пользователь с таким email уже существует");
                    });
        }

        if (account.getLogin() != null && !account.getLogin().isBlank()) {
            accountRepository.findByLogin(account.getLogin())
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Пользователь с таким логином уже существует");
                    });
        }

        validatePasswordLength(account.getPassword());

        account.setPassword(passwordEncoder.encode(account.getPassword()));
        return accountRepository.save(account);
    }

    @Override
    public Account findByLogin(String login) {
        return accountRepository.findByLogin(login).orElseThrow();
    }

    @Override
    public Account getAccountById(Long id) {
        return accountRepository.getReferenceById(id);
    }

    @Override
    public void deleteAccount(String id) {
        accountRepository.deleteById(Long.valueOf(id));
    }

    @Override
    public Account updateAccount(Long id, UpdateAccountRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден: id=" + id));

        String currentPassword = request.getCurrentPassword();
        if (currentPassword == null || currentPassword.isBlank()
                || !passwordEncoder.matches(currentPassword, account.getPassword())) {
            throw new IllegalArgumentException("Текущий пароль указан неверно");
        }

        if (request.getLogin() != null
                && !request.getLogin().isBlank()
                && !request.getLogin().equals(account.getLogin())) {

            accountRepository.findByLogin(request.getLogin())
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new IllegalArgumentException("Пользователь с таким логином уже существует");
                    });

            account.setLogin(request.getLogin());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null
                    || !passwordEncoder.matches(request.getCurrentPassword(), account.getPassword())) {
                throw new IllegalArgumentException("Текущий пароль указан неверно");
            }

            validatePasswordLength(request.getNewPassword());

            account.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        return accountRepository.save(account);
    }
}