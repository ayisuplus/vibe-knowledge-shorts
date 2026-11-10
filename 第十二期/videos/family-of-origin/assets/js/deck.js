// 全片共用的两个主角：词条卡、便利贴。都是"给 t 算状态"的纯函数。
import { el, show, clamp, lerp, ease, easeOut, easeOutBack, ramp } from "./lib.js";

export const CARD = { w: 1240, h: 640, x: 960, y: 500 }; // 卡在舞台上的默认中心

/** 词条卡。opts.series 给片名卡用。返回 { e, set(x, y, s, rotY, o) } */
export function card({ series = "", word = "原生家庭", py = "yuánshēng jiātíng",
                       en = "family of origin", def = "你出生、长大的那个家", parent = "stage" } = {}) {
  const e = el(`
    ${series ? `<div class="series">${series}</div>` : ""}
    <div class="word">${word}</div>
    <div class="py">${py}</div>
    <div class="en">${en}</div>
    <div class="rule"></div>
    <div class="def">${def}</div>`, "card", parent,
    `position:absolute;width:${CARD.w}px;height:${CARD.h}px;left:0;top:0;transform-style:preserve-3d;backface-visibility:hidden`);
  const q = (s) => e.querySelector(s);
  // 卡内版式（和风格样张一致）
  q(".word").style.cssText += "left:214px;top:168px";
  q(".py").style.cssText += "left:220px;top:392px";
  q(".en").style.cssText += "left:640px;top:386px";
  q(".rule").style.cssText += "left:56px;right:56px;top:470px";
  q(".def").style.cssText += "left:220px;top:510px";
  for (const sel of [".word", ".py", ".en", ".def", ".series"]) {
    const n = q(sel);
    if (!n) continue;
    n.setAttribute("data-layout-allow-occlusion", "");
    n.setAttribute("data-layout-allow-overlap", "");
  }
  return {
    e,
    set(x = CARD.x, y = CARD.y, s = 1, rotY = 0, o = 1) {
      show(e, o, `translate(${x - CARD.w / 2}px, ${y - CARD.h / 2}px) scale(${s}) rotateY(${rotY}deg)`);
    },
  };
}

/**
 * 便利贴。按"拍上去"的动作做：从高处带模糊落下，到点轻微回弹。
 * p = { x, y, rot, text, c, w, scale }
 * 返回 { e, slap(t, t0), peel(t, t0, dir), set(...) }
 */
export function note(p, parent = "stage") {
  const w = p.w || 360;
  const e = el(p.text, `note ${p.c || "n1"}`, parent,
    `position:absolute;width:${w}px;left:0;top:0;transform-origin:50% 0;${p.fs ? `font-size:${p.fs}px` : ""}`);
  e.setAttribute("data-layout-allow-occlusion", "");
  e.setAttribute("data-layout-allow-overlap", "");
  const base = p.scale || 1;
  const put = (x, y, s, rot, o, extra = "") => {
    show(e, o, `translate(${x}px, ${y}px) scale(${s}) rotate(${rot}deg) ${extra}`);
    e.style.filter = extra ? "" : "";
  };
  return {
    e,
    /** 拍上去：t0 前不可见，t0 起 0.26 秒从高处落下并轻微过冲 */
    slap(t, t0, d = 0.26) {
      const k = ramp(t, t0, d);
      if (t < t0) { show(e, 0); return; }
      const kk = easeOutBack(k, 2.2);
      const s = base * lerp(1.28, 1, kk);
      const dy = lerp(-120, 0, easeOut(k));
      e.style.filter = k < 0.55 ? `blur(${lerp(5, 0, k / 0.55).toFixed(2)}px)` : "";
      put(p.x, p.y + dy, s, p.rot, clamp(k * 3));
    },
    /** 撕下来：绕上边缘翻起，再往 dir 方向飘出画面 */
    peel(t, t0, d = 0.9, dir = [260, -520], spin = 26) {
      if (t < t0) { return false; }
      const k = clamp((t - t0) / d);
      const flip = ease(clamp(k / 0.42)) * 104;             // 先绕上边缘翻起
      const fly = ease(clamp((k - 0.3) / 0.7));             // 再飘走
      const o = 1 - ease(clamp((k - 0.55) / 0.45));
      show(e, o, `translate(${p.x + dir[0] * fly}px, ${p.y + dir[1] * fly}px) scale(${base * (1 - 0.18 * fly)}) rotate(${p.rot + spin * fly}deg) rotateX(${flip}deg)`);
      e.style.filter = fly > 0.25 ? `blur(${(fly * 5).toFixed(2)}px)` : "";
      return true;
    },
    /** 直接摆位（跟随卡片移动时用） */
    set(x = p.x, y = p.y, s = base, rot = p.rot, o = 1) { e.style.filter = ""; put(x, y, s, rot, o); },
    p,
  };
}
