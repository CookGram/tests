jest.mock("../../src/api/auth", () => ({
  getAccessToken: jest.fn(),
}));

import { getAccessToken } from "../../src/api/auth";
import {
  authorizedFetch,
  saveRecipeApi,
  getAllRecipesApi,
  getRecipesByAuthorApi,
  getSubscribedRecipesApi,
  getRecipeByIdApi,
} from "../../src/api/recipes";

describe("recipes API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRecipe = {
    id: 1,
    authorId: 10,
    title: "Test",
  };

  // -----------------------------
  // SUCCESS CASES
  // -----------------------------

  it("saveRecipeApi should POST and return data", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRecipe,
    } as any);

    const result = await saveRecipeApi({
      authorId: 10,
      title: "Test",
    });

    expect(result).toEqual(mockRecipe);
  });

  it("getAllRecipesApi should GET all recipes", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockRecipe],
    } as any);

    const result = await getAllRecipesApi();
    expect(result).toEqual([mockRecipe]);
  });

  it("getRecipesByAuthorApi should call correct URL", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockRecipe],
    } as any);

    await getRecipesByAuthorApi(5);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/recipes/author/5"), expect.anything());
  });

  it("getSubscribedRecipesApi should call correct URL", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockRecipe],
    } as any);

    await getSubscribedRecipesApi(7);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("userId=7"), expect.anything());
  });

  it("getRecipeByIdApi should call correct URL", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRecipe,
    } as any);

    await getRecipeByIdApi(99);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/recipes/99"), expect.anything());
  });

  // -----------------------------
  // ERROR CASES (handleJson)
  // -----------------------------

  it("should throw error when response not ok", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "Error message",
    } as any);

    await expect(getAllRecipesApi()).rejects.toThrow("Error message");
  });

  it("should use fallback error when text() fails", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => {
        throw new Error("fail");
      },
    } as any);

    await expect(getAllRecipesApi()).rejects.toThrow("Request failed with status 500");
  });

  // -----------------------------
  // AUTHORIZATION BRANCH
  // -----------------------------

  it("should add Authorization header when token exists", async () => {
    (getAccessToken as jest.Mock).mockReturnValue("token");

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);

    global.fetch = mockFetch;

    await getAllRecipesApi();

    const headers = mockFetch.mock.calls[0][1].headers as Headers;

    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("should not add Authorization header when token is null", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);

    global.fetch = mockFetch;

    await getAllRecipesApi();

    const headers = mockFetch.mock.calls[0][1].headers as Headers;

    expect(headers.has("Authorization")).toBe(false);
  });

  // -----------------------------
  // CONTENT-TYPE BRANCH
  // -----------------------------

  it("should set Content-Type when not present", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
    } as any);

    global.fetch = mockFetch;

    await authorizedFetch("/test");

    const headers = mockFetch.mock.calls[0][1].headers as Headers;

    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("should NOT override Content-Type if already present", async () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
    } as any);

    global.fetch = mockFetch;

    const existingHeaders = new Headers();
    existingHeaders.set("Content-Type", "text/plain");

    await authorizedFetch("/test", {
      headers: existingHeaders,
    });

    const headers = mockFetch.mock.calls[0][1].headers as Headers;

    expect(headers.get("Content-Type")).toBe("text/plain");
  });
});
