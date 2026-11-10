// 总装：建场景 → 插入 HTML 文字层 → 把各段动画写进同一条暂停的时间线 → 每帧驱动按时间计算的状态。
(function () {
  const D = window.D, tl = D.tl;
  const svg = document.getElementById("world");
  D.buildWorld(svg);
  D.scene12();
  D.scene34();
  D.scene56();
  D.scene7();
  D.scene89();

  document.getElementById("hud").insertAdjacentHTML("beforeend", D.html.hud.join(""));
  // x/y 定位的包装组：变换原点固定在本地 (0,0)，关闭 smoothOrigin，避免 GSAP 按包围盒补偿位移
  ["teacher", "teacher-red", "student", "student2", "student3", "student4", "phone", "phone2", "knob-flame", "mini-a", "mini-b"].forEach((id) => gsap.set("#" + id, { svgOrigin: "0 0", smoothOrigin: false }));
  D.steps.forEach((fn) => fn());

  // 驱动：每帧调用所有"按时间计算"的函数（纯函数，只读 tl.time()，可任意跳帧）
  const drive = () => { const t = tl.time(); for (const fn of D.frameFns) fn(t); };
  const driver = { k: 0 };
  tl.fromTo(driver, { k: 0 }, { k: 1, duration: D.DUR, ease: "none", onUpdate: drive, immediateRender: false }, 0);
  drive();
})();
