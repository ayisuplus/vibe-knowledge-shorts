// S4 · 红皇后 38.60–52.70
// 先给原话（37 秒前它还是「鸡汤」），再给它一个名字和出处。
import { el, vis, ramp, ease, lerp, win } from "./lib.js";

export function build(world) {
  const card = el("", "card", "hud", "position:absolute;inset:0");
  card.innerHTML = `<div class="qwrap">
      <div class="qen">“It takes all the running you can do,<br>to keep in the same place.”</div>
      <div class="qcn">你得拼命跑，才能留在原地。</div>
      <div class="qsrc">刘易斯·卡罗尔《爱丽丝镜中奇遇》1871 · 第二章「活花的花园」· 红皇后</div>
    </div>`;

  const named = el("", "block", "hud", "position:absolute;left:200px;top:322px;width:1000px");
  named.innerHTML = `
    <div style="font-family:NotoSC,sans-serif;font-size:22px;letter-spacing:.34em;color:#5b8fa8;margin-bottom:22px">1973 · 进化生物学</div>
    <div style="font-family:NotoSerifSC,serif;font-weight:700;font-size:88px;line-height:1.1;color:#eef4fa;letter-spacing:.04em">红皇后效应</div>
    <div style="font-family:Georgia,serif;font-size:30px;color:#7fb8cc;letter-spacing:.06em;margin-top:14px">The Red Queen Effect</div>
    <div style="width:120px;height:2px;background:#ff8f5e;opacity:.8;margin:34px 0 26px"></div>
    <div style="font-family:NotoSC,sans-serif;font-size:23px;color:#8ea6bd;letter-spacing:.05em">范瓦伦（Leigh Van Valen）·《进化理论》第 1 卷 1–30 页</div>`;

  return {
    state(t) {
      if (t < 38.6 || t > 52.7) { vis(card, 0); vis(named, 0); return; }
      vis(card, win(t, 38.8, 45.6, 0.7, 0.6));
      vis(named, win(t, 46.3, 52.4, 0.6, 0.5));
      world.bl.reveal(1 - ease(ramp(t, 38.7, 1.1)));
      world.tick(t, {
        effort: 0.55,
        lean: 10,
        mDim: 1,
        rDim: 1,
        dim: lerp(0.42, 0.34, ease(ramp(t, 46.0, 1.2))),
      });
    },
  };
}