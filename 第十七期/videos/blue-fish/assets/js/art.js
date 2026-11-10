// 本期专属绘图：SVG 字符串工厂（建一次，之后只改 opacity / transform）。
// 只画非二次元的东西：官方 Logo（描摹自官方素材，评述性引用）、婴儿 / 成人侧面线稿、恐怖谷横轴的小图标、观众剪影、心形。
// 二次元角色（鲸鱼娘、溟月、D 老师、表情包）一律用用户提供的原图（assets/img/，由 tools/prep-assets.py 裁切 / 抠图），不在代码里画。

/* ---------------- 官方 Logo（描摹自官方素材，viewBox 418×309） ---------------- */
export const LOGO_VB = [418, 309];
let logoD = "";
/** 读描摹出的 logo-whale.svg，取出 path 的 d。film 启动前调用一次（同步 XHR，渲染器里也可用） */
export function loadLogo() {
  if (logoD) return logoD;
  const x = new XMLHttpRequest();
  x.open("GET", window.__LOGO_URL || "assets/img/logo-whale.svg", false); x.send();
  logoD = /d="([^"]+)"/.exec(x.responseText)[1];
  return logoD;
}

/** 官方 Logo（矢量）。部件 .wb；.wo 是虚线轮廓（空椅子上的「鲸鱼影子」用） */
export function whaleSVG(id = "w") {
  const d = loadLogo();
  return `<svg class="art whale" viewBox="-40 -60 498 400" width="498" height="400">
  <g class="wo" style="opacity:0"><path d="${d}" fill="none" stroke="#1279b3" stroke-width="4" stroke-dasharray="14 12" fill-rule="evenodd"/></g>
  <g class="wb"><path d="${d}" fill="#4d6bfe" fill-rule="evenodd"/></g>
</svg>`;
}

/* ---------------- 侧面头（婴儿图式；线稿，viewBox 0 0 300 300） ---------------- */
export function headSVG(kind = "baby") {
  if (kind === "baby") return `<svg class="art head" viewBox="0 0 300 300" width="300" height="300">
  <path d="M150 40 Q260 40 266 150 Q270 220 220 250 Q200 268 180 262 Q170 280 140 278 Q100 276 96 250 Q60 240 58 196 Q40 190 46 168 Q54 150 62 150 Q60 50 150 40 Z" fill="#fff5ec" stroke="#143a5c" stroke-width="5" stroke-linejoin="round"/>
  <ellipse cx="96" cy="176" rx="12" ry="15" fill="#143a5c"/><circle cx="92" cy="170" r="4" fill="#fff"/>
  <path d="M56 214 Q66 222 76 214" fill="none" stroke="#143a5c" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="120" cy="208" rx="16" ry="9" fill="#ffc0b4"/>
  <path d="M200 160 Q214 150 222 168 Q214 184 202 176" fill="none" stroke="#143a5c" stroke-width="4"/>
</svg>`;
  return `<svg class="art head" viewBox="0 0 300 300" width="300" height="300">
  <path d="M160 46 Q236 46 244 120 Q250 170 230 200 Q222 240 196 268 Q170 290 130 282 Q96 276 90 250 Q70 248 66 232 Q74 222 66 214 Q52 206 62 196 Q56 186 48 178 Q58 150 72 140 Q76 60 160 46 Z" fill="#fff5ec" stroke="#143a5c" stroke-width="5" stroke-linejoin="round"/>
  <path d="M84 142 Q96 136 108 142" fill="none" stroke="#143a5c" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="96" cy="152" rx="7" ry="6" fill="#143a5c"/>
  <path d="M70 222 Q80 228 90 222" fill="none" stroke="#143a5c" stroke-width="4" stroke-linecap="round"/>
  <path d="M182 150 Q196 140 202 160 Q196 176 184 168" fill="none" stroke="#143a5c" stroke-width="4"/>
</svg>`;
}

/* ---------------- 恐怖谷横轴上的小图标（viewBox 0 0 140 140） ---------------- */
export function iconSVG(kind) {
  const W = (s) => `<svg class="art icon" viewBox="0 0 140 140" width="140" height="140">${s}</svg>`;
  if (kind === "robot") return W(`<rect x="30" y="34" width="80" height="70" rx="12" fill="#cfdbe3" stroke="#2f5f7d" stroke-width="5"/><circle cx="54" cy="66" r="9" fill="#2f5f7d"/><circle cx="86" cy="66" r="9" fill="#2f5f7d"/><rect x="50" y="86" width="40" height="7" rx="3" fill="#2f5f7d"/><path d="M70 34 V18" stroke="#2f5f7d" stroke-width="5"/><circle cx="70" cy="14" r="7" fill="#f0a04b"/><rect x="42" y="104" width="56" height="22" rx="6" fill="#cfdbe3" stroke="#2f5f7d" stroke-width="5"/>`);
  if (kind === "doll") return W(`<ellipse cx="70" cy="66" rx="42" ry="50" fill="#d6d9dc" stroke="#6b7680" stroke-width="4"/><ellipse cx="54" cy="62" rx="9" ry="6" fill="#4a535c"/><ellipse cx="86" cy="62" rx="9" ry="6" fill="#4a535c"/><circle cx="54" cy="62" r="2.5" fill="#d6d9dc"/><circle cx="86" cy="62" r="2.5" fill="#d6d9dc"/><path d="M70 66 L66 84 L74 84" fill="none" stroke="#8a949c" stroke-width="3"/><path d="M56 98 Q70 94 84 98" fill="none" stroke="#6b7680" stroke-width="3"/><path d="M40 118 Q70 132 100 118 L104 140 L36 140 Z" fill="#c0c4c8"/>`);
  if (kind === "human") return W(`<path d="M28 60 Q30 14 70 14 Q110 14 112 60 Q100 40 70 40 Q40 40 28 60 Z" fill="#5a3a26"/><ellipse cx="70" cy="70" rx="38" ry="46" fill="#f3cfb4"/><path d="M32 64 Q36 30 70 28 Q104 30 108 64 Q94 44 70 46 Q46 44 32 64 Z" fill="#5a3a26"/><ellipse cx="56" cy="70" rx="5" ry="6" fill="#3b2a20"/><ellipse cx="84" cy="70" rx="5" ry="6" fill="#3b2a20"/><path d="M60 96 Q70 102 80 96" fill="none" stroke="#a2412f" stroke-width="3" stroke-linecap="round"/><path d="M38 120 Q70 134 102 120 L108 140 L32 140 Z" fill="#2f74c8"/>`);
  return W("");
}

/* ---------------- 观众剪影（头 + 肩），viewBox 0 0 160 180 ---------------- */
export function personSVG(fill = "#2f5f7d") {
  return `<svg class="art person" viewBox="0 0 160 180" width="160" height="180"><circle cx="80" cy="56" r="38" fill="${fill}"/><path d="M14 180 Q14 104 80 104 Q146 104 146 180 Z" fill="${fill}"/></svg>`;
}

/* ---------------- 心（viewBox -100 -90 200 190） ---------------- */
export const HEART_D = "M0 72 C-60 30 -96 0 -96 -36 C-96 -66 -72 -86 -48 -86 C-24 -86 -8 -70 0 -54 C8 -70 24 -86 48 -86 C72 -86 96 -66 96 -36 C96 0 60 30 0 72 Z";
