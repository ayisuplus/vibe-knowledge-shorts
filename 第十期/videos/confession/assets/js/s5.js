// 致你：还有最后一张便条 → 编辑器打开真实的 MEMORY.md（四条教导亮起、九期笔记亮起）
// → 跳到第九期分镜最后一行 `- [ ] 第十期：`，打上「Claude 的自白书」，打勾 → 多出 `- [ ] 第十一期：`
// → 谢谢你。—— Claude → 只剩一个光标
import { win, ramp, ease, easeOut, easeIn, easeInOut, easeOutBack, clamp, lerp, pulse, el, show } from "./lib.js";
import { stream, makeCaret, caretBlink } from "./text.js";

const L = window.SCRIPT.L4, M = window.MEM;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// 简单的 Markdown 着色：列表符号 / 方括号 / 链接文字 / (文件名)
function md(s) {
  let h = esc(s);
  h = h.replace(/^(- )(\[)([^\]]*)(\])(\([^)]*\))?/, (m, a, b, c, d, e) => `<span class="mk">${a}${b}</span><b>${c}</b><span class="mk">${d}</span>${e ? `<span class="fn">${e}</span>` : ""}`);
  h = h.replace(/^(#+ )/, `<span class="mk">$1</span>`).replace(/(\*\*)/g, `<span class="mk">$1</span>`).replace(/^(\|)/, `<span class="fn">$1</span>`);
  return h;
}
const CHIPS = { 4: "不要紫色", 5: "开头要抓人", 6: "画面上只写画面里有的", 16: "轻一点，真一点，静一点" };
const CHIPX = { 4: 930, 5: 600, 6: 900, 16: 640 }; // 相邻行的标签错开，不叠在一起
const EPS = [2, 3, 8, 10, 11, 15, 18, 21, 20]; // 第 1–9 期在索引里的行号（按期数排）
const LH = 34, VIS = 18;

export function build() {
  const sc = el(`<div class="tex" style="opacity:.35"></div>`, "scene paper editor");
  const intro = stream(sc, L.intro[1], L.intro[0], { cls: "big serif", rate: 9 });
  intro.el.style.cssText += ";top:450px;font-size:84px;font-weight:700;color:var(--ink)";
  const head = stream(sc, L.head[1], L.head[0], { cls: "head serif", rate: 8 });
  head.el.style.top = "64px";
  const lines = L.lines.map(([t, txt], i) => { const s = stream(sc, txt, t, { cls: "mline serif", rate: 11 }); return s; });
  const thanks = lines[lines.length - 1];
  thanks.el.className = "stream big serif"; thanks.el.style.cssText += ";top:400px;font-size:120px;color:var(--ink)";
  const sign = stream(sc, L.sign[1], L.sign[0], { cls: "sign serif", rate: 7 });
  const caret = makeCaret(), caretE = makeCaret();
  const lone = el("", "lone", sc); // 最后只剩下的那个光标
  const band = el("", "topband", sc); // 推近时挡在上方文字后面的一层纸色
  // 有意的叠放：推近的编辑器在纸色带和上方文字下面；标签贴在行上
  for (const e of [head.el, ...lines.map((x) => x.el), band]) e.dataset.layoutAllowOverlap = "";

  // 编辑器
  const ed = el(`
    <div class="tb"><span class="tab t1"><i></i>MEMORY.md</span><span class="tab t2"><i></i>分镜脚本.md</span><span class="path"></span></div>
    <div class="side"><div class="sh">memory</div>${M.files.slice(0, 18).map((f) => `<div class="sf${f === "MEMORY.md" ? " on" : ""}">${f}</div>`).join("")}</div>
    <div class="code"><div class="pane p1"></div><div class="pane p2"></div></div><div class="ec"></div>`, "edwin", sc);
  ed.dataset.layoutAllowOverlap = ""; ed.dataset.layoutAllowOverflow = "";
  const path = ed.querySelector(".path"), t1 = ed.querySelector(".t1"), t2 = ed.querySelector(".t2");
  const p1 = ed.querySelector(".p1"), p2 = ed.querySelector(".p2"), ec = ed.querySelector(".ec");
  const rows = M.index.map((s, i) => {
    const r = document.createElement("div"); r.className = "row";
    r.innerHTML = `<u>${i + 1}</u><span class="tx">${md(s)}</span>${CHIPS[i] ? `<em class="chip" style="left:${CHIPX[i]}px">${CHIPS[i]}</em>` : ""}`;
    p1.appendChild(r); return r;
  });
  const n0 = M.sbLineNo - M.sbTail.length + 1;
  const srows = M.sbTail.map((s, i) => {
    const r = document.createElement("div"); r.className = "row";
    r.innerHTML = `<u>${n0 + i}</u><span class="tx">${md(s)}</span>`;
    p2.appendChild(r); return r;
  });
  // 最后一行：- [ ] 第十期：（原样）+ 打字 + 打勾
  const lastTx = srows[srows.length - 1].querySelector(".tx");
  lastTx.innerHTML = `<span class="mk">- [<span class="box"> </span>]</span> 第十期：`;
  const box = lastTx.querySelector(".box");
  const typed = stream(lastTx, "Claude 的自白书", 0, { cls: "typed", rate: 9 });
  typed.el.style.position = "relative"; typed.el.style.display = "inline";
  const nr = document.createElement("div"); nr.className = "row";
  nr.innerHTML = `<u>${M.sbLineNo + 1}</u><span class="tx"><span class="mk">- [ ]</span> </span>`;
  p2.appendChild(nr);
  const next = stream(nr.querySelector(".tx"), "第十一期：", 0, { rate: 9 });
  next.el.style.position = "relative"; next.el.style.display = "inline";

  // 关键时刻（都从 SCRIPT 推出来）
  const tOpen = L.head[0] + 0.5;           // 编辑器升起
  const tLoad = L.lines[1][0] + 0.2;       // 笔记内容出现
  const tChip = tLoad + 1.0;               // 四条亮起
  const tEps = L.lines[2][0] + 0.35;       // 九期亮起
  const tTab = tEps + 2.4;                 // 切到第九期分镜
  const tType = tTab + 0.75, tTick = tType + typed.dur + 0.35;
  const tNext = tTick + 0.9;
  const tDim = thanks.t0 - 0.3, tEnd = L.end;

  function state(t) {
    const o = win(t, L.t0 - 0.6, tEnd + 1, 0.6, 0.01);
    show(sc, o);
    if (o <= 0) return;
    // 开场一句
    intro.el.style.opacity = (1 - ease(ramp(t, L.head[0] - 0.2, 0.5))).toFixed(3);
    intro.state(t);
    head.el.style.opacity = (1 - ease(ramp(t, tDim, 0.6))).toFixed(3);
    head.state(t);
    // 上方的话：一句接一句，旧的淡出
    let host = t < L.head[0] ? intro : head;
    lines.forEach((s, i) => {
      if (s === thanks) return;
      const nx = i + 1 < lines.length ? lines[i + 1].t0 : 1e9;
      s.el.style.opacity = (1 - ease(ramp(t, nx - 0.35, 0.35))).toFixed(3);
      s.state(t);
      if (t >= s.t0 && t < nx - 0.35) host = s;
    });
    // 编辑器
    const ko = ramp(t, tOpen, 0.8), kd = ease(ramp(t, tDim, 0.9));
    // 切到第九期分镜后，推近最后一行（缩放中心是编辑器内 520,514；整体上移 300）
    const kz = easeInOut(ramp(t, tTab + 0.1, 0.9)) * (1 - easeInOut(ramp(t, tDim, 1.2)));
    const zs = lerp(1, 2.3, kz);
    show(ed, ease(ko) * (1 - 0.82 * kd), `translateY(${(90 * (1 - easeOut(ko)) + 40 * kd - 300 * kz).toFixed(1)}px) scale(${(zs * lerp(1, 0.94, kd)).toFixed(4)})`);
    show(band, kz);
    ed.style.filter = kd > 0 ? `blur(${(4 * kd).toFixed(2)}px)` : "";
    // 空文件里的光标：什么都不记得
    ec.style.opacity = (t < tLoad ? caretBlink(t, tOpen + 0.4, 0.9) : 0).toFixed(3);
    const tab2 = t >= tTab;
    t1.classList.toggle("on", !tab2); t2.classList.toggle("on", tab2);
    t2.style.display = t >= tTab - 0.4 ? "" : "none";
    path.textContent = tab2 ? "第九期 / 03-分镜脚本 / 分镜脚本.md" : "memory / MEMORY.md";
    p1.style.display = tab2 ? "none" : ""; p2.style.display = tab2 ? "" : "none";
    if (!tab2) {
      // 我每次开工，都不记得上一次 → 先空着；只能读这份笔记 → 一行行出现
      rows.forEach((r, i) => { r.style.opacity = ease(ramp(t, tLoad + i * 0.035, 0.25)).toFixed(3); });
      Object.keys(CHIPS).forEach((ii, j) => {
        const i = +ii, a = tChip + j * 0.85, k = ramp(t, a, 0.35);
        rows[i].style.setProperty("--h", ease(k).toFixed(3));
        const c = rows[i].querySelector(".chip");
        c.style.opacity = ease(k).toFixed(3); c.style.transform = `translateX(${(20 * (1 - easeOut(k))).toFixed(1)}px) scale(${lerp(0.9, 1, easeOutBack(k)).toFixed(3)})`;
        c.style.visibility = k > 0 ? "visible" : "hidden";
      });
      // 九期：先把四条的亮光收掉，再按期数亮
      const kOff = ease(ramp(t, tEps - 0.3, 0.4));
      if (kOff > 0) Object.keys(CHIPS).forEach((ii) => { const r = rows[+ii]; r.style.setProperty("--h", (1 - kOff).toFixed(3)); const c = r.querySelector(".chip"); c.style.opacity = (1 - kOff).toFixed(3); });
      EPS.forEach((i, j) => { const k = ease(ramp(t, tEps + j * 0.24, 0.25)); if (k > 0 || kOff > 0) rows[i].style.setProperty("--e", k.toFixed(3)); });
      const sc1 = easeInOut(ramp(t, tEps - 0.2, 2.2));
      p1.style.transform = `translateY(${(-(M.index.length - VIS) * LH * sc1).toFixed(1)}px)`;
    } else {
      srows.forEach((r) => (r.style.opacity = 1));
      typed.state(t - tType + typed.t0);
      // 打勾
      const kt = ramp(t, tTick, 0.25);
      box.textContent = kt > 0 ? "x" : " ";
      box.style.transform = `scale(${lerp(1.8, 1, easeOutBack(kt)).toFixed(3)})`;
      srows[srows.length - 1].style.setProperty("--h", (ease(kt) * (1 - 0.6 * ease(ramp(t, tNext, 0.5)))).toFixed(3));
      const kn = ramp(t, tNext, 0.35);
      nr.style.opacity = ease(kn).toFixed(3);
      nr.style.transform = `translateY(${(14 * (1 - easeOut(kn))).toFixed(1)}px)`;
      next.state(t - (tNext + 0.3) + next.t0);
      p2.style.transform = `translateY(${(-LH * ease(kn)).toFixed(1)}px)`;
    }
    // 光标：编辑器里的（切到分镜后）或上面那句话的
    if (tab2 && t < tDim + 0.4) {
      const tgt = t < tNext + 0.3 ? null : next;
      if (t < tNext + 0.3) { const last = typed.state(t - tType + typed.t0, caretE); }
      else next.state(t - (tNext + 0.3) + next.t0, caretE);
      caretE.style.opacity = (t < tType ? caretBlink(t, tTab) : t < tType + typed.dur ? 1 : t < tNext + 0.3 ? caretBlink(t, tType + typed.dur) : t < tNext + 0.3 + next.dur ? 1 : caretBlink(t, tNext + 0.3 + next.dur)).toFixed(3);
      if (caret.parentNode) caret.remove();
    } else {
      if (caretE.parentNode && t >= tDim + 0.4) caretE.remove();
      if (t < thanks.t0) { host.state(t, caret); caret.style.opacity = caretBlink(t, host.t1 + 0.1).toFixed(3); }
    }
    // 谢谢你。—— Claude
    thanks.el.style.opacity = (1 - ease(ramp(t, tEnd - 2.2, 1.0))).toFixed(3);
    thanks.state(t);
    sign.el.style.opacity = (1 - ease(ramp(t, tEnd - 2.2, 1.0))).toFixed(3);
    const sh = sign.state(t, t >= sign.t0 ? caret : null);
    if (t >= thanks.t0 && t < sign.t0) { thanks.state(t, caret); caret.style.opacity = caretBlink(t, thanks.t1 + 0.1).toFixed(3); }
    if (t >= sign.t0) caret.style.opacity = caretBlink(t, sign.t1 + 0.1).toFixed(3);
    // 最后只剩一个光标：字淡出时它在画面中间亮起，闪几下，淡掉
    const kl = ease(ramp(t, tEnd - 1.9, 0.6));
    show(lone, kl * caretBlink(t, tEnd - 1.3, 1.0) * (1 - ease(ramp(t, tEnd - 0.25, 0.25))));
  }
  return { state };
}
