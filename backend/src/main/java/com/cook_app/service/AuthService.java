package com.cook_app.service;


import com.cook_app.entieties.jwt.JwtAuthentication;
import com.cook_app.entieties.jwt.JwtRequest;
import com.cook_app.entieties.jwt.JwtResponse;
import jakarta.security.auth.message.AuthException;
import org.springframework.lang.NonNull;

public interface AuthService {
    JwtResponse login(@NonNull JwtRequest authRequest) throws AuthException;

    JwtResponse getAccessToken(@NonNull String refreshToken) throws AuthException;

    JwtResponse refresh(@NonNull String refreshToken) throws AuthException;

    JwtAuthentication getAuthInfo();

}
