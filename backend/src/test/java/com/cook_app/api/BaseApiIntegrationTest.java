package com.cook_app.api;

import com.cook_app.repository.AccountRepository;
import com.cook_app.repository.FollowRepository;
import com.cook_app.repository.RecipeRepository;
import com.cook_app.repository.RecipeStepRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class BaseApiIntegrationTest {

    protected static final String PASSWORD = "pass123";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected RecipeStepRepository recipeStepRepository;

    @Autowired
    protected RecipeRepository recipeRepository;

    @Autowired
    protected FollowRepository followRepository;

    @Autowired
    protected AccountRepository accountRepository;

    @BeforeEach
    void cleanDb() {
        recipeStepRepository.deleteAll();
        recipeRepository.deleteAll();
        followRepository.deleteAll();
        accountRepository.deleteAll();
    }

    protected UserData createUser() throws Exception {
        String suffix = randomSuffix();
        String login = "user_" + suffix;
        String email = "user_" + suffix + "@mail.com";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("login", login);
        body.put("email", email);
        body.put("password", PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/account/auth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.login").value(login))
                .andExpect(jsonPath("$.email").value(email))
                .andReturn();

        JsonNode json = readBody(result);
        return new UserData(
                json.get("id").asLong(),
                json.get("login").asText(),
                json.get("email").asText(),
                PASSWORD
        );
    }

    protected Tokens login(UserData user) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", user.email());
        body.put("password", user.rawPassword());

        MvcResult result = mockMvc.perform(post("/api/account/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode json = readBody(result);
        return new Tokens(
                json.get("type").asText(),
                json.get("accessToken").asText(),
                json.get("refreshToken").asText()
        );
    }
    protected Long saveRecipe(Long authorId, String title, String accessToken, boolean withSteps) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authorId", authorId);
        body.put("title", title);
        body.put("imageData", base64("img"));

        if (withSteps) {
            body.put("steps", List.of(
                    stepPayload((short) 1, "Step 1", null),
                    stepPayload((short) 2, "Step 2", base64("step2"))
            ));
        }

        MvcResult result = mockMvc.perform(post("/api/recipes/save")
                        .header("Authorization", bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNumber())
                .andReturn();

        JsonNode json = readBody(result);
        return json.get("id").asLong();
    }

    protected Map<String, Object> stepPayload(short stepNo, String description, String imageData) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("stepNo", stepNo);
        step.put("description", description);
        step.put("imageData", imageData);
        return step;
    }

    protected JsonNode readBody(MvcResult result) throws Exception {
        String content = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return objectMapper.readTree(content);
    }

    protected String bearer(String accessToken) {
        return "Bearer " + accessToken;
    }

    protected String randomSuffix() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    protected String base64(String raw) {
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    protected record UserData(Long id, String login, String email, String rawPassword) {}
    protected record Tokens(String type, String accessToken, String refreshToken) {}
}
