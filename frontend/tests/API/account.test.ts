import { updateAccountProfile } from "../../src/api/account";
import * as authModule from "../../src/api/auth";

describe("account API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPayload = {
    id: 1,
    login: "newLogin",
    email: "test@mail.com",
    currentPassword: "old",
    newPassword: "new",
  };

  it("should call fetch with Authorization header when token exists", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("mockToken");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    } as any);

    const result = await updateAccountProfile(mockPayload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/account/1"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer mockToken",
        }),
      }),
    );

    expect(result).toEqual(mockPayload);
  });

  it("should call fetch without Authorization when no token", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue(null);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    } as any);

    await updateAccountProfile(mockPayload);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    );
  });

  it("should throw error when response not ok", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "Error message",
    } as any);

    await expect(updateAccountProfile(mockPayload)).rejects.toThrow("Error message");
  });

  it("should throw fallback error when text() fails", async () => {
    jest.spyOn(authModule, "getAccessToken").mockReturnValue("token");

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      text: async () => {
        throw new Error("cannot read body");
      },
    } as any);

    await expect(updateAccountProfile(mockPayload)).rejects.toThrow("Не удалось обновить профиль");
  });
});
