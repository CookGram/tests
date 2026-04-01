package com.cook_app.service;

import com.cook_app.entieties.Account;
import com.cook_app.entieties.dto.UpdateAccountRequest;
import org.springframework.lang.NonNull;

import java.util.Optional;

public interface AccountService {
    Optional<Account> getByLogin(@NonNull String login);
    Optional<Account> getByEmail(@NonNull String email);
    Account createAccount(Account account);
    Account findByLogin(String login);
    Account getAccountById(Long id);
    void deleteAccount(String id);
    Account updateAccount(Long id, UpdateAccountRequest request);
}
