// 把 Machine Skill 的 kit（MIT，原样不改）和它要的 three@0.170.0 打成一个本地 ES 模块：assets/vendor/labkit.js。
// 渲染时不走 CDN，换机器也能复现。用法（在 videos/rb19-analysis 下）：node tools/vendor-kit.mjs
// 依赖 Machine Skill 自带的 node_modules（esbuild、three 0.170.0），路径见 SKILL_DIR。
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const SKILL_DIR = process.env.MACHINE_SKILL || "E:/projects/临时目录/.agents/skills/machine";
const here = dirname(fileURLToPath(import.meta.url)), req = createRequire(resolve(SKILL_DIR, "package.json"));
const { build } = req("esbuild");
await build({
  entryPoints: [resolve(SKILL_DIR, "kit/lab-kit.js")], bundle: true, format: "esm", minify: true, legalComments: "eof",
  nodePaths: [resolve(SKILL_DIR, "node_modules")], outfile: resolve(here, "../assets/vendor/labkit.js"),
  banner: { js: "// Machine Skill kit（MIT，见 LICENSE）＋ three@0.170.0（MIT），由 tools/vendor-kit.mjs 打包，不要手改。" },
});
console.log("assets/vendor/labkit.js 完成");
