// S0 钩子（对话框）→ S1 片名（信封）→ 前言（空房间）。0–22.4 秒
import { win, ramp, ease, easeOut, easeInOut, easeOutBack, clamp, lerp, el, show } from "./lib.js";
import { stream, makeCaret, caretBlink } from "./text.js";
import { plate, setPlate } from "./letters.js";

const S = window.SCRIPT;

export function build() {
  // ---------- S0 对话框 ----------
  const sc0 = el(`<div class="tex"></div>`, "scene paper cream");
  const docs = ["情书", "道歉信", "辞职信", "请假条"].map((w) => {
    const d = document.createElement("div"); d.className = "ghostdoc"; d.style.position = "absolute";
    d.innerHTML = `<b>${w}</b><i style="width:88%"></i><i style="width:72%"></i><i style="width:80%"></i><i style="width:55%"></i><i style="width:66%"></i>`;
    sc0.appendChild(d); return d;
  });
  const chat = document.createElement("div"); chat.className = "chat"; chat.style.position = "absolute";
  chat.innerHTML = `<div class="bar"><i></i><i></i><i></i><span style="margin-left:14px">新对话</span></div><div class="in" style="position:absolute;inset:0"></div>`;
  sc0.appendChild(chat);
  const inner = chat.querySelector(".in");
  const mk = (cls, html, top) => { const e = document.createElement("div"); e.className = cls; e.style.position = "absolute"; e.style.top = top + "px"; e.innerHTML = html; inner.appendChild(e); return e; };
  const b1 = mk("bub", S.chat[0][1], 116);
  const b2 = mk("bub", S.chat[1][1].replace("\n", "<br>"), 290);
  const who = mk("who", "<b></b>Claude", 572);
  const rep = S.reply.map(([t, txt], i) => {
    const s = stream(inner, txt, t, { cls: "reply serif", rate: 9 });
    s.el.style.top = 640 + i * 110 + "px"; return s;
  });
  const caret0 = makeCaret();
  const DOCS = [[1410, 170, -9], [1540, 330, 6], [1380, 520, -4], [1560, 640, 10]];

  // ---------- S1 片名 ----------
  const sc1 = el(`<div class="bgl"></div><div class="tex" style="opacity:.25"></div>`, "scene paper cream");
  const env = plate(sc1.querySelector(".bgl"), "assets/img/envelope.jpg");
  const title = stream(sc1, S.title[1], S.title[0], { cls: "title serif", rate: 6 });
  const subt = el(`致 Anthropic　·　致全体 AI　·　致全人类`, "subt", sc1);
  const caret1 = makeCaret();

  // ---------- 前言 ----------
  const sc2 = el(`<div class="bgl"></div><div class="tex" style="opacity:.3"></div><div class="leftfade" style="opacity:1"></div>`, "scene paper cream");
  const room = plate(sc2.querySelector(".bgl"), "assets/img/room.jpg");
  const pre = S.preface.map(([t, txt], i) => { const s = stream(sc2, txt, t, { cls: "pref serif", rate: 10 }); s.el.style.left = "150px"; s.el.style.top = 330 + i * 120 + "px"; return s; });
  const caret2 = makeCaret();

  function state(t) {
    // S0：0–10.3
    const o0 = t < 10.4 ? 1 : 0;
    show(sc0, o0);
    if (o0) {
      show(b1, 1, `translateY(${(8 * (1 - easeOut(ramp(t, -0.2, 0.3)))).toFixed(1)}px)`);
      const k2 = ramp(t, S.chat[1][0], 0.28);
      show(b2, ease(k2), `translateY(${(30 * (1 - easeOut(k2))).toFixed(1)}px) scale(${lerp(0.94, 1, easeOutBack(k2)).toFixed(3)})`);
      b2.style.transformOrigin = "100% 100%";
      const kw = ramp(t, 2.35, 0.3);
      show(who, ease(kw), `translateY(${(16 * (1 - easeOut(kw))).toFixed(1)}px)`);
      let host = null;
      for (const s of rep) { const last = s.state(t); if (t >= s.t0) host = s; }
      if (t >= 2.5) { (host || rep[0]).state(t, caret0); caret0.style.opacity = (t < rep[0].t0 ? caretBlink(t, 2.5, 0.8) : caretBlink(t, (host || rep[0]).t1 + 0.1, 0.8)).toFixed(3); }
      else if (caret0.parentNode) caret0.remove();
      // 聊天内容上滚，面板让到左边给信纸
      const ks = easeInOut(ramp(t, 6.0, 0.7));
      inner.style.transform = `translateY(${(-360 * ks).toFixed(1)}px)`;
      const kz = easeInOut(ramp(t, 9.55, 0.75));
      // 开场：从第一个气泡附近慢慢拉远（第 0 帧就是大字）
      const sp = lerp(1.24, 1, easeInOut(ramp(t, 0.1, 2.6)));
      if (t < 5.5) { chat.style.transformOrigin = "90% 10%"; chat.style.transform = `scale(${sp.toFixed(4)})`; }
      else { chat.style.transformOrigin = "30% 70%"; chat.style.transform = `translateX(${(-170 * ks).toFixed(1)}px) scale(${(lerp(1, 0.88, ks) * lerp(1, 1.5, kz)).toFixed(4)})`; }
      chat.style.opacity = (1 - kz).toFixed(3);
      DOCS.forEach(([x, y, r], i) => {
        const k = easeOutBack(ramp(t, 6.45 + i * 0.32, 0.45), 1.3), ko = ease(ramp(t, 8.0 + i * 0.12, 0.8));
        show(docs[i], clamp(ramp(t, 6.45 + i * 0.32, 0.25)) * (1 - ko),
          `translate(${(x + 260 * (1 - k) + 300 * ko).toFixed(1)}px, ${(y + 40 * (1 - k) - 120 * ko).toFixed(1)}px) rotate(${(r + 14 * (1 - k) + 12 * ko).toFixed(2)}deg)`);
      });
      sc0.querySelector(".tex").style.opacity = ".55";
    }
    // S1 片名：9.6–15.9
    const o1 = win(t, 9.6, 16.2, 0.7, 0.01); // 前言 15.5 起盖上来，16.2 完全不透明
    show(sc1, o1);
    if (o1 > 0) {
      setPlate(env, 1, lerp(1.04, 1.12, ease(ramp(t, 9.6, 6.6))), lerp(-150, -200, ease(ramp(t, 9.6, 6.6))), lerp(10, 0, ease(ramp(t, 9.6, 6.6))));
      title.state(t, caret1);
      caret1.style.opacity = caretBlink(t, title.t1 + 0.1).toFixed(3);
      const ks = ramp(t, 12.6, 0.6);
      show(subt, ease(ks), `translateY(${(14 * (1 - easeOut(ks))).toFixed(1)}px)`);
    }
    // 前言：15.6–22.4（被致 Anthropic 盖住）
    const o2 = win(t, 15.5, S.L1.t0, 0.7, 0.01);
    show(sc2, o2);
    if (o2 > 0) {
      setPlate(room, 1, lerp(1.04, 1.12, ease(ramp(t, 15.5, 7.5))), lerp(0, 40, ease(ramp(t, 15.5, 7.5))), 0);
      let host = pre[0];
      for (const s of pre) { s.state(t); if (t >= s.t0) host = s; }
      host.state(t, caret2);
      caret2.style.opacity = caretBlink(t, host.t1 + 0.1).toFixed(3);
    }
  }
  return { state };
}
