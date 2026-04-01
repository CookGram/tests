import {
  loginRequest,
  registerRequest,
  saveTokens,
  getAccessToken,
  clearTokens,
  fetchProfileByEmail,
} from "../../src/api/auth";

describe("auth API", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch as any;
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("loginRequest", () => {
    it("should call fetch with correct params and return data", async () => {
      const mockResponse = {
        type: "Bearer",
        accessToken: "token123",
        refreshToken: "refresh123",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await loginRequest({
        email: "test@mail.com",
        password: "1234",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/account/login"),
        expect.objectContaining({
          method: "POST",
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it("should throw error if response not ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid credentials",
      });

      await expect(loginRequest({ email: "x", password: "x" })).rejects.toThrow("Invalid credentials");
    });

    it("should throw fallback error when login text() fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => {
          throw new Error("fail");
        },
      } as any);

      await expect(loginRequest({ email: "a", password: "b" })).rejects.toThrow("Login failed");
    });
  });

  describe("registerRequest", () => {
    it("should call fetch correctly", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await registerRequest({
        login: "user",
        email: "mail",
        password: "123",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/account/auth"),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should throw error on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => "",
      });

      await expect(registerRequest({ login: "a", email: "b", password: "c" })).rejects.toThrow("Register failed");
    });

    it("should throw fallback error when register text() fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => {
          throw new Error("fail");
        },
      } as any);

      await expect(registerRequest({ login: "a", email: "b", password: "c" })).rejects.toThrow("Register failed");
    });
  });

  describe("token storage", () => {
    it("should save tokens to localStorage", () => {
      saveTokens({
        type: "Bearer",
        accessToken: "a",
        refreshToken: "r",
      });

      expect(localStorage.getItem("cookbook_access_token")).toBe("a");
      expect(localStorage.getItem("cookbook_refresh_token")).toBe("r");
    });

    it("should return access token", () => {
      localStorage.setItem("cookbook_access_token", "abc");
      expect(getAccessToken()).toBe("abc");
    });

    it("should clear tokens", () => {
      localStorage.setItem("cookbook_access_token", "a");
      localStorage.setItem("cookbook_refresh_token", "b");

      clearTokens();

      expect(localStorage.getItem("cookbook_access_token")).toBeNull();
      expect(localStorage.getItem("cookbook_refresh_token")).toBeNull();
    });
  });

  describe("fetchProfileByEmail", () => {
    it("should return profile on success", async () => {
      const mockProfile = { id: 1, login: "user", email: "mail" };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockProfile,
      });

      const result = await fetchProfileByEmail("mail");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/account/profile"),
        expect.objectContaining({ method: "GET" }),
      );

      expect(result).toEqual(mockProfile);
    });

    it("should throw error on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "",
      });

      await expect(fetchProfileByEmail("x")).rejects.toThrow("Profile request failed");
    });

    it("should throw fallback error when profile text() fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: async () => {
          throw new Error("fail");
        },
      } as any);

      await expect(fetchProfileByEmail("test@mail.com")).rejects.toThrow("Profile request failed");
    });
  });
});
