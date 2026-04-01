package com.cook_app.entieties.dto;

import com.cook_app.entieties.Account;

public class AccountProfileDTO {

    private Long id;
    private String login;
    private String email;

    public AccountProfileDTO() {
    }

    public AccountProfileDTO(Account account) {
        this.id = account.getId();
        this.login = account.getLogin();
        this.email = account.getEmail();
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
