// 「字流出来」：把一段话切成 token，按时间一块块浮现；光标跟在最后一个已出现的 token 后面。
// 和真实的我一样：字不是一个一个打出来的，是一小块一小块冒出来的。全部由 t 算出，可任意跳帧。
import { clamp } from "./lib.js";

const PUNCT = /[，。、：；！？…—」』）》,.!?:;)\]]/;
const OPEN = /[「『（《(\[]/;
// 确定性的「随机」：第 i 个 token 的长度
const hash = (i) => { let x = (i + 1) * 2654435761; x ^= x >>> 13; x = Math.imul(x, 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

/** 文本标记：*重点* 变陶土橙，\n 换行。返回 [{s, em, br}] */
function parse(src) {
  const out = []; let em = false;
  for (const ch of src) {
    if (ch === "*") { em = !em; continue; }
    if (ch === "\n") { out.push({ br: true }); continue; }
    out.push({ s: ch, em });
  }
  return out;
}

/** 切 token：拉丁词 / 数字整块；汉字 1–3 个一块；标点贴在前一块后面，开引号贴在后一块前面 */
function tokenize(chars) {
  const toks = []; let cur = null, k = 0, want = 1, pendingOpen = "";
  const flush = () => { if (cur && cur.s) toks.push(cur); cur = null; };
  for (const c of chars) {
    if (c.br) { flush(); toks.push({ br: true }); continue; }
    const ch = c.s;
    if (PUNCT.test(ch) && toks.length + (cur ? 1 : 0) > 0) {
      if (cur) { cur.s += ch; flush(); } else { const last = [...toks].reverse().find((x) => !x.br); if (last) last.s += ch; }
      continue;
    }
    if (OPEN.test(ch)) { flush(); pendingOpen += ch; continue; }
    const latin = /[A-Za-z0-9+=.≈×]/.test(ch);
    if (ch === " ") { if (cur) cur.s += " "; else pendingOpen += " "; continue; }
    if (cur && latin && cur.latin && !/ $/.test(cur.s)) { cur.s += ch; continue; }
    if (cur && !latin && !cur.latin && cur.s.length < want && cur.em === c.em) { cur.s += ch; continue; }
    flush();
    cur = { s: pendingOpen + ch, em: c.em, latin }; pendingOpen = "";
    want = [1, 2, 2, 3, 1, 2, 3, 2][Math.floor(hash(k++) * 8)];
  }
  flush();
  return toks;
}

/**
 * 一段流式文字。parent 里建 <div class=cls>，返回 { el, state(t, caretEl), dur }。
 * t0 起按 rate（字/秒）浮现。caret 传进来就把它挪到最后一个可见 token 后面。
 */
export function stream(parent, src, t0, { cls = "", rate = 13, fade = 0.18, rise = 0.18 } = {}) {
  const e = document.createElement("div");
  e.className = "stream " + cls;
  const toks = tokenize(parse(src));
  let pos = 0;
  const spans = [];
  for (const tk of toks) {
    if (tk.br) { e.appendChild(document.createElement("br")); continue; }
    const sp = document.createElement("span");
    sp.className = "tk" + (tk.em ? " em" : "");
    sp.textContent = tk.s;
    sp._at = t0 + pos / rate; // 这一块出现的时刻
    pos += [...tk.s.replace(/\s/g, "")].length;
    e.appendChild(sp); spans.push(sp);
  }
  (typeof parent === "string" ? document.getElementById(parent) : parent).appendChild(e);
  const dur = pos / rate;
  function state(t, caret) {
    let last = null;
    for (const sp of spans) {
      const k = clamp((t - sp._at) / fade);
      sp.style.opacity = k.toFixed(3);
      sp.style.transform = k < 1 ? `translateY(${((1 - k) * rise).toFixed(3)}em)` : "";
      if (k > 0) last = sp;
    }
    if (caret) {
      const host = last || spans[0];
      if (last) { if (caret.previousSibling !== last || caret.parentNode !== e) last.after(caret); }
      else if (caret.parentNode !== e || caret.nextSibling !== spans[0]) e.insertBefore(caret, spans[0]);
      return host;
    }
    return last;
  }
  return { el: e, state, dur, t0, t1: t0 + dur, spans };
}

/** 光标：一个零宽的行内锚点，里面绝对定位一根橙色的块。blink(t, tIdle)：流字时常亮，停下来后慢闪 */
export function makeCaret(cls = "") {
  const c = document.createElement("span");
  c.className = "caret " + cls;
  c.innerHTML = "<i></i>";
  return c;
}
export function caretBlink(t, tIdle, period = 1.06) {
  if (t < tIdle) return 1;
  const ph = ((t - tIdle) % period) / period;
  return ph < 0.5 ? 1 : ph < 0.56 ? 1 - (ph - 0.5) / 0.06 : ph < 0.94 ? 0 : (ph - 0.94) / 0.06;
}
