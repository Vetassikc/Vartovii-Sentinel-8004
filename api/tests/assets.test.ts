import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(TEST_DIR, "../..");

const REQUIRED_ASSET_PATHS = [
  "assets/README.md",
  "assets/cover/sentinel-8004-cover.png",
  "assets/screenshots/judge-demo-allow-btc-buy.png",
  "assets/screenshots/judge-demo-downsize-eth-buy.png",
  "assets/social/sentinel-8004-thread-card.html",
  "assets/social/sentinel-8004-thread-card.png",
];

test("submission asset pack files exist", () => {
  for (const relativePath of REQUIRED_ASSET_PATHS) {
    assert.equal(
      existsSync(resolve(ROOT_DIR, relativePath)),
      true,
      `Expected asset file to exist: ${relativePath}`,
    );
  }
});
