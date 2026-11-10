// S7 结尾（87.21–93.59）：沿着一条由照片铺成的路往前 → 穿进空相框 → 暖光涌出来。
// 规矩：不扣题，不出现片名四个字，收在画面的运动上。
import { el, show, clamp, lerp, ease, easeOut, ramp, win } from "./lib.js";

const IMG = ["assets/img/p4-young-parents-1990s.jpg", "assets/img/p5-grandparents-1960s.jpg"];

export function build() {
  const deck = el("", "deck", "stage");

  // 地面的路：一条往远处收的光带
  const road = el(`<svg width="1920" height="620" viewBox="0 0 1920 620" preserveAspectRatio="none">
      <defs><linearGradient id="rg" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#FBE3B0" stop-opacity=".85"/>
        <stop offset="1" stop-color="#FBE3B0" stop-opacity="0"/></linearGradient></defs>
      <path d="M220 620 L906 40 L1014 40 L1700 620 Z" fill="url(#rg)"/>
      <path d="M960 620 L960 40" stroke="rgba(242,180,90,.8)" stroke-width="7" stroke-dasharray="30 34" stroke-linecap="round"/>
    </svg>`, "", deck, "position:absolute;left:0;top:470px");

  // 路两侧往远处排开的老照片（越远越淡越小）
  const side = [];
  for (let i = 0; i < 5; i++) {
    const d = i / 4;
    const w = lerp(620, 170, d), h = w * 0.70;
    for (const s of [-1, 1]) {
      const x = 960 + s * lerp(800, 200, d) - w / 2;
      const y = lerp(800, 440, d) - h / 2;
      const e = el(`<img src="${IMG[(i + (s > 0 ? 1 : 0)) % 2]}" style="display:block;width:100%;height:100%;object-fit:cover">`,
        "", deck, `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:6px;
         border:3px solid rgba(168,151,127,${(0.6 - d * 0.45).toFixed(2)});background:#FBF7EE;overflow:hidden;
         box-shadow:0 30px 60px -30px rgba(74,58,40,${(0.5 - d * 0.35).toFixed(2)})`);
      e.setAttribute("data-layout-allow-overflow", "");
      e.firstChild.style.opacity = (0.72 - d * 0.5).toFixed(2);
      side.push({ e, d, s, x, y });
    }
  }

  // 路尽头的空相框：里面只有光
  const frame = el("", "", deck,
    `position:absolute;left:${960 - 200}px;top:${420 - 140}px;width:400px;height:280px;border-radius:10px;
     border:7px solid #A8977F;background:radial-gradient(circle at 50% 54%, #FFFFFF, #FFF6E2 45%, #FBE3B0)`);
  const halo = el("", "", deck,
    `position:absolute;left:${960 - 520}px;top:${420 - 440}px;width:1040px;height:880px;border-radius:50%;
     background:radial-gradient(circle, rgba(251,227,176,.95), transparent 62%)`);

  // 穿过去以后的暖光：慢慢转的光束 + 几粒浮尘，别停成一张死掉的色块
  const after = el("", "deck", "stage");   // 穿过去以后的光：不跟摄影机缩放
  const rays = el(`<svg width="2600" height="2600" viewBox="0 0 2600 2600">
      <g fill="#F2B45A" opacity=".55">
        ${Array.from({ length: 10 }, (_, i) => {
          const a = (i * 36 * Math.PI) / 180, w = 0.05;
          const p = (ang) => `${(1300 + Math.cos(ang) * 1900).toFixed(0)} ${(1300 + Math.sin(ang) * 1900).toFixed(0)}`;
          return `<path d="M1300 1300 L${p(a - w)} L${p(a + w)} Z"/>`;
        }).join("")}
      </g>
    </svg>`, "", after, "position:absolute;left:-340px;top:-760px;transform-origin:50% 50%");
  const motes = Array.from({ length: 9 }, (_, i) => {
    const x = 220 + ((i * 331) % 1500), y = 180 + ((i * 197) % 720), r = 16 + ((i * 7) % 22);
    const e = el("", "", after, `position:absolute;left:${x}px;top:${y}px;width:${r}px;height:${r}px;border-radius:50%;
      background:#FFF6E2;box-shadow:0 0 ${r * 2.4}px ${r * 1.2}px rgba(242,180,90,.85)`);
    return { e, x, y, i };
  });
  const flood = el("", "", after, `position:absolute;left:0;top:0;width:1920px;height:1080px;
    background:radial-gradient(1200px 900px at 50% 46%, #FFFFFF, #FBE3B0 58%, #F6D79B)`);
  const settle = el("", "", after, "position:absolute;left:0;top:0;width:1920px;height:1080px;background:#F9F3E8");

  function state(t) {
    const live = t >= 86.8;
    deck.style.display = live ? "block" : "none";
    after.style.display = live ? "block" : "none";
    if (!live) return;
    deck.style.opacity = win(t, 87.0, 94.0, 0.55, 0.01).toFixed(3);

    // 一直往前飞：87.21 起推进，89.35 穿进相框
    const push = ease(ramp(t, 87.21, 2.3));
    const through = ease(clamp((t - 89.35) / 1.9));
    deck.style.transformOrigin = "50% 40%";
    deck.style.transform = `scale(${(lerp(1, 1.55, push) * lerp(1, 3.6, through)).toFixed(4)})`;

    // 两侧照片：近的跑得快，造出穿行感
    side.forEach((p) => {
      const sp = lerp(1.0, 0.22, p.d);
      const dx = p.s * (push * 190 + through * 460) * sp;
      const dy = (push * 46 + through * 140) * sp;
      show(p.e, win(t, 86.9 + p.d * 0.14, 91.6, 0.5, 0.8), `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`);
    });
    show(road, win(t, 86.9, 91.4, 0.5, 0.8) * 0.95, `translateY(${(push * 54 + through * 170).toFixed(1)}px)`);

    // 相框：越来越亮，穿过去时张开
    show(frame, win(t, 87.0, 91.8, 0.5, 0.7), `scale(${lerp(1, 1.3, push)})`);
    show(halo, win(t, 87.4, 92.4, 0.7, 0.9) * lerp(0.4, 1, push), `scale(${lerp(0.72, 1.18, push)})`);

    // 穿过以后：暖光涌出来，光束慢慢转，浮尘往上飘（收尾仍然在动）
    const fl = ease(clamp((t - 89.9) / 1.6));
    show(flood, fl, `scale(${lerp(0.72, 1.08, fl)})`);
    const spin = (t - 89.9) * 5.0;
    show(rays, fl * 0.42 * (1 - ease(clamp((t - 92.6) / 1.0))), `rotate(${spin.toFixed(2)}deg) scale(${lerp(0.9, 1.06, fl)})`);
    motes.forEach((m) => {
      const k = clamp((t - 90.1 - m.i * 0.07) / 3.2);
      const drift = Math.sin(t * 0.7 + m.i) * 22;
      show(m.e, fl * 0.85 * (1 - ease(clamp((t - 92.8) / 0.8))) * ease(clamp(k * 3)),
        `translate(${drift.toFixed(1)}px, ${(-120 * k).toFixed(1)}px) scale(${lerp(0.6, 1.25, k)})`);
    });
    // 最后收到暖白
    show(settle, ease(clamp((t - 92.7) / 0.85)), "");
  }

  return { state };
}
