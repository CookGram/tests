package com.cook_app.entieties.dto;

import com.cook_app.entieties.Account;

public class AccountDTO {

    private Long id;
    private String login;

    public AccountDTO() {}

    public AccountDTO(Account account) {
        this.id = account.getId();
        this.login = account.getLogin();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }
}
