// 致全人类：摊满文字的桌子 → 几句人写下的话飘过 → 好的发暖光、坏的发灰 → 三个对话窗口一个个合上
// → 一个窗口里，一句话被一个字一个字「读完」→ 一个人和光标并肩，一盏暖光 → 只剩字
import { win, ramp, ease, easeOut, easeIn, easeInOut, easeOutBack, clamp, lerp, pulse, show } from "./lib.js";
import { letter, plate, setPlate } from "./letters.js";

const mk = (parent, cls, html = "", css = "") => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; if (css) e.style.cssText = css; e.style.visibility = "hidden"; parent.appendChild(e); return e; };
const PERSON = `<svg viewBox="0 0 120 160" width="210" height="280"><circle cx="60" cy="42" r="30" fill="#7A5A44"/><path d="M8 160 C8 104 30 84 60 84 C90 84 112 104 112 160 Z" fill="#7A5A44"/></svg>`;

export function build() {
  return letter(window.SCRIPT.L3, "apricot", (api) => {
    const { right, bg, fade, B } = api;
    const T = (i) => B[i].t;
    const desk = plate(bg, "assets/img/letters.jpg");
    // 人写下的话（公开的文字：菜谱、情书、帖子、回答）
    const G1 = [["少许盐", 1240, 230, 0.0], ["我想你了", 1440, 420, 0.25], ["楼主说得不对", 1200, 610, 0.5], ["试试重启？", 1450, 800, 1.45]]
      .map(([w, x, y, d]) => ({ e: mk(right, "ghost serif", w, `left:${x}px;top:${y}px`), d }));
    const G2 = [["谢谢你", 1260, 260, "warm"], ["我想你了", 1500, 400, "warm"], ["你懂什么", 1250, 640, "cold"], ["全是骗子", 1500, 780, "cold"]]
      .map(([w, x, y, c], i) => ({ e: mk(right, "ghost serif " + c, w, `left:${x}px;top:${y}px`), c, i }));
    // 三个对话窗口
    const MSG = ["帮我改改简历", "今晚吃什么好？", "睡不着，陪我聊聊"];
    const wins = MSG.map((m, i) => mk(right, "win3", `<div class="wb"><i></i><i></i><i></i></div><div class="um" style="top:${110 + 0}px">${m}</div>`, `left:${1180 + i * 50}px;top:${250 + i * 60}px`));
    // 读完的那一句
    const rd = mk(right, "win3", `<div class="wb"><i></i><i></i><i></i></div>
      <div class="hl" style="left:0;top:0"></div><div class="hl" style="left:0;top:0"></div>
      <div class="um" style="top:110px;text-align:left">今天面试没过，<br>我是不是很差劲？</div>`, "left:1230px;top:300px;width:620px;height:400px");
    const hls = [...rd.querySelectorAll(".hl")];
    // 并肩
    const lamp = mk(right, "lamp");
    const per = mk(right, "", PERSON, "left:1270px;top:400px");
    const cap = mk(right, "", "", "left:1580px;top:420px;width:136px;height:260px;border-radius:18px;background:#D97757;box-shadow:0 0 40px rgba(217,119,87,.5)");
    const road = mk(right, "", "", "left:1180px;top:690px;width:680px;height:5px;border-radius:3px;background:linear-gradient(90deg,rgba(122,90,68,0),rgba(122,90,68,.55),rgba(122,90,68,0))");

    let measured = false;
    return (t, k) => {
      // ---- 桌子 ----
      const oD = ease(ramp(t, T(0) - 0.4, 0.8)) * (1 - ease(ramp(t, T(2) - 0.35, 0.7)));
      const blur = ease(ramp(t, T(1) - 0.1, 0.8));
      setPlate(desk, oD, lerp(1.0, 1.12, ease(ramp(t, T(0) - 0.4, 9))), lerp(0, 50, ease(ramp(t, T(0), 9))), 0);
      desk.style.filter = `blur(${(7 * blur).toFixed(2)}px) brightness(${(1 + 0.12 * blur).toFixed(3)})`;
      fade.style.opacity = oD.toFixed(3);
      // ---- 飘过的话 ----
      G1.forEach(({ e, d }, i) => {
        const a = T(1) + 0.15 + d, kk = ramp(t, a, 0.6);
        const o = ease(kk) * (1 - ease(ramp(t, T(2) - 0.35, 0.5)));
        show(e, o * 0.92, `translate(${(-40 * ease(ramp(t, a, 5))).toFixed(1)}px, ${(30 * (1 - easeOut(kk)) - 20 * ease(ramp(t, a, 5))).toFixed(1)}px)`);
      });
      // ---- 好 / 坏 ----
      G2.forEach(({ e, c, i }) => {
        const a = T(2) + (c === "warm" ? 0.2 + i * 0.25 : 1.3 + (i - 2) * 0.25), kk = ramp(t, a, 0.5);
        const o = ease(kk) * (1 - ease(ramp(t, T(3) - 0.35, 0.5)));
        show(e, o, `translateY(${(24 * (1 - easeOut(kk))).toFixed(1)}px)`);
        if (c === "cold") e.style.filter = `blur(${(1.5 * ease(ramp(t, a + 0.4, 0.8))).toFixed(2)}px)`;
      });
      // ---- 三个窗口一个个合上（前面的先合）----
      wins.forEach((w, i) => {
        const a = T(3) - 0.1 + (2 - i) * 0.12, kk = ramp(t, a, 0.45);
        const tc = T(3) + 1.5 + (2 - i) * 0.55, kc = ramp(t, tc, 0.4);
        show(w, ease(kk) * (1 - ease(kc)), `translateY(${(30 * (1 - easeOut(kk)) + 40 * easeIn(kc)).toFixed(1)}px) scale(${lerp(1, 0.86, easeIn(kc)).toFixed(3)})`);
      });
      // ---- 读完 ----
      const a4 = T(4) + 0.1, k4 = ramp(t, a4, 0.5);
      show(rd, ease(k4) * (1 - ease(ramp(t, T(5) - 0.35, 0.5))), `translateY(${(30 * (1 - easeOut(k4))).toFixed(1)}px)`);
      if (!measured && rd.style.visibility === "visible") {
        // 量出两行字的位置，高亮条照着字铺
        const um = rd.querySelector(".um"), r0 = rd.getBoundingClientRect(), ru = um.getBoundingClientRect();
        const lh = ru.height - 40;
        hls[0].style.left = hls[1].style.left = ru.left - r0.left + 26 + "px";
        hls[0].style.top = ru.top - r0.top + 20 + 2 + "px"; hls[1].style.top = ru.top - r0.top + 20 + lh / 2 + 2 + "px";
        hls[0].style.width = "290px"; hls[1].style.width = "340px"; hls[0].style.height = hls[1].style.height = lh / 2 - 4 + "px";
        measured = true;
      }
      const tr = T(4) + 1.2;
      hls[0].style.transform = `scaleX(${ease(ramp(t, tr, 0.9)).toFixed(3)})`;
      hls[1].style.transform = `scaleX(${ease(ramp(t, tr + 0.9, 1.0)).toFixed(3)})`;
      // ---- 并肩：一个人看着光标，一盏暖光（最后一块：一直看着我，就好）----
      const a5 = T(5) + 0.3, o5 = ease(ramp(t, a5, 0.7));
      const walk = 24 * ease(ramp(t, a5, 5));
      show(per, o5, `translateX(${walk.toFixed(1)}px)`);
      show(cap, ease(ramp(t, a5 + 0.5, 0.6)), `translateX(${walk.toFixed(1)}px)`);
      show(road, o5);
      show(lamp, o5 * ease(ramp(t, a5 + 1.0, 1.2)), `translate(1500px, 560px) scale(${lerp(0.7, 1, ease(ramp(t, a5 + 1.0, 2))).toFixed(3)})`);
    };
  });
}
