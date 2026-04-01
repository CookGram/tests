import { followUserApi, unfollowUserApi, getUserSubscriptionsApi } from "../../src/api/follow";
import * as authModule from "../../src/api/auth";

describe("follow API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should follow with Authorization header", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as any);

    await followUserApi(1, 2);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/subscription/2?userId=1"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
        }),
      }),
    );
  });

  it("should throw error when follow fails", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "Follow error",
    } as any);

    await expect(followUserApi(1, 2)).rejects.toThrow("Follow error");
  });

  it("should use fallback error when follow text() fails", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => {
        throw new Error("fail");
      },
    } as any);

    await expect(followUserApi(1, 2)).rejects.toThrow("Не удалось подписаться");
  });

  it("should unfollow successfully", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as any);

    await unfollowUserApi(1, 2);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/subscription/2?userId=1"),
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("should throw error when unfollow fails", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => "Unfollow error",
    } as any);

    await expect(unfollowUserApi(1, 2)).rejects.toThrow("Unfollow error");
  });

  it("should return empty array when response is not array", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ not: "array" }),
    } as any);

    const result = await getUserSubscriptionsApi(1);

    expect(result).toEqual([]);
  });

  it("should map subscription data correctly", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { login: " user1 " },
        { name: " user2 " },
        { email: "user3@mail.com" },
        { id: 42 },
        null,
        { login: "   " },
      ],
    } as any);

    const result = await getUserSubscriptionsApi(1);

    expect(result).toEqual(["user1", "user2", "user3@mail.com", "42"]);
  });

  it("should throw error when subscriptions request fails", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => "Sub error",
    } as any);

    await expect(getUserSubscriptionsApi(1)).rejects.toThrow("Sub error");
  });

  it("should call followUserApi without Authorization header if no token", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as any);

    await followUserApi(1, 2);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/subscription/2?userId=1"),
      expect.objectContaining({
        method: "POST",
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    );
  });

  it("should call unfollowUserApi without Authorization header if no token", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as any);

    await unfollowUserApi(1, 2);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/subscription/2?userId=1"),
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });

  it("should return empty array if response is not array", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ not: "array" }),
    } as any);

    const result = await getUserSubscriptionsApi(1);

    expect(result).toEqual([]);
  });

  it("should ignore null items in subscriptions", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [null],
    } as any);

    const result = await getUserSubscriptionsApi(1);

    expect(result).toEqual([]);
  });

  it("should fallback to id if no login, name or email", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 42 }],
    } as any);

    const result = await getUserSubscriptionsApi(1);

    expect(result).toEqual(["42"]);
  });

  it("should trim values and remove empty strings", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ login: "   alice   " }, { login: "   " }],
    } as any);

    const result = await getUserSubscriptionsApi(1);

    expect(result).toEqual(["alice"]);
  });

  it("should throw fallback error when unfollow text() fails", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => {
        throw new Error("cannot read body");
      },
    } as any);

    await expect(unfollowUserApi(1, 2)).rejects.toThrow("Не удалось отписаться");
  });

  it("should throw fallback error when subscriptions text() fails", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => {
        throw new Error("cannot read body");
      },
    } as any);

    await expect(getUserSubscriptionsApi(1)).rejects.toThrow("Не удалось загрузить подписки");
  });
});
