// Compatibility entry; preserve the original repository-relative sample paths.
import { fileURLToPath } from "node:url";
if (!process.argv.slice(2).some((arg) => arg.startsWith("--root="))) {
  process.argv.push(`--root=${fileURLToPath(new URL("../", import.meta.url))}`);
}
await import("../../OpenCut/toolkit/scripts/code-video/sfx-env.mjs");
