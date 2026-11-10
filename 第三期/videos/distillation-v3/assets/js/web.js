// 真实网络素材（剪报）：截图来自 tools/capture.mjs，原图在 web-src/，裁好的在 assets/web/
(function () {
  const D = window.D;
  D.sceneWeb = () => {
    const L = D.L.front;
    // [id, 文件, x, y, 宽, 宽高比, 倾斜, 来源, 出现, 收起]
    const CL = [
      ["wc-arxiv", "arxiv-crop.jpg", 90, 1100, 900, 1850 / 455, -1.5, "arXiv · 2015", 26.2, 29.75],
      ["wc-qwen3", "arxiv-qwen3-crop.jpg", 70, 1110, 940, 1860 / 150, -1, "arXiv · 2025-05-14", 87.7, 90.3],
      ["wc-eweek", "eweek-qwen-crop.jpg", 90, 1190, 900, 2140 / 260, 1, "eWeek · 2026-08-18", 91.0, 93.4],
      ["wc-anth", "anthropic-crop.jpg", 160, 1000, 760, 1800 / 500, -1.8, "Anthropic · 2026-02-23", 97.95, 99.75],
      ["wc-fair", "nbc-fairuse-crop.jpg", 50, 960, 420, 1460 / 230, -1.5, "NBC News · 2025-06", 102.9, 106.4],
      ["wc-law", "lawfare-crop.jpg", 610, 960, 420, 1260 / 125, 1.5, "Lawfare · 2026-10-08", 103.5, 106.4],
      ["wc-sun", "paper-sun-crop.jpg", 90, 950, 900, 1350 / 410, 1.5, "澎湃新闻 · 2023-05-23", 107.1, 110.5],
      ["wc-nbc", "nbc-ghibli-crop.jpg", 90, 360, 900, 2000 / 620, -1.5, "NBC News · 2025-03", 111.1, 114.7],
      ["wc-paper", "paper-skill-crop.jpg", 470, 390, 520, 1350 / 440, 2, "澎湃新闻 · 2026-04-09", 115.3, 118.4],
      ["wc-gh", "gh-skill-crop.jpg", 140, 385, 800, 2340 / 460, -1.2, "GitHub · 现名 distilly", 118.7, 124.3],
    ];
    CL.forEach(([id, src, x, y, w, ar, rot, label, t0, t1]) => { D.clipping(L, id, src, x, y, w, ar, { rot, label }); D.clipAt(id, t0, t1); });
  };
})();
