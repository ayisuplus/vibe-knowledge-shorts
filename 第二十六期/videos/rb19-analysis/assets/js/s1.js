// S1 开场的画面标注：发车灯（贴在照片里的灯架上，跟着照片一起推）。
import { defineLabels } from "./hud.js";
import { trackPoint, GANTRY } from "./env.js";
import { LIGHT0, OUT } from "./timeline.js";
defineLabels([{ k: "proc", t: "发车灯", a: LIGHT0 - .6, b: OUT - .1, at: (t) => trackPoint(GANTRY, t), dy: -120 }]);
