import "@testing-library/jest-dom";

const mockRender = jest.fn();

jest.mock("react-dom/client", () => ({
  createRoot: jest.fn().mockReturnValue({
    render: mockRender,
  }),
}));

jest.mock("../../src/App", () => ({
  __esModule: true,
  default: () => <div>Mock App</div>,
}));

jest.mock("../../src/index.css", () => ({}));

import { createRoot } from "react-dom/client";

describe("main.tsx", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("инициализирует приложение", () => {
    require("../../src/main");

    const rootElement = document.getElementById("root");
    expect(createRoot).toHaveBeenCalledWith(rootElement);

    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderArg = mockRender.mock.calls[0][0];
    expect(renderArg).toBeDefined();
    expect(renderArg.$$typeof).toBe(Symbol.for("react.element"));

    expect(document.getElementById("root")).not.toBeNull();
  });
});
