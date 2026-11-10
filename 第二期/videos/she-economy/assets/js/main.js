// 总装：收集各段场景的 SVG / HTML，插入页面，再把各段的动画写进同一条暂停的 GSAP 时间线。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;
  const tl = gsap.timeline({ paused: true });
  SE.tl = tl;
  // 她站的位置（两脚中点）与放大倍数：人物占画面高度约 4/5
  SE.DX = 760;
  SE.DY = 990;
  SE.SC = 1.32;
  SE.px = (x) => SE.DX + x * SE.SC;
  SE.py = (y) => SE.DY + y * SE.SC;
  SE.dollT = `translate(${SE.DX} ${SE.DY}) scale(${SE.SC})`;

  const svg = { bg: [], back: [], mid: [], dolls: [], front: [], top: [] };
  const html = { cam: [], hud: [] };
  const steps = [];
  SE.add = (layer, s) => svg[layer].push(s);
  SE.addHTML = (layer, s) => html[layer].push(s);
  SE.step = (fn) => steps.push(fn);

  // ---------- 动画工具 ----------
  const ID = { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0 };
  SE.show = (sel, t, from = { opacity: 0, y: 24 }, d = 0.4, ease = "power3.out", to = {}) => {
    const end = {};
    Object.keys(from).forEach((k) => (end[k] = k in to ? to[k] : ID[k] ?? from[k]));
    Object.assign(end, to);
    tl.fromTo(sel, from, { ...end, duration: d, ease, immediateRender: true }, t);
  };
  SE.hide = (sel, t, d = 0.3) => tl.to(sel, { opacity: 0, duration: d, ease: "power1.in" }, t);
  SE.fx = (sel, t, from, to, d = 0.4, ease = "power2.out") => tl.fromTo(sel, from, { ...to, duration: d, ease }, t);

  // 字幕（底部酒红条）与小字注
  let capN = 0;
  SE.cap = (text, t0, t1, o = {}) => {
    const id = `cap-${capN++}`;
    const cls = o.note ? "cap note" : o.serif ? "cap serif" : "cap";
    html.hud.push(`<div id="${id}" class="${cls}"><span>${text}</span></div>`);
    steps.push(() => {
      SE.show(`#${id}`, t0, { opacity: 0, y: 18 }, 0.35);
      SE.hide(`#${id}`, t1 - 0.25, 0.25);
    });
  };

  // 年龄爆炸贴（HTML），挂在她头部右上方
  let ageN = 0;
  SE.ageSticker = (key, text, t0, t1) => {
    const a = SE.anchors(key);
    const id = `age-${ageN++}`;
    const x = SE.px(a.R * 1.0) + 10, y = SE.py(a.headCY - a.R) - 70;
    const pts = [...Array(16)].map((_, i) => { const r = i % 2 ? 50 : 76; const an = (Math.PI * 2 * i) / 16; return `${f(80 + Math.cos(an) * r)},${f(80 + Math.sin(an) * r)}`; }).join(" ");
    html.cam.push(`<div id="${id}" class="age" style="left:${f(x)}px;top:${f(y)}px"><svg width="160" height="160" viewBox="0 0 160 160"><polygon points="${pts}" fill="${C.yellow}"/></svg><b>${text}</b></div>`);
    steps.push(() => {
      SE.fx(`#${id}`, t0, { opacity: 0, scale: 2.4, rotation: -30 }, { opacity: 1, scale: 1, rotation: 10 }, 0.4, "back.out(2.2)");
      SE.hide(`#${id}`, t1 - 0.3);
    });
  };

  // “被命名的问题”标签：斜贴在她身上
  let labN = 0;
  SE.label = (text, t0, t1, x, y, rot = -6, theme = "pink") => {
    const id = `lab-${labN++}`;
    html.cam.push(`<div id="${id}" class="label ${theme}" style="left:${f(x)}px;top:${f(y)}px"><span>${text}</span></div>`);
    steps.push(() => {
      SE.fx(`#${id}`, t0, { opacity: 0, scale: 1.9, rotation: rot - 14 }, { opacity: 1, scale: 1, rotation: rot }, 0.32, "back.out(2)");
      SE.hide(`#${id}`, t1 - 0.3);
    });
    return id;
  };

  // 商品“扣”上来：先飞到位，再在拍点上一下回弹（像纸扣按下去）
  SE.clickIn = (sel, t, from = { x: 260, y: -160, rotation: 20 }) => {
    tl.fromTo(sel, { opacity: 0, ...from, scale: 1, transformOrigin: "50% 50%" }, { opacity: 1, x: 0, y: 0, rotation: 0, duration: 0.36, ease: "power3.out", immediateRender: true }, t - 0.36);
    tl.fromTo(sel, { scale: 1.22 }, { scale: 1, duration: 0.28, ease: "back.out(3)", immediateRender: false }, t);
  };

  // 年龄切换：旧的翻走，新的像纸片翻过来
  SE.ageSwap = (oldSel, newSel, t) => {
    if (oldSel) tl.to(oldSel, { opacity: 0, scaleX: 0.15, transformOrigin: "50% 100%", duration: 0.18, ease: "power2.in" }, t - 0.18);
    tl.fromTo(newSel, { opacity: 0, scaleX: 0.15, transformOrigin: "50% 100%" }, { opacity: 1, scaleX: 1, duration: 0.32, ease: "back.out(2)", immediateRender: true }, t);
  };

  // 大数字卡：关键数字用超大字号放在画面空着的一侧
  let statN = 0;
  SE.stat = (big, small, t0, t1, x, y, o = {}) => {
    const id = `stat-${statN++}`;
    const align = o.align || "left";
    const color = o.color || C.inkDeep;
    const fam = o.serif ? "SESerif" : "SESans";
    const pos = align === "right" ? `right:${f(1920 - x - (o.w || 720))}px` : `left:${f(x)}px`;
    html.cam.push(`<div id="${id}" class="stat" style="${pos};top:${f(y)}px;max-width:${o.w || 720}px;text-align:${align};font-family:${fam}">` +
      `<b style="color:${color};font-size:${o.size || 190}px">${big}</b>${small ? `<i style="color:${color}">${small}</i>` : ""}</div>`);
    steps.push(() => {
      SE.fx(`#${id} b`, t0, { opacity: 0, scale: 1.8, transformOrigin: align === "right" ? "100% 50%" : "0% 50%" }, { opacity: 1, scale: 1 }, 0.3, "back.out(1.8)");
      if (small) SE.fx(`#${id} i`, t0 + 0.12, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, 0.3, "power3.out");
      SE.fx(`#${id}`, t0, { opacity: 0 }, { opacity: 1 }, 0.01, "none");
      SE.hide(`#${id}`, t1 - 0.3);
    });
  };

  // 背景大字：把这一段被命名的问题铺满背景（装饰，不参与可读性检查）
  let ghostN = 0;
  SE.ghost = (word, t0, t1, o = {}) => {
    const id = `ghost-${ghostN++}`;
    const fill = o.fill || "#ffffff";
    const fam = o.serif ? "SESerif" : "SESans";
    let rows = "";
    for (let r = 0; r < 7; r++) {
      const line = Array(8).fill(word).join("　");
      rows += `<text x="${-400 + (r % 2) * 260}" y="${r * 230}" font-family="${fam}" font-weight="900" font-size="${o.size || 170}" fill="${fill}" fill-opacity="${o.op || 0.26}">${line}</text>`;
    }
    svg.bg.push(`<g data-layout-ignore aria-hidden="true" transform="rotate(-12 960 540)"><g id="${id}" opacity="0">${rows}</g></g>`);
    steps.push(() => {
      SE.fx(`#${id}`, t0, { opacity: 0, x: 0 }, { opacity: 1, x: -260 }, Math.max(0.6, t1 - t0), "none");
      tl.to(`#${id}`, { opacity: 0, duration: 0.4 }, t1 - 0.4);
    });
  };

  // 背景色
  SE.bgTo = (color, t, d = 0.8) => tl.to("#bg", { backgroundColor: color, duration: d, ease: "power1.inOut" }, t);

  // ---------- 组装 ----------
  // 背景里慢慢往上漂的价签（粉色段全程，觉醒时消失）
  {
    let tags = "";
    const spots = [[90, 210], [300, 760], [180, 470], [1500, 120], [1760, 420], [1620, 820], [1350, 600], [420, 120], [60, 900], [1820, 980], [1180, 280], [560, 940]];
    spots.forEach(([x, y], i) => {
      tags += `<g transform="translate(${x} ${y}) rotate(${((i * 47) % 50) - 25})"><g class="ftag">${SE.priceTag(0, 0, "¥", { w: 96, h: 50, fs: 24, fill: "#ffffff", ink: C.main[2], hole: "rgba(255,255,255,0)" })}</g></g>`;
    });
    svg.bg.push(`<g id="ftags" data-layout-ignore aria-hidden="true" opacity="0">${tags}</g>`);
    steps.push(() => {
      SE.fx("#ftags", 16.61, { opacity: 0 }, { opacity: 0.55 }, 1.0, "none");
      tl.to("#ftags", { opacity: 0, duration: 2.0, ease: "none" }, 141.7);
      tl.fromTo("#ftags .ftag", { y: 60 }, { y: -60, duration: 6, ease: "sine.inOut", yoyo: true, repeat: 22, stagger: { each: 0.5 }, immediateRender: true }, 0);
    });
  }
  (SE.SCENES || []).forEach((fn) => fn(SE));
  document.getElementById("world").innerHTML =
    `<defs>${SE.defs()}</defs>` + ["bg", "back", "mid", "dolls", "front", "top"].map((k) => `<g id="L-${k}">${svg[k].join("")}</g>`).join("");
  document.getElementById("cam-html").innerHTML = html.cam.join("");
  document.getElementById("hud").innerHTML = html.hud.join("");
  steps.forEach((fn) => fn(tl));

  // ---------- 环境动态：全片不出现完全静止的画面 ----------
  // 她随拍子呼吸（两拍一次 = 1.333 秒），标签轻浮，爆炸贴来回转，背景纹理慢慢漂
  const NS = "http://www.w3.org/2000/svg";
  document.querySelectorAll('#world g[id^="age-"]').forEach((g) => {
    const w = document.createElementNS(NS, "g");
    w.setAttribute("class", "breathe");
    g.parentNode.insertBefore(w, g);
    w.appendChild(g);
  });
  const BEAT2 = 1.333, reps = Math.floor(180 / BEAT2) - 1;
  tl.fromTo(".breathe", { scaleY: 1, transformOrigin: "50% 100%" }, { scaleY: 1.014, duration: BEAT2, ease: "sine.inOut", yoyo: true, repeat: reps, immediateRender: true }, 0);
  tl.fromTo(".label span", { y: 0 }, { y: -6, duration: BEAT2, ease: "sine.inOut", yoyo: true, repeat: reps, immediateRender: true }, 0);
  tl.fromTo(".age svg", { rotation: -6 }, { rotation: 8, duration: BEAT2 * 2, ease: "sine.inOut", yoyo: true, repeat: Math.floor(180 / (BEAT2 * 2)) - 1, immediateRender: true }, 0);
  tl.fromTo(["#s1-dots", "#s4-dense", "#s5-stripes"], { x: 0 }, { x: -216, duration: 180, ease: "none", immediateRender: true }, 0);
})();
