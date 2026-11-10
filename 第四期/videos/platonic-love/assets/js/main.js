// 总装：建场景 → 插入文字层 → 驱动 tween 每帧调用按时间计算的状态函数。
(function () {
  const D = window.D, tl = D.tl;
  const svg = document.getElementById("world");
  D.defs(svg);
  D.L = { back: D.g(svg, { id: "L-back" }), mid: D.g(svg, { id: "L-mid" }), front: D.g(svg, { id: "L-front" }) };

  D.scene02();
  D.scene35();
  D.scene67();
  D.scene811();
  D.dust(D.L.front, { n: 70, seed: 5, op: .55 });

  document.getElementById("hud").insertAdjacentHTML("beforeend", D.html.join(""));
  D.steps.forEach((fn) => fn());

  const driver = { k: 0 };
  // 用驱动 tween 自己的进度算时间（跳帧时 tl.time() 可能是旧值）
  const drive = () => { const t = driver.k * D.DUR; for (const fn of D.frameFns) fn(t); };
  tl.fromTo(driver, { k: 0 }, { k: 1, duration: D.DUR, ease: "none", onUpdate: drive, immediateRender: false }, 0);
  drive();
})();
