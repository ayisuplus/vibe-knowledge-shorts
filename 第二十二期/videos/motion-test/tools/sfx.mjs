// 样片拟音：只放在重击点和转场上，全部合成。用法（在 videos/motion-test 下）：node tools/sfx.mjs
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR, HITS } from "../assets/js/beats.js";
const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
const fx = await createSfxEngine({ dur: DUR, repo, out: resolve(here, "../assets/audio/sfx.m4a"), peakLimit: .4, master: 1.25, tail: .08 });
const put = (s, n, g, tag, pan = 0, rate = 1) => fx.place(s, B(n), g, { tag, pan, rate });
for (const h of HITS) { put(fx.knock, h, h === 24 || h === 36 || h === 45 || h === 47 ? .3 : .17, "hit", 0, .55); put(fx.tick, h, .05, "hit"); }
for (const n of [1.2, 3, 5, 7.4, 20, 30.4, 35, 40.4]) put(fx.creak(.42, Math.round(n * 9)), n, .13, "whoosh", Math.sin(n) * .5, 1.6);
for (const n of [0, 1, 14, 16, 18, 20]) { put(fx.blip, n, .06, "alarm"); put(fx.blip, n + .5, .045, "alarm"); }
for (let i = 0; i < 18; i++) put(fx.tick, 22 + i / 6, .04, "roll", -.2);
for (let i = 0; i < 18; i++) put(fx.tick, 33 + i / 6, .05, "roll", .2);
for (let i = 0; i < 20; i++) put(fx.pop, 41 + i * .2, .03, "tag", Math.sin(i) * .7);
put(fx.bell(698.46, 1.6), 14, .08, "ring"); put(fx.bell(349.23, 2), 24, .09, "ring"); put(fx.bell(698.46, 2), 36, .09, "ring");
const r = await fx.finalize();
console.log(`sfx.m4a：${r.events} 个事件；峰值 ${r.pkAfter.toFixed(3)}`);
