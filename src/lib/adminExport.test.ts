import test from "node:test";
import assert from "node:assert/strict";
import { exportToCSV } from "@/lib/adminExport";

test("exportToCSV creates a csv blob url", () => {
  let capturedBlob: Blob | null = null;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalDocument = globalThis.document;

  URL.createObjectURL = ((blob: Blob) => {
    capturedBlob = blob;
    return "blob:test";
  }) as typeof URL.createObjectURL;
  URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
  globalThis.document = {
    body: {
      appendChild: () => {},
    },
    createElement: () =>
      ({
        click: () => {},
        remove: () => {},
        set href(_value: string) {},
        set download(_value: string) {},
      }) as HTMLAnchorElement,
  } as Document;

  exportToCSV([{ email: "user@example.com", role: "admin" }], "users.csv");

  assert.ok(capturedBlob instanceof Blob);

  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  globalThis.document = originalDocument;
});
