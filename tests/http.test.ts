import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOrigin } from "../lib/http.ts";

test("same-origin checks use the browser's Host when Next normalizes its internal URL", () => {
  const request = new Request("http://localhost:3100/api/appointments", {
    headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" },
  });
  assert.doesNotThrow(() => checkOrigin(request));
});

test("unrelated origins, null origins and other ports cannot mutate the local calendar", () => {
  for (const origin of [
    "https://unrelated.example",
    "null",
    "http://127.0.0.1:4000",
  ]) {
    const request = new Request("http://localhost:3100/api/appointments", {
      headers: {
        host: "127.0.0.1:3100",
        origin,
        "x-forwarded-host": "unrelated.example",
      },
    });
    assert.throws(() => checkOrigin(request), /own website/);
  }
});
