// S0 钩子 · 0.06–10.69
// 0.06  superpowers 的文件列表满屏（star 数只在左上角小名牌上当衬托）；镜头往下扫，
//       SKILL.md、AGENTS.md、GEMINI.md 三行依次亮粉，文件名从行里弹出来变成大标签
// 2.45  （重音）其他大仓库的截图从四周甩进来，整面墙倾斜成 3D，superpowers 落到墙的中心格
// 4.32  其他亮着的文件名从墙上剥下来，拖着尾迹飞向画面中央（开头那三个已经在中央）
// 6.43  墙退远、变虚；标签里的「.md」一起闪暖橙，文件夹标签稍暗
// 8.57  标签向中心收拢、消失（之后由 S1 的那张 .md 纸接手，9.0 起出现）
import { clamp, lerp, ramp, ease, easeOut, easeInOut, easeOutBack, el, show } from "./lib.js";

// [截图, 牌子名, star, 墙上位置 x, y, z, 宽, 墙上卡片显示的截图起点（CSS px）]
const CARDS = [
  ["gh-bun", "bun", "9.6 万", -1380, -560, -700, 760, 1480],
  ["gh-uv", "uv", "9.1 万", 1250, 560, -760, 760, 230],
  ["gh-react", "react", "25.1 万", -880, -330, -160, 820, 200],
  ["gh-vscode", "vscode", "19.4 万", 60, -560, -300, 820, 1300],
  ["gh-n8n", "n8n", "20.8 万", 980, -300, -200, 820, 1480],
  ["gh-transformers", "transformers", "16.8 万", -1060, 420, -260, 820, 900],
  ["gh-nextjs", "next.js", "14.3 万", 1000, 300, -60, 820, 1150],
  ["gh-ollama", "ollama", "18.4 万", -60, 560, -380, 820, 1900],
  ["gh-superpowers", "superpowers", "30.1 万", -40, -20, 220, 900, 380],
];
const HERO = "gh-superpowers";
// 墙上要亮的行：AI 用的说明文件和目录
const KEY = /^(CLAUDE|AGENTS|GEMINI)\.md$|^\.(claude|codex|pi|cursor|agents)\b|^skills$/;
const HERO_KEY = /^\.pi\/|^skills$|^(AGENTS|GEMINI)\.md$/;
// superpowers 各行亮起的时间（开场跟着镜头扫到；.pi 等墙成形再亮）
const HERO_ON = { "skills": -0.25, "AGENTS.md": 0.6, "GEMINI.md": 1.15, ".pi/extensions": 3.4 };

// 标签：[文字, 来自哪张卡的哪一行, 落点 x, y, 角度, 弹出时间, 开场的「标注」位置（只有开头三个有）]
// 开头三个在 superpowers 上一亮就弹出来、停在卡片右侧当标注，墙成形时飞去落点；其余 4.32 起从墙上剥下来
const CHIPS = [
  ["SKILL.md", "gh-superpowers", "skills", 840, 470, -2, 0.2, [1430, 330]],
  ["AGENTS.md", "gh-superpowers", "AGENTS.md", 1090, 280, 5, 0.75, [1470, 500]],
  ["GEMINI.md", "gh-superpowers", "GEMINI.md", 1260, 520, 7, 1.3, [1430, 670]],
  ["CLAUDE.md", "gh-react", "CLAUDE.md", 560, 330, -6, 4.32],
  [".claude", "gh-n8n", ".claude", 470, 580, 4, 4.44],
  [".codex", "gh-uv", ".codex/skills/load-github-action-thread", 1180, 690, -5, 4.56],
  [".pi", "gh-superpowers", ".pi/extensions", 760, 700, 6, 4.68],
];
const chipHTML = (s) => s.startsWith(".") ? `<span class="md">.</span>${s.slice(1)}` : s.replace(/\.md$/, '<span class="md">.md</span>');

export function build() {
  const wall = el("", "wall");
  wall.setAttribute("data-layout-allow-overlap", ""); // 墙是拼贴：卡片和牌子互相压是有意的
  const cards = CARDS.map(([name, label, stars, x, y, z, W, off]) => {
    const meta = SHOTS[name];
    const c = el(`<img src="assets/img/${name}.jpg"><div class="tag"><b>${label}</b><span>★ ${stars}</span></div>`, "card", wall);
    c.setAttribute("data-layout-allow-overflow", ""); // 卡片是一扇窗：截图和高亮超出部分被有意裁掉
    const rows = meta.rows.filter((r) => (name === HERO ? HERO_KEY : KEY).test(r.name)).map((r) => ({ ...r, e: el("", "hl", c) }));
    // 飞入方向：从它在墙上的方位往外甩出去 2.6 倍远、更深
    return { name, x, y, z, W, off, meta, c, img: c.querySelector("img"), tag: c.querySelector(".tag"), rows,
      i: CARDS.findIndex((k) => k[0] === name) };
  });

  const chips = CHIPS.map(([txt, from, row, x, y, rot, t0, callout]) => {
    const e = el(chipHTML(txt), "chip", "hud");
    return { txt, from, row, x, y, rot, t0, callout, e, md: e.querySelector(".md"), isMd: txt.endsWith(".md"), trail: el("", "trail", "hud") };
  });

  // 墙的姿态：k=0 时 superpowers 正对镜头、满屏；k=1 时整面墙斜过去
  const poseK = (t) => easeInOut(ramp(t, 2.45, 1.05));
  function setWall(t) {
    const k = poseK(t);
    const drift = clamp(t - 3.5, 0, 2.93) * 22;            // 3.5 起缓慢推近
    const recede = easeInOut(ramp(t, 6.43, 1.4));           // 6.43 起退远
    const tx = lerp(40, -40, k), ty = lerp(-10, -30, k), tz = lerp(-220, -560, k) + drift - recede * 380;
    wall.style.transform = `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${lerp(0, 8, k)}deg) rotateY(${lerp(0, -20, k)}deg) rotateZ(${lerp(0, -1.5, k)}deg)`;
    // 透明度不能设在 preserve-3d 的墙上（会把 3D 压平），乘到每张卡上
    const fade = t < 10.2 ? Math.max(0, 1 - recede * 0.55 - ease(ramp(t, 8.57, 1.1)) * 0.45) : 0;
    wall.style.visibility = fade > 0.001 ? "visible" : "hidden";

    for (const cd of cards) {
      const hero = cd.name === HERO;
      // 卡片尺寸和截图起点：superpowers 从满屏的「英雄卡」过渡到墙上的普通格
      let W = cd.W, H = Math.round(cd.W * 0.66), off = cd.off;
      if (hero) {
        const pan = easeInOut(ramp(t, 0.06, 1.6));          // 第一帧就是文件列表，skills 已在画面里；往下扫到 AGENTS.md、GEMINI.md
        W = lerp(1500, cd.W, k); H = lerp(760, H, k);
        off = lerp(lerp(560, 760, pan), cd.off, k);
      }
      const s = W / 1440;
      off = Math.min(off, cd.meta.h - H / s); // 窗口不能滚出截图底部，否则下半张卡是空白
      // 飞入：其他卡 2.45 起错开甩进来
      const fk = hero ? 1 : easeOut(ramp(t, 2.45 + cd.i * 0.06, 0.95));
      const x = lerp(cd.x * 2.6, cd.x, fk), y = lerp(cd.y * 2.6, cd.y, fk), z = lerp(-1800, cd.z, fk);
      const blur = Math.max(0, -cd.z - 250) / 160 * k + recede * 5;
      Object.assign(cd.c.style, { width: W + "px", height: H + "px", filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "" });
      show(cd.c, (hero ? 1 : ease(ramp(t, 2.45 + cd.i * 0.06, 0.3))) * fade,
        `translate3d(${x - W / 2}px, ${y - H / 2}px, ${z}px) rotateZ(${(1 - fk) * (cd.i % 2 ? 14 : -12)}deg)`);
      cd.img.style.transform = `translateY(${-off * s}px) scale(${s})`;
      show(cd.tag, 1);
      // 高亮行：superpowers 按 HERO_ON 随镜头亮；其他卡 3.3 起依次亮
      cd.rows.forEach((r, j) => {
        const on = hero ? ease(ramp(t, HERO_ON[r.name] ?? 3.4, 0.25)) : ease(ramp(t, 3.3 + j * 0.08 + cd.i * 0.04, 0.3));
        Object.assign(r.e.style, { left: r.x * s + "px", top: (r.y - off) * s + "px", width: r.w * s + "px", height: r.h * s + "px" });
        show(r.e, on);
      });
    }
  }

  // 量一下各标签的起点：墙在它弹出那一刻的姿态下，对应那一行在屏幕上的位置
  const root = document.getElementById("root").getBoundingClientRect();
  for (const ch of chips) {
    setWall(ch.t0);
    const cd = cards.find((c) => c.name === ch.from), r = cd.rows.find((r) => r.name === ch.row);
    const b = r.e.getBoundingClientRect();
    ch.sx = b.left - root.left + Math.min(b.width * 0.25, 160); ch.sy = b.top - root.top + b.height / 2;
  }

  function state(t) {
    setWall(t);

    chips.forEach((ch, i) => {
      const t0 = ch.t0;
      let x, y, sc, rot, landed;
      if (ch.callout) {
        // 开头三个：从那一行弹出到卡片右侧当标注（略放大），2.45 墙成形时飞去落点
        const p1 = easeOut(ramp(t, t0, 0.6)), pop = easeOutBack(ramp(t, t0, 0.55), 1.8), p2 = easeInOut(ramp(t, 2.45, 1.0));
        x = lerp(lerp(ch.sx, ch.callout[0], p1), ch.x, p2); y = lerp(lerp(ch.sy, ch.callout[1], p1), ch.y, p2);
        sc = lerp(lerp(0.5, 1.2, pop), 1, p2); rot = ch.rot * p2; landed = 3.45;
      } else {
        const fly = easeOut(ramp(t, t0, 1.1));
        x = lerp(ch.sx, ch.x, fly); y = lerp(ch.sy, ch.y, fly);
        sc = lerp(0.5, 1, fly); rot = ch.rot * fly; landed = t0 + 1.1;
      }
      y += Math.sin((t - 5) * 1.3 + i * 1.7) * 6 * ramp(t, landed, 0.6);            // 落定后轻轻漂
      const conv = easeInOut(ramp(t, 8.57 + i * 0.04, 0.75));                       // 8.57 起收拢到中心
      x = lerp(x, 960, conv); y = lerp(y, 470, conv); sc *= lerp(1, 0.3, conv);
      // 6.43：「.md」一起闪；文件夹标签稍暗，把注意力留给 .md
      const flash = Math.sin(Math.PI * clamp(ramp(t, 6.43, 0.9)));
      if (ch.isMd) {
        ch.md.style.textShadow = flash > 0.01 ? `0 0 ${(18 * flash).toFixed(1)}px rgba(var(--md-a), .8)` : "";
        ch.e.style.boxShadow = flash > 0.01 ? `0 18px 40px -14px rgba(31, 35, 40, .5), 0 0 0 ${(6 + 8 * flash).toFixed(1)}px rgba(var(--md-a), ${(0.16 + 0.3 * flash).toFixed(2)})` : "";
        sc *= 1 + 0.08 * flash;
      }
      const dimFolder = ch.isMd ? 1 : 1 - 0.45 * ease(ramp(t, 6.43, 0.5)) * (1 - ease(ramp(t, 8.4, 0.3)));
      const o = (t < t0 ? 0 : ease(ramp(t, t0, 0.15)) * (1 - ease(ramp(t, 8.85 + i * 0.02, 0.22)))) * dimFolder;
      show(ch.e, o, `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`);
      // 尾迹：从起点拖到当前位置，到达后慢慢褪掉
      const dx = x - ch.sx, dy = y - ch.sy, len = Math.hypot(dx, dy);
      const to = (t < t0 ? 0 : ease(ramp(t, t0, 0.1))) * (1 - ease(ramp(t, t0 + (ch.callout ? 0.5 : 0.9), 0.6)));
      Object.assign(ch.trail.style, { width: len.toFixed(1) + "px" });
      show(ch.trail, to, `translate(${ch.sx.toFixed(1)}px, ${ch.sy.toFixed(1)}px) rotate(${Math.atan2(dy, dx).toFixed(4)}rad)`);
    });
  }
  return { state };
}
