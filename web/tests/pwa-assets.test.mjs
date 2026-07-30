import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("manifest points the installed app back to MAXos", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/manifest.webmanifest", import.meta.url)),
  );

  assert.equal(manifest.name, "MAXos");
  assert.equal(manifest.short_name, "MAXos");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(
    manifest.icons.map((icon) => icon.sizes),
    ["192x192", "512x512"],
  );
});

test("service worker never caches owner API or chat requests", async () => {
  const worker = await readFile(
    new URL("../public/sw.js", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(worker, /\/api\/maxos/);
  assert.doesNotMatch(worker, /x-maxos-key/);
  assert.match(worker, /OFFLINE_HTML/);
});

test("application icons are real PNG files", async () => {
  for (const name of [
    "icon-192.png",
    "icon-512.png",
    "apple-touch-icon.png",
  ]) {
    const bytes = await readFile(new URL(`../public/${name}`, import.meta.url));
    assert.deepEqual([...bytes.subarray(0, 8)], [
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
  }
});
