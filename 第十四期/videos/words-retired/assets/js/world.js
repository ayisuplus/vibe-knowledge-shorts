// 世界：本期为公文风，无持续运动的全局装置（不同于第十三期的跑道/人）。
// 每段是独立的一张公文纸，由 sections 各自构建、各自在 state(t) 里驱动。
// world 只负责桌面背景与全片级的翻页过渡遮罩。
import { buildDesk } from "./rig.js";
import { el, vis, pulse } from "./lib.js";
import { SEC } from "./beats.js";

export function build() {
  buildDesk();

  // 翻页过渡：每段交界压一道约 0.64 秒的纸影，模拟"翻到下一页"，峰值在交界点
  const turn = el("", "block", "stage",
    "position:absolute;inset:0;background:radial-gradient(72% 62% at 50% 50%,rgba(70,54,28,0),rgba(70,54,28,.36));opacity:0;pointer-events:none");

  const cuts = [SEC.dg[0], SEC.xs[0], SEC.root[0], SEC.ai[0], SEC.out[0]];
  return {
    setTurn(t) {
      let a = 0;
      for (const c of cuts) a = Math.max(a, pulse(t, c - 0.32, 0.64));
      vis(turn, a * 0.9);
    },
  };
}
