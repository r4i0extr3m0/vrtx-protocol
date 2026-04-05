import { describe, expect, it } from "vitest";

import { translateAuthError } from "../src/utils/errors";

describe("translateAuthError", () => {
  it("maps duplicate account errors to a clear signup message", () => {
    expect(translateAuthError("User already registered")).toMatchObject({
      code: "USER_ALREADY_EXISTS",
      title: "CONTA_JÁ_EXISTENTE",
    });
  });

  it("maps weak password errors to a helpful message", () => {
    expect(translateAuthError("Password should be at least 6 characters")).toMatchObject({
      code: "WEAK_PASSWORD",
      title: "SENHA_INSUFICIENTE",
    });
  });
});
