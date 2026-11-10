// 总装：建场景 → 插入文字层 → 驱动 tween 每帧调用按时间计算的状态函数。
(function () {
  const D = window.D, tl = D.tl;
  const svg = document.getElementById("world");
  D.defs(svg);
  D.L = { back: D.g(svg, { id: "L-back" }), mid: D.g(svg, { id: "L-mid" }), front: D.g(svg, { id: "L-front" }) };

  D.scene01();
  D.scene23();
  D.scene47();
  D.scene89();
  D.scene1012();
  D.buildCaps();

  document.getElementById("hud").insertAdjacentHTML("beforeend", D.html.join(""));

  const driver = { k: 0 };
  // 用驱动 tween 自己的进度算时间（跳帧时 tl.time() 可能是旧值）
  const drive = () => { const t = driver.k * D.DUR; for (const fn of D.frameFns) fn(t); };
  tl.fromTo(driver, { k: 0 }, { k: 1, duration: D.DUR, ease: "none", onUpdate: drive, immediateRender: false }, 0);
  drive();
})();
