// 总装：建场景 → 插入文字层 → 驱动 tween 每帧调用按时间计算的状态函数。
(function () {
  const D = window.D, tl = D.tl;
  const svg = document.getElementById("world");
  D.defs(svg);
  D.L = { back: D.g(svg, { id: "L-back" }), mid: D.g(svg, { id: "L-mid" }), front: D.g(svg, { id: "L-front" }) };

  // v20：最前面 17.531 秒开场（v18 是 8.823）（满屏的"主义" → 共产主义），之后全片整体后移
  D.sceneIntro();
  D.shifted(17.531, D.scene01);
  // v10：片名前加了 6 秒（马克思的设想 → 一扇门），之后的段落整体后移 6 秒
  // v15：片名后加 3.459 秒过渡（"在 AI 之前，就有人想推开这扇门"）
  D.shifted(26.99, D.scene23);
  // S4–S5 内部仍按重排前的时间写；D.reorder 把凯恩斯挪到撞锁之后（v9）
  D.shifted(26.99, () => D.remapped(D.reorder, D.scene45));
  // S6 用绝对时间；S7 起沿用原时间，整体后移 27.656 秒（配乐 v3）
  D.shifted(26.99, D.scene6);
  D.shifted(54.646, D.scene7);
  D.shifted(54.646, D.scene89);
  // v11：画面完全不同的交界，用过色代替硬切（绝对时间）
  D.dip(D.L.front, 147.64, "#efe6d4", 0.5); // 撞锁（冷白）→ 剪刀差（纸面）
  D.buildCaps();

  document.getElementById("hud").insertAdjacentHTML("beforeend", D.html.join(""));

  const driver = { k: 0 };
  // 用驱动 tween 自己的进度算时间（跳帧时 tl.time() 可能是旧值）
  const drive = () => { const t = driver.k * D.DUR; for (const fn of D.frameFns) fn(t); };
  tl.fromTo(driver, { k: 0 }, { k: 1, duration: D.DUR, ease: "none", onUpdate: drive, immediateRender: false }, 0);
  drive();
})();
