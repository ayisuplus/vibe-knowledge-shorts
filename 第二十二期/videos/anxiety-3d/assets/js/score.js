// 重击点与音画落点：画面（sections.js）和拟音（tools/sfx.mjs）共用，改这里两边一起变。不依赖 three，node 也能读。
import { CUE, CARD_N, Q_N, END_N } from "./beats.js";

export const A = (i) => CUE[i][0], Z = (i) => CUE[i][1];
export { CARD_N, Q_N, END_N };

// S1
export const BAOJING = A(2) + 3.6, ALARM_SLAM = A(2) + 5, AI_SLAM = A(3), DIVE = A(4);
// S2
export const N54_SLAM = A(4) + 3, N62_SMASH = A(5) + 5, L62 = A(5) + 7, ZAI = A(6) + 4, TAO = A(6) + 6, STORM = A(6), YEAR = A(7) + .5;
// S3
export const WORD0 = A(8) + 7.4, THRU = A(9) + 6, XUEMING = A(9) + 7, M500 = A(10) + 7, STAMPS = [A(11) + 1, A(11) + 3, A(11) + 5];
// S4
export const EXPLODE = A(12) + .4, SMOKE = A(13) + .4, FIRE = A(13) + 5, EXTINGUISH = A(13) + 8.4, JIAOLV = A(14) + 4, CLICK = A(15) + 5, WHIP = A(16), GEN1 = A(16) + 1.6, GEN2 = A(16) + 3.6;
// S5
export const BOTTLE_HIT = A(17) + 3.6, NEWWORD = A(19) + 1, GEARS = [A(20) + .5, A(20) + 2, A(20) + 3.5, A(20) + 5], IGNITE = A(21), FLIP = A(22) + 5, GREEN = A(23) + 2.5, COVER = A(24) + .4, SLASH = A(24) + 2, TEAR = A(24) + 2.3, GOLD = A(26) + 2, GOLD_PEAK = Z(26) - 3;
// S6
export const PLATES = [A(27) + 1, A(27) + 2.5, A(27) + 4], MARKS = [A(28) + .3, A(29) + .3, A(30) + .3], PRESS = Z(31) - 2.6, RED = Q_N[0] - 2;

/** 普通重击（约 1 秒一下）与强重击（段落大招）。「一会儿安静」那几拍故意没有。 */
export const HARD = [5.5, ALARM_SLAM, AI_SLAM, N54_SLAM, N62_SMASH, ZAI, TAO, A(8), XUEMING, M500, STAMPS[2], A(12), FIRE, JIAOLV, CLICK, GEN1, GEN2, NEWWORD, IGNITE, FLIP, SLASH, GOLD_PEAK, MARKS[2], PRESS, Q_N[0]];
const SOFT = [0, 1, 2, 3.5, 8, 10, BAOJING, A(3) + 2, A(3) + 4, DIVE, N54_SLAM + 2, N54_SLAM + 4, A(5), A(5) + 2, L62, STORM, STORM + 2, A(7), A(7) + 3, A(8) + 3, A(8) + 5, WORD0 + 2, A(9), A(9) + 2, A(9) + 4, A(10), A(10) + 3, STAMPS[0], STAMPS[1], EXPLODE + 2, A(13), SMOKE + 2, EXTINGUISH, A(14), A(14) + 2, A(15), A(15) + 2, WHIP, A(17), A(17) + 2, BOTTLE_HIT, NEWWORD + 2, NEWWORD + 4, ...GEARS, IGNITE + 2, IGNITE + 4, A(22), A(22) + 2, FLIP + 3, A(23), GREEN, COVER, TEAR + 1, A(25), A(25) + 2, A(25) + 5, A(26), GOLD, A(27), ...PLATES, MARKS[0], MARKS[1], A(31), A(31) + 1, A(31) + 2, CARD_N[0], CARD_N[0] + 2, CARD_N[0] + 4, CARD_N[0] + 6, CARD_N[0] + 8, Q_N[0] + 2, Q_N[0] + 4, Q_N[0] + 6];
export const HITS = [...HARD.map((n) => [n, 1]), ...SOFT.map((n) => [n, .55])].sort((p, q) => p[0] - q[0]);
export function kick(n, rate = 4.5) { let k = 0; for (const [h, w] of HITS) { if (h > n) break; k = Math.max(k, w * Math.exp(-(n - h) * rate)); } return k; }
