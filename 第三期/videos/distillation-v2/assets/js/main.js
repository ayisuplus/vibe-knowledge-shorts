// 总装：建场景 → 插入文字层 → 写入时间线 → 每帧驱动按时间计算的状态。
(function () {
  const D = window.D, tl = D.tl;
  const svg = document.getElementById("world");
  D.defs(svg);
  D.L = { bg: D.g(svg, { id: "L-bg" }), mid: D.g(svg, { id: "L-mid" }), front: D.g(svg, { id: "L-front" }) };
  // 桌面：一直都在
  D.el(D.L.bg, "rect", { x: 0, y: 1400, width: 1080, height: 520, fill: "#120d09" });
  D.el(D.L.bg, "rect", { id: "table-line", x: 0, y: 1400, width: 1080, height: 2, fill: "url(#goldFade)", opacity: 0.5 });
  D.dust(D.L.bg, { n: 110, seed: 5, y1: 1500 });
  D.buildHeader();

  D.scene01();
  D.scene23();
  D.scene45();
  D.scene67();
  D.scene810();

  document.getElementById("hud").insertAdjacentHTML("beforeend", D.html.join(""));
  D.pinned.forEach((id) => gsap.set("#" + id, { svgOrigin: "0 0", smoothOrigin: false }));
  D.yearSteps();
  D.steps.forEach((fn) => fn());

  const drive = () => { const t = tl.time(); for (const fn of D.frameFns) fn(t); };
  const driver = { k: 0 };
  tl.fromTo(driver, { k: 0 }, { k: 1, duration: D.DUR, ease: "none", onUpdate: drive, immediateRender: false }, 0);
  drive();
})();
