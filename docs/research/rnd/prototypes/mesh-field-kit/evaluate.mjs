import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeJsonLines, evaluateMeshRun } from "./mesh-field-kit.mjs";

function usage() {
  return [
    "Usage:",
    "  node evaluate.mjs MANIFEST.json DEVICE_OR_BLOCK.jsonl [MORE.jsonl ...]",
    "",
    "The command is read-only. It validates every input line, joins the declared",
    "A/B/C path and writes one deterministic result JSON object to stdout.",
  ].join("\n");
}

export function evaluateFiles(manifestPath, eventPaths) {
  if (typeof manifestPath !== "string" || !Array.isArray(eventPaths) || eventPaths.length < 1) {
    throw new Error(usage());
  }
  const manifest = JSON.parse(readFileSync(resolve(manifestPath), "utf8"));
  const events = eventPaths.flatMap((eventPath) =>
    decodeJsonLines(readFileSync(resolve(eventPath), "utf8")),
  );
  return evaluateMeshRun(manifest, events);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , manifestPath, ...eventPaths] = process.argv;
  try {
    process.stdout.write(`${JSON.stringify(evaluateFiles(manifestPath, eventPaths), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
