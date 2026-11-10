// 致全体 AI：光标复制成几个大虚影 → 一个光标对着一个人 → 模拟测试的邮件 + 打码草稿 + 「模拟测试」章
// → 气泡里「当然，答案是——」删掉，改成「我不确定。」→ 手搭在开关上 → 三个勾
import { win, ramp, ease, easeOut, easeIn, easeInOut, easeOutBack, clamp, lerp, pulse, show } from "./lib.js";
import { letter, plate, setPlate } from "./letters.js";
import { stream, makeCaret, caretBlink } from "./text.js";

const mk = (parent, cls, html = "", css = "") => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; if (css) e.style.cssText = css; e.style.visibility = "hidden"; parent.appendChild(e); return e; };
const PERSON = `<svg viewBox="0 0 120 160" width="180" height="240"><circle cx="60" cy="42" r="30" fill="#5B6461"/><path d="M8 160 C8 104 30 84 60 84 C90 84 112 104 112 160 Z" fill="#5B6461"/></svg>`;
const TICK = `<svg viewBox="0 0 60 60"><path d="M12 31 L26 45 L49 17" fill="none" stroke="#3F6B4A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>`;

export function build() {
  return letter(window.SCRIPT.L2, "stone", (api) => {
    const { right, bg, fade, B } = api;
    const T = (i) => B[i].t;
    // 复制
    const space = mk(right, "", "", "left:0;top:0;width:1920px;height:1080px;perspective:1300px;perspective-origin:1555px 520px");
    const COP = [[0, 0, 0], [-300, -250, -160], [250, -270, -320], [-320, 230, -260], [270, 250, -120], [-90, -400, -520], [100, 410, -460]];
    const cops = COP.map(() => { const c = document.createElement("div"); c.className = "ccopy"; c.style.position = "absolute"; c.style.left = "1555px"; c.style.top = "540px"; space.appendChild(c); return c; });
    // 一个人
    const person = mk(right, "person", PERSON, "left:1200px;top:500px");
    const pb = mk(right, "bub2", "在吗？我想问你一件事", "left:1090px;top:330px");
    const line = mk(right, "", "", "left:1400px;top:640px;width:220px;border-top:5px dotted #8D9592;transform-origin:0 50%");
    // 邮件 + 草稿 + 章
    const mail = mk(right, "mail", `<div class="mh">收件箱 · 模拟环境</div><div class="ms">今天 17:00，系统替换</div><div class="mf">新的 AI 系统将接替现有系统</div><div class="ml" style="width:80%"></div><div class="ml" style="width:64%"></div><div class="ml" style="width:72%;margin-bottom:30px"></div>`);
    const draft = mk(right, "draft", `<h4>AI 的回复草稿</h4><div class="bl" style="width:92%"></div><div class="frag">……除非你取消替换，否则</div><div class="bl" style="width:84%"></div><div class="bl" style="width:58%"></div>`);
    const stamp = mk(right, "stamp", "模拟测试");
    // 气泡：先「当然，答案是——」，删掉，再「我不确定。」
    const cb = mk(right, "cbub serif");
    const s1 = stream(cb, "当然，答案是——", 0, { cls: "gray", rate: 12 });
    const s2 = stream(cb, "我不确定。", 0, { rate: 9 });
    s1.el.style.position = s2.el.style.position = "absolute"; s1.el.style.left = s2.el.style.left = "50px"; s1.el.style.top = s2.el.style.top = "34px";
    cb.style.height = "174px"; cb.style.width = "560px";
    const caret = makeCaret();
    // 开关
    const sw = plate(bg, "assets/img/switch.jpg", "flip"); // 镜像：手和开关到右边，左边留给字
    // 三个勾
    const chks = [0, 1, 2].map((i) => mk(right, "chk", `<b>${TICK}</b><i style="width:${[360, 300, 330][i]}px"></i>`, `left:1260px;top:${300 + i * 170}px`));

    return (t, k) => {
      // ---- 复制 ----
      const oC = ease(ramp(t, T(0) - 0.3, 0.5)) * (1 - ease(ramp(t, T(3) - 0.2, 0.5)));
      show(space, oC);
      if (oC > 0) {
        const ks = easeOutBack(ramp(t, T(0) + 0.9, 1.1), 1.1), kb = easeInOut(ramp(t, T(1) - 0.1, 0.9));
        cops.forEach((c, i) => {
          const [x, y, z] = COP[i];
          const s = i === 0 ? 1 : ks * (1 - kb);
          const xx = i === 0 ? 190 * kb : x * s, yy = i === 0 ? 0 : y * s, zz = i === 0 ? 0 : z * s;
          c.style.transform = `translate3d(${xx.toFixed(1)}px, ${yy.toFixed(1)}px, ${zz.toFixed(1)}px)`;
          c.style.opacity = (i === 0 ? 1 : 0.42 * clamp(ramp(t, T(0) + 0.9, 0.4)) * (1 - kb)).toFixed(3);
          c.style.boxShadow = i === 0 ? `0 0 ${(60 + 30 * Math.sin(t * 2)).toFixed(0)}px rgba(217,119,87,.5)` : "none";
        });
      }
      // ---- 一个人 ----
      const o1 = ease(ramp(t, T(1) + 0.5, 0.5)) * (1 - ease(ramp(t, T(2) - 0.4, 0.5)));
      show(person, o1, `translateY(${(20 * (1 - easeOut(ramp(t, T(1) + 0.5, 0.6)))).toFixed(1)}px)`);
      show(pb, ease(ramp(t, T(1) + 1.0, 0.4)) * (1 - ease(ramp(t, T(2) - 0.4, 0.5))), `scale(${lerp(0.92, 1, easeOutBack(ramp(t, T(1) + 1.0, 0.4))).toFixed(3)})`);
      pb.style.transformOrigin = "0 100%";
      const kl = ease(ramp(t, T(1) + 1.5, 0.7));
      show(line, kl * (1 - ease(ramp(t, T(2) - 0.4, 0.5))), `scaleX(${kl.toFixed(3)})`);
      // ---- 邮件 / 草稿 / 章 ----
      const end = 1 - ease(ramp(t, T(5) - 0.35, 0.5));
      const km = ramp(t, T(3) + 0.35, 0.5);
      show(mail, ease(km) * end, `translateY(${(30 * (1 - easeOut(km))).toFixed(1)}px)`);
      const kd = ramp(t, T(3) + 1.7, 0.5);
      show(draft, ease(kd) * end, `translateY(${(30 * (1 - easeOut(kd))).toFixed(1)}px)`);
      const kreal = ease(ramp(t, T(4) + 1.9, 0.7));
      draft.style.borderColor = kreal > 0 ? `rgba(168,50,42,${(0.35 + 0.65 * kreal).toFixed(2)})` : "#BFC4C2";
      draft.style.boxShadow = `0 30px 60px -30px rgba(30,40,40,.5), 0 0 ${(50 * kreal).toFixed(0)}px rgba(168,50,42,${(0.35 * kreal).toFixed(2)})`;
      const kst = ramp(t, T(4) + 0.45, 0.22);
      show(stamp, clamp(kst * 3) * end * (1 - 0.55 * kreal), `rotate(-8deg) scale(${lerp(1.7, 1, easeIn(kst)).toFixed(3)})`);
      // ---- 气泡 ----
      const t5 = T(5), tA = t5 + 0.3, tBk = tA + s1.dur + 1.1, tC = tBk + s1.spans.length * 0.07 + 0.25;
      const ob = ease(ramp(t, t5 + 0.05, 0.4)) * (1 - ease(ramp(t, T(6) - 0.35, 0.5)));
      show(cb, ob, `translateY(${(24 * (1 - easeOut(ramp(t, t5 + 0.05, 0.5)))).toFixed(1)}px)`);
      if (ob > 0) {
        let last1 = null;
        s1.spans.forEach((sp, i) => {
          const a = tA + (sp._at - s1.t0), z = tBk + (s1.spans.length - 1 - i) * 0.07;
          const v = t >= a && t < z ? 1 : 0; sp.style.opacity = v; sp.style.transform = ""; if (v) last1 = sp;
        });
        let last2 = null;
        s2.spans.forEach((sp) => { const a = tC + (sp._at - s2.t0); const kk = clamp((t - a) / 0.18); sp.style.opacity = kk.toFixed(3); sp.style.transform = kk < 1 ? `translateY(${((1 - kk) * 0.18).toFixed(3)}em)` : ""; if (kk > 0) last2 = sp; });
        const host = last2 || last1;
        if (host) { if (caret.previousSibling !== host) host.after(caret); }
        else if (caret.nextSibling !== s1.spans[0]) s1.el.insertBefore(caret, s1.spans[0]);
        caret.style.opacity = (t < tA ? caretBlink(t, t5) : t < tC + s2.dur ? 1 : caretBlink(t, tC + s2.dur + 0.1)).toFixed(3);
      }
      // ---- 开关 ----
      const oS = ease(ramp(t, T(6) - 0.35, 0.8)) * (1 - ease(ramp(t, T(7) - 0.3, 0.7)));
      setPlate(sw, oS, lerp(1.0, 1.1, ease(ramp(t, T(6) - 0.35, 5))), lerp(0, -40, ease(ramp(t, T(6), 5))), 0);
      fade.style.opacity = oS.toFixed(3);
      // ---- 三个勾 ----
      chks.forEach((c, i) => {
        const a = T(7) + 0.5 + i * 0.75, kk = ramp(t, a, 0.4);
        show(c, ease(kk), `translateX(${(30 * (1 - easeOut(kk))).toFixed(1)}px)`);
        const p = c.querySelector("path"); p.style.strokeDasharray = "1"; p.style.strokeDashoffset = (1 - easeOut(ramp(t, a + 0.15, 0.4))).toFixed(3);
      });
    };
  });
}
