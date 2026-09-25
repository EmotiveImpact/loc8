"use strict";
// Restore the exact locally captured TAP. This does not rerun the tests.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const root = path.resolve(__dirname, "../../docs/research/rnd/results/evidence/2026-09-25-source-location");
const hashes = [
  "2ee712e6d8de47e01e59cd2f75fc2a1bee62123e85176c5cb3a3d70baaaab6d2",
  "c43eef99b0eaba8ce815419e47d365768c605bfb5de4464339b636720581bcfe",
  "a8a8876923f441920610508081e03a740fd7ab711fe33d130cc024cb65e7a684",
];
const digest = data => crypto.createHash("sha256").update(data).digest("hex");
const parts = hashes.map((hash, i) => {
  const part = fs.readFileSync(path.join(root, `final-regression.tap.gz.part${String(i + 1).padStart(2, "0")}`));
  if (digest(part) !== hash) throw new Error(`Evidence part ${i + 1} hash mismatch`);
  return part;
});
const raw = zlib.gunzipSync(Buffer.concat(parts), { maxOutputLength: 1000000 });
if (digest(raw) !== "2fc2c15a8b98c539362c119fde387dd3cf1c9a3f2dd8b1c9b6e9d287cde154d3") {
  throw new Error("Restored TAP hash mismatch");
}
process.stdout.write(raw);
