import test from "node:test";
import assert from "node:assert/strict";
import { generateTempPassword, isValidTempPassword } from "@/lib/adminPasswords";

test("generateTempPassword returns a valid password", () => {
  const password = generateTempPassword();
  assert.equal(password.length, 12);
  assert.equal(isValidTempPassword(password), true);
});
