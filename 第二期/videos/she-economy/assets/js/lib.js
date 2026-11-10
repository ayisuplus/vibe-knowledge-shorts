// 通用：色板、SVG 片段工具、纸扣、价签、模切滤镜。全部是纯函数，只产出字符串，保证逐帧可复现。
(function () {
  const SE = (window.SE = window.SE || {});

  // 色板：只用暖粉（色相 ≥ 345°），深色是暖酒红，不用紫
  SE.C = {
    bg: ["#FFF1F3", "#FFE0E5", "#FFC9D2", "#FFAAB8", "#FF7F95", "#FF5C76"],
    main: ["#FF9EAE", "#FF8597", "#FF6B81", "#FF4D6D", "#F23A55", "#E0243F"],
    ink: "#5A1A24",
    inkDeep: "#3F0C15",
    paper: "#FFFFFF",
    fold: "#F3B6C2",
    yellow: "#FFE14D",
    skin: "#F7D3C2",
    skinShade: "#EDB9A6",
    hair: "#3B2420",
    blush: "#FF8FA3",
    gray: "#9A9590",
    grayBg: "#ECEAE6",
    beige: "#E8DCC8",
    card: "#F2EBDF",
    kraft: "#D6C09A",
    beigeInk: "#3B3128",
  };

  // 小工具
  SE.f = (n) => Math.round(n * 100) / 100;
  SE.attrs = (o) =>
    Object.entries(o)
      .filter(([, v]) => v !== undefined && v !== null && v !== false)
      .map(([k, v]) => `${k}="${typeof v === "number" ? SE.f(v) : v}"`)
      .join(" ");
  SE.g = (inner, a = {}) => `<g ${SE.attrs(a)}>${inner}</g>`;

  // 纸扣：白色圆角小纸片 + 虚线折痕，(x, y) 是纸扣中心
  SE.tab = (x, y, rot = 0, s = 1) =>
    `<g transform="translate(${SE.f(x)} ${SE.f(y)}) rotate(${rot}) scale(${s})">` +
    `<rect x="-13" y="-15" width="26" height="30" rx="6" fill="#fff"/>` +
    `<line x1="-12" y1="9" x2="12" y2="9" stroke="${SE.C.fold}" stroke-width="2.4" stroke-dasharray="4 3"/></g>`;

  // 价签（SVG）：(x, y) 是挂孔位置；text 居中；theme = pink | kraft | white-gray
  SE.priceTag = (x, y, text, o = {}) => {
    const w = o.w || Math.max(120, 26 * [...text].length * (o.fs ? o.fs / 26 : 1) + 44);
    const h = o.h || 58;
    const fill = o.fill || "#fff";
    const ink = o.ink || SE.C.inkDeep;
    const fam = o.serif ? "SESerif" : "SESans";
    const weight = o.serif ? 500 : 800;
    return (
      `<g transform="translate(${SE.f(x)} ${SE.f(y)}) rotate(${o.rot || 0})">` +
      `<path d="M0 0 L20 ${-h / 2} L${w} ${-h / 2} L${w} ${h / 2} L20 ${h / 2} Z" fill="${fill}" stroke="${o.stroke || "none"}" stroke-width="2"/>` +
      `<circle cx="14" cy="0" r="5.5" fill="${o.hole || SE.C.bg[1]}"/>` +
      `<text x="${SE.f(20 + (w - 20) / 2)}" y="${SE.f((o.fs || 26) * 0.36)}" text-anchor="middle" font-family="${fam}" font-weight="${weight}" font-size="${o.fs || 26}" fill="${ink}">${text}</text></g>`
    );
  };

  // 价签细绳
  SE.string = (x1, y1, x2, y2, color = "#fff", sag = 26) =>
    `<path d="M${SE.f(x1)} ${SE.f(y1)} Q${SE.f((x1 + x2) / 2)} ${SE.f(Math.max(y1, y2) + sag)} ${SE.f(x2)} ${SE.f(y2)}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;

  // 模切滤镜（白边 + 暖色投影）和褪色滤镜，放进一个 <defs>
  SE.defs = () => `
  <filter id="cut" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/>
    <feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="outline"/>
    <feGaussianBlur in="d" stdDeviation="6" result="b"/><feOffset in="b" dx="5" dy="9" result="o"/>
    <feFlood flood-color="#7A1F30" flood-opacity="0.30"/><feComposite in2="o" operator="in" result="shadow"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="cutBeige" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/>
    <feFlood flood-color="#FBF7EF"/><feComposite in2="d" operator="in" result="outline"/>
    <feGaussianBlur in="d" stdDeviation="6" result="b"/><feOffset in="b" dx="5" dy="9" result="o"/>
    <feFlood flood-color="#5C4A2E" flood-opacity="0.22"/><feComposite in2="o" operator="in" result="shadow"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="8"/><feOffset dx="5" dy="10" result="o"/>
    <feFlood flood-color="#7A1F30" flood-opacity="0.28"/><feComposite in2="o" operator="in" result="s"/>
    <feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="drain" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncR type="linear" slope="0.72" intercept="0.2"/><feFuncG type="linear" slope="0.72" intercept="0.19"/><feFuncB type="linear" slope="0.72" intercept="0.18"/></feComponentTransfer>
  </filter>
  <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
    <circle cx="18" cy="18" r="6.5" fill="#ffffff" fill-opacity="0.55"/>
  </pattern>
  <pattern id="dotsDense" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
    <circle cx="12" cy="12" r="5" fill="#ffffff" fill-opacity="0.35"/>
  </pattern>
  <pattern id="stripes" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
    <rect width="22" height="44" fill="#ffffff" fill-opacity="0.16"/>
  </pattern>`;
})();
