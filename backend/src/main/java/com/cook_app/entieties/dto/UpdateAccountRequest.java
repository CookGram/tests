package com.cook_app.entieties.dto;

public class UpdateAccountRequest {

    private String name;
    private String email;
    private String login;
    private String currentPassword;
    private String newPassword;

    public UpdateAccountRequest() {
    }

    public UpdateAccountRequest(String name, String email, String login) {
        this.name = name;
        this.email = email;
        this.login = login;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
