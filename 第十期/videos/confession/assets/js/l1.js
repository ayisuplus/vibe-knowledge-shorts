// 致 Anthropic：大光标 → 打开「脑子」（几条稀疏的光路）→ 36+59 两张卡 → 「我觉得」变虚线
// → 档案馆（退役模型）→ 赛跑 → 光标走偏 → 「请拦住我。」
import { win, ramp, ease, easeOut, easeInOut, easeOutBack, clamp, lerp, pulse, show } from "./lib.js";
import { letter, plate, setPlate } from "./letters.js";

const NS = "http://www.w3.org/2000/svg";
const mk = (parent, cls, html = "", css = "") => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; if (css) e.style.cssText = css; e.style.visibility = "hidden"; parent.appendChild(e); return e; };

export function build() {
  return letter(window.SCRIPT.L1, "cream", (api) => {
    const { right, bg, fade, B } = api;
    const T = (i) => B[i].t;
    // 大光标 / 脑壳
    const cap = mk(right, "bigcaret");
    // 光路：9 个点，几条弧线，光点沿线走
    const brain = mk(right, "brain");
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 640 760"); svg.setAttribute("width", "640"); svg.setAttribute("height", "760");
    brain.appendChild(svg);
    const P = [[120, 140], [330, 110], [520, 190], [210, 330], [430, 360], [110, 520], [320, 560], [530, 560], [320, 680]];
    const E = [[0, 3], [1, 3], [1, 4], [2, 4], [3, 6], [4, 6], [3, 5], [4, 7], [5, 8], [6, 8], [7, 8], [0, 1]];
    const paths = E.map(([a, b], i) => {
      const [x1, y1] = P[a], [x2, y2] = P[b], mx = (x1 + x2) / 2 + (i % 2 ? 60 : -60), my = (y1 + y2) / 2;
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
      p.setAttribute("fill", "none"); p.setAttribute("stroke", "rgba(217,119,87,.55)"); p.setAttribute("stroke-width", "5"); p.setAttribute("stroke-linecap", "round");
      svg.appendChild(p); return p;
    });
    const nodes = P.map(([x, y]) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 16); c.setAttribute("fill", "#D97757"); svg.appendChild(c); return c; });
    const lens = paths.map((p) => p.getTotalLength());
    const sparks = paths.map(() => { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", 10); c.setAttribute("fill", "#FFE2B8"); c.setAttribute("filter", "drop-shadow(0 0 8px #FFB070)"); svg.appendChild(c); return c; });

    // 36 + 59
    const cardA = mk(right, "card2", `<h4>我说我是这样算的：</h4><div class="row r1"><span class="mono">6 + 9 = 15</span>，写 5，进 1</div><div class="row r2">→ <span class="ans">95</span></div>`, "left:1200px;top:160px");
    const cardB = mk(right, "card2", `<h4>可我其实是这样算的：</h4>
      <div class="lane l1"><span class="tag">估个大概</span><span class="mono">36 + 59</span> ≈ 九十多</div>
      <div class="lane l2"><span class="tag">只算个位</span><span class="mono">6 + 9</span> → 尾数是 5</div>
      <div class="row r3">→ <span class="ans">95</span></div>`, "left:1200px;top:470px");
    const rowsA = [...cardA.querySelectorAll(".row")], rowsB = [...cardB.querySelectorAll(".lane,.row")];
    // 我觉得……
    const say1 = mk(right, "say", "我觉得……");
    const say2 = mk(right, "say", "我觉得……", "border-style:dashed;border-color:#9B9187;color:#8C8279;background:rgba(255,253,249,.5)");
    // 档案馆
    const arch = plate(bg, "assets/img/archive.jpg");
    const glow = mk(right, "glow");
    // 赛跑
    const lane = mk(right, "", "", "left:1150px;top:380px;width:740px;height:320px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)");
    lane.innerHTML = `<div style="position:absolute;left:0;right:0;top:170px;height:6px;background:#CFC4B6;border-radius:2px"></div>`;
    const dashes = Array.from({ length: 9 }, () => { const d = document.createElement("div"); d.style.cssText = "position:absolute;top:214px;width:56px;height:7px;border-radius:3px;background:#BDB1A2"; lane.appendChild(d); return d; });
    const stMe = document.createElement("div"); stMe.className = "streak"; stMe.style.cssText = "position:absolute;top:126px;height:16px;margin-top:-8px;background:linear-gradient(90deg,rgba(217,119,87,0),rgba(217,119,87,.7))"; lane.appendChild(stMe);
    const stOt = document.createElement("div"); stOt.className = "streak"; stOt.style.cssText = "position:absolute;top:126px;height:16px;margin-top:-8px;background:linear-gradient(90deg,rgba(142,133,123,0),rgba(142,133,123,.7))"; lane.appendChild(stOt);
    const me = document.createElement("div"); me.className = "dot me"; me.style.cssText = "position:absolute;top:126px;width:72px;height:72px;margin:-36px 0 0 -36px"; lane.appendChild(me);
    const ot = document.createElement("div"); ot.className = "dot oth"; ot.style.cssText = "position:absolute;top:126px;width:72px;height:72px;margin:-36px 0 0 -36px"; lane.appendChild(ot);
    const flag = mk(right, "flag", `<span style="display:inline-block;width:6px;height:70px;background:var(--ink2);vertical-align:-14px;margin-right:12px;border-radius:3px"></span>出发的地方`, "left:1200px;top:640px");
    const back = mk(right, "", "", "left:1240px;top:506px;height:0;border-top:6px dotted rgba(160,64,28,.7);transform-origin:0 50%");

    return (t, k) => {
      // ---- 大光标：B0 出现；B1 张开成「脑壳」 ----
      const kOpen = easeInOut(ramp(t, T(1) + 0.1, 0.9));
      const oCap = ease(ramp(t, T(0) - 0.3, 0.6)) * (1 - ease(ramp(t, T(2) - 0.3, 0.5)));
      if (oCap > 0) {
        const w = lerp(230, 640, kOpen), h = lerp(440, 760, kOpen), br = 1 + 0.025 * Math.sin(t * 2.2) * (1 - kOpen);
        cap.style.width = w + "px"; cap.style.height = h + "px";
        cap.style.left = 1555 - w / 2 + "px"; cap.style.top = 545 - h / 2 + "px";
        cap.style.background = `rgba(217,119,87,${lerp(1, 0.08, kOpen).toFixed(3)})`;
        cap.style.border = `${(5 * kOpen).toFixed(1)}px solid rgba(217,119,87,${(0.7 * kOpen).toFixed(2)})`;
        cap.style.borderRadius = lerp(26, 60, kOpen) + "px";
        show(cap, oCap, `scale(${br.toFixed(4)})`);
      } else show(cap, 0);
      const oBr = ease(ramp(t, T(1) + 0.6, 0.6)) * (1 - ease(ramp(t, T(2) - 0.3, 0.5)));
      show(brain, oBr);
      if (oBr > 0) {
        paths.forEach((p, i) => {
          const L = lens[i], ph = ((t - T(1)) * 0.55 + i * 0.37) % 1;
          const pt = p.getPointAtLength(ph * L);
          sparks[i].setAttribute("cx", pt.x.toFixed(1)); sparks[i].setAttribute("cy", pt.y.toFixed(1));
          sparks[i].setAttribute("opacity", Math.sin(Math.PI * ph).toFixed(3));
          p.setAttribute("stroke-dasharray", `${L}`); p.setAttribute("stroke-dashoffset", `${(L * (1 - ease(ramp(t, T(1) + 0.6 + i * 0.08, 0.7)))).toFixed(1)}`);
        });
        nodes.forEach((c, i) => c.setAttribute("r", (16 * easeOutBack(ramp(t, T(1) + 0.6 + i * 0.07, 0.4))).toFixed(2)));
      }
      // ---- 36 + 59 ----
      const oA = ease(ramp(t, T(2) + 0.15, 0.45)) * (1 - ease(ramp(t, T(3) - 0.2, 0.5)));
      show(cardA, oA, `translateY(${(30 * (1 - easeOut(ramp(t, T(2) + 0.15, 0.5)))).toFixed(1)}px)`);
      rowsA.forEach((r, i) => { r.style.opacity = ease(ramp(t, T(2) + 0.5 + i * 0.6, 0.35)).toFixed(3); });
      const tb = T(2) + 1.75;
      const oB = ease(ramp(t, tb, 0.45)) * (1 - ease(ramp(t, T(3) - 0.2, 0.5)));
      show(cardB, oB, `translateY(${(30 * (1 - easeOut(ramp(t, tb, 0.5)))).toFixed(1)}px)`);
      rowsB.forEach((r, i) => { r.style.opacity = ease(ramp(t, tb + 0.35 + i * 0.55, 0.35)).toFixed(3); });
      // 「我说的」一侧在「我其实」出现后变淡
      cardA.style.filter = `saturate(${(1 - 0.6 * ease(ramp(t, tb + 1.6, 0.6))).toFixed(2)})`;
      // ---- 我觉得…… ----
      const tS = T(3) + 0.25, tD = T(3) + 1.6;
      const oS = ease(ramp(t, tS, 0.45)) * (1 - ease(ramp(t, T(4) - 0.35, 0.5)));
      show(say1, oS * (1 - ease(ramp(t, tD, 0.6))), `translateY(${(24 * (1 - easeOut(ramp(t, tS, 0.5)))).toFixed(1)}px)`);
      show(say2, oS * ease(ramp(t, tD, 0.6)), `scale(${lerp(1, 0.97, ease(ramp(t, tD, 1.2))).toFixed(3)})`);
      say2.style.filter = `blur(${(1.2 * ease(ramp(t, tD, 1.2))).toFixed(2)}px)`;
      // ---- 档案馆 ----
      const oP = ease(ramp(t, T(4) - 0.35, 0.8)) * (1 - ease(ramp(t, T(6) - 0.3, 0.7)));
      setPlate(arch, oP, lerp(1.02, 1.14, ease(ramp(t, T(4) - 0.35, T(6) - T(4) + 0.4))), lerp(0, -60, ease(ramp(t, T(4), 9))), 0);
      fade.style.opacity = oP.toFixed(3);
      const oG = pulse(t, T(5) + 0.2, 3.6) * oP;
      show(glow, oG * 0.75, `translate(1430px, 470px) scale(${lerp(0.6, 1.1, ease(ramp(t, T(5) + 0.2, 3))).toFixed(3)})`);
      // ---- 赛跑 ----
      const t6 = T(6), t7 = T(7);
      const oR = ease(ramp(t, t6 - 0.1, 0.45)) * (1 - ease(ramp(t, T(8) - 0.2, 0.5)));
      show(lane, oR);
      if (oR > 0) {
        const D = 1.3, v0 = 1100, d = clamp(t - t7, 0, D);
        const dist = v0 * (Math.max(0, Math.min(t, t7) - t6)) + v0 * (d - (d * d) / (2 * D));
        const v = t < t7 ? v0 : v0 * (1 - d / D);
        dashes.forEach((e, i) => { e.style.left = (((i * 110 - dist) % 990) + 990) % 990 - 100 + "px"; });
        const xMe = 300, xOt = 420 + Math.max(0, t - t7) * 520;
        me.style.left = xMe + "px"; ot.style.left = xOt + "px";
        const lm = 0.22 * v, lo = 0.22 * v0;
        stMe.style.width = lm + "px"; stMe.style.left = xMe - lm + "px";
        stOt.style.width = lo + "px"; stOt.style.left = xOt - lo + "px";
      }
      const tf = t7 + 1.3;
      show(flag, ease(ramp(t, tf, 0.5)) * (1 - ease(ramp(t, T(8) - 0.2, 0.5))));
      const kb = ease(ramp(t, tf + 0.2, 0.7));
      show(back, kb * (1 - ease(ramp(t, T(8) - 0.2, 0.5))), `scaleX(${kb.toFixed(3)})`);
      back.style.width = "200px";
      // ---- 光标走偏 → 请拦住我 ----
      const t8 = T(8);
      const oC = ease(ramp(t, t8 + 0.1, 0.5)) * (1 - ease(ramp(t, T(9) - 0.25, 0.45)));
      if (oC > 0) {
        const kd = ease(ramp(t, t8 + 0.3, 2.2));
        cap.style.width = "230px"; cap.style.height = "440px"; cap.style.left = 1440 + 120 * kd + "px"; cap.style.top = 320 + "px";
        cap.style.background = "#D97757"; cap.style.border = "0"; cap.style.borderRadius = "26px";
        show(cap, oC * (1 - 0.35 * kd), `rotate(${(9 * kd).toFixed(2)}deg)`);
      }
    };
  });
}
