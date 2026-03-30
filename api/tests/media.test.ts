import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(TEST_DIR, "../..");
const SLIDE_SOURCE_PATH = resolve(
  ROOT_DIR,
  "slides/sentinel-8004-submission-deck-v1.html",
);
const SLIDE_PDF_PATH = resolve(
  ROOT_DIR,
  "output/pdf/sentinel-8004-submission-slides-v1.pdf",
);

test("submission slide deck source covers the required judge topics", () => {
  const source = readFileSync(SLIDE_SOURCE_PATH, "utf8");

  for (const requiredHeading of [
    "Problem",
    "Thesis",
    "Product Flow",
    "Proof Artifacts",
    "Live Demo Surface",
    "Why This Matters",
  ]) {
    assert.match(source, new RegExp(requiredHeading));
  }
});

test("submission slide PDF exists and is not empty", () => {
  const stats = statSync(SLIDE_PDF_PATH);

  assert.equal(stats.isFile(), true);
  assert.equal(stats.size > 0, true);
});
