package com.cook_app.component;

import com.cook_app.entieties.Account;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Base64;

import static org.assertj.core.api.Assertions.*;

class JwtProviderTest {

    private static final Logger log = LoggerFactory.getLogger(JwtProviderTest.class);

    private static String secret(int seed) {
        byte[] raw = new byte[64];
        for (int i = 0; i < raw.length; i++) raw[i] = (byte) (seed + i);
        return Base64.getEncoder().encodeToString(raw);
    }

    private static Account acc(String login) {
        Account a = new Account();
        a.setLogin(login);
        return a;
    }

    @Test
    void accessToken_validAsAccess_notAsRefresh_andContainsClaims() {
        log.info("Проверяем, что access-токен валиден как access, не валиден как refresh и содержит нужные claims");

        JwtProvider p = new JwtProvider(secret(1), secret(2));

        String t = p.generateAccessToken(acc("chef"));

        assertThat(p.validateAccessToken(t)).isTrue();
        assertThat(p.validateRefreshToken(t)).isFalse();

        Claims c = p.getAccessClaims(t);
        assertThat(c.getSubject()).isEqualTo("chef");
        assertThat(c.get("firstName", String.class)).isEqualTo("chef");

        log.info("Успешно проверили, что access-токен валиден как access, не валиден как refresh и содержит нужные claims");
    }

    @Test
    void refreshToken_validAsRefresh_notAsAccess_andSubjectIsLogin() {
        log.info("Проверяем, что refresh-токен валиден как refresh, не валиден как access и subject равен логину");

        JwtProvider p = new JwtProvider(secret(1), secret(2));

        String t = p.generateRefreshToken(acc("chef"));

        assertThat(p.validateRefreshToken(t)).isTrue();
        assertThat(p.validateAccessToken(t)).isFalse();
        assertThat(p.getRefreshClaims(t).getSubject()).isEqualTo("chef");

        log.info("Успешно проверили, что refresh-токен валиден как refresh, не валиден как access и subject равен логину");
    }

    @Test
    void malformedToken_isInvalid() {
        log.info("Проверяем, что некорректный (malformed) токен не проходит валидацию как access и как refresh");

        JwtProvider p = new JwtProvider(secret(1), secret(2));

        assertThat(p.validateAccessToken("bad")).isFalse();
        assertThat(p.validateRefreshToken("bad")).isFalse();

        log.info("Успешно проверили, что некорректный (malformed) токен не проходит валидацию как access и как refresh");
    }

    @Test
    void tokenSignedWithOtherSecret_isInvalidForThisProvider() {
        log.info("Проверяем, что токен, подписанный другим секретом, не проходит валидацию у текущего провайдера");

        String a1 = secret(1), r1 = secret(2);
        JwtProvider p1 = new JwtProvider(a1, r1);
        JwtProvider p2 = new JwtProvider(secret(3), secret(4));

        String t = p1.generateAccessToken(acc("chef"));

        assertThat(p2.validateAccessToken(t)).isFalse();
        assertThat(p2.validateRefreshToken(t)).isFalse();

        log.info("Успешно проверили, что токен, подписанный другим секретом, не проходит валидацию у текущего провайдера");
    }
}