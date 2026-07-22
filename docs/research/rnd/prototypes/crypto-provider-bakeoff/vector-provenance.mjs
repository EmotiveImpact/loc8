import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prototypeDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(prototypeDirectory, "../../../../..");
const retainedRoot = resolve(repositoryRoot, "docs/research/rnd/repos");

export const VECTOR_ARTIFACTS = Object.freeze([
  {
    id: "rfc9180-swift-crypto",
    repository: "swift-crypto",
    url: "https://github.com/apple/swift-crypto.git",
    commit: "47d3869a7291f085c1fb9fb1e6d3b97a793f45c6",
    path: "Tests/CryptoTests/HPKE/hpke-test-vectors.json",
    licence: "Apache-2.0",
    purpose: "RFC 9180 HPKE vector source",
  },
  {
    id: "hpke-tink-boringssl",
    repository: "tink-java",
    url: "https://github.com/tink-crypto/tink-java.git",
    commit: "1423887709cd537e79bffe1d531bdf5bf3c25d01",
    path: "testdata/testvectors/hpke_boringssl.json",
    licence: "Apache-2.0",
    purpose: "Tink/BoringSSL HPKE provider vectors",
  },
  {
    id: "noise-xx-bitchat",
    repository: "bitchat",
    url: "https://github.com/permissionlesstech/bitchat.git",
    commit: "733098bb633e7f8af88b4e8bf2aa6fef4d031e32",
    path: "bitchatTests/Noise/NoiseTestVectors.json",
    licence: "Unlicense",
    purpose: "BitChat embedded Cacophony/Snow Noise XX vectors",
  },
  {
    id: "noise-snow-community",
    repository: "snow",
    url: "https://github.com/mcginty/snow.git",
    commit: "8ac60f51cfe3e010c84f0a454cc575ad9204fa12",
    path: "tests/vectors/snow.txt",
    licence: "MIT OR Apache-2.0",
    purpose: "community Noise protocol vectors",
  },
  {
    id: "cose-sign1-pass",
    repository: "cose-examples",
    url: "https://github.com/cose-wg/Examples.git",
    commit: "53c9d634333bb4f529d78f5980fffa2667ee2c12",
    path: "sign1-tests/sign-pass-01.json",
    licence: "Unlicense",
    purpose: "COSE_Sign1 accepted example",
  },
  {
    id: "cose-sign1-fail",
    repository: "cose-examples",
    url: "https://github.com/cose-wg/Examples.git",
    commit: "53c9d634333bb4f529d78f5980fffa2667ee2c12",
    path: "sign1-tests/sign-fail-01.json",
    licence: "Unlicense",
    purpose: "COSE_Sign1 rejected example",
  },
  {
    id: "cwt-example-a3",
    repository: "cose-examples",
    url: "https://github.com/cose-wg/Examples.git",
    commit: "53c9d634333bb4f529d78f5980fffa2667ee2c12",
    path: "CWT/A_3.json",
    licence: "Unlicense",
    purpose: "CWT/COSE example provenance",
  },
]);

function git(repositoryPath, args, encoding = "utf8") {
  return execFileSync("git", ["-C", repositoryPath, ...args], {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function collectVectorProvenance() {
  const seen = new Set();
  return VECTOR_ARTIFACTS.map((artifact) => {
    if (seen.has(artifact.id)) throw new Error(`duplicate artifact ID ${artifact.id}`);
    seen.add(artifact.id);
    const repositoryPath = resolve(retainedRoot, artifact.repository);
    const head = git(repositoryPath, ["rev-parse", "HEAD"]).trim();
    if (head !== artifact.commit) {
      throw new Error(
        `${artifact.repository} HEAD ${head} does not match frozen ${artifact.commit}`,
      );
    }
    const objectId = git(repositoryPath, [
      "rev-parse",
      `${artifact.commit}:${artifact.path}`,
    ]).trim();
    const content = git(
      repositoryPath,
      ["show", `${artifact.commit}:${artifact.path}`],
      null,
    );
    return {
      ...artifact,
      objectId,
      bytes: content.length,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(collectVectorProvenance(), null, 2)}\n`);
}
