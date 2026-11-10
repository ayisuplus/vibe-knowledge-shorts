// 全片的事件时刻表（纯数据）：画面各层和拟音 tools/sfx.mjs 共用，保证声画同源。时间单位：秒。
// 字幕时间在 03-分镜脚本/_gen/script.py；这里只放「动作」发生的时刻，重击吸整拍 Q()，轻击吸半拍 H()。
import { Q, H, OUT, BEAT } from "./beats.js";
export { OUT };

// ── S1 开场 ──
/** 发车灯：第一盏亮起的时刻，之后每秒一盏（F-17）；熄灭在 OUT */
export const LIGHT0 = 1.4;
export const LIGHTS = [0, 1, 2, 3, 4].map((i) => LIGHT0 + i);
export const FLAG = OUT + .25;                 // 方格旗横扫
export const TROPHY = H(7.0);                  // 奖杯升起
export const SHRINK = H(9.8);                  // 奖杯缩成赛季条
export const TO_CORNER = H(14.6);              // 赛季条缩到左上角
export const TITLE = Q(15.0);                  // 片名
// 赛季条：维斯塔潘的 19 站、佩雷斯的 2 站（第 2、4 站）、新加坡（第 15 站），F-3
export const VER = [1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22];
export const PEREZ = [2, 4], SGP = 15;
export const litAt = (i) => { const v = VER.indexOf(i); if (v >= 0) return 10.3 + v * .085; if (i === 2) return H(12.2); if (i === 4) return H(12.4); return 12.9; };

// ── 场景硬切（底图换场所） ──
export const CUTS = { s3a: 42.0, s3b: H(52.2), s4a: 75.0, s4b: H(91.0) };

// ── S2 规则与设计者 ──
export const DRAW2 = [18.6, 21.8];             // RB19 侧视线稿逐笔画出
export const TUN2 = H(22.0);                   // 隧道亮起
export const Y78 = H(24.0);                    // 年份牌 1978，老车线稿
export const SLAM = Q(26.6);                   // 平底板盖下（重击）
export const Y22 = Q(29.2);                    // 年份牌 2022，平板掀开
export const PAPER = H(32.8);                  // 毕业设计纸页滑入
export const BREAK = Q(38.6);                  // 纸上的车底流线断开

// ── S3 车底与侧箱 ──
export const DOWNF = Q(47.6);                  // 下压力箭头
export const HATCH = H(53.2);                  // 侧箱下切的斜线
export const INLET = H(58.0);                  // 进气口截面
export const BIG = Q(60.4);                    // 新进气口：缺口变大
export const FLOOR_GLOW = Q(64.6);             // 整块车底亮起
export const FLICKER = 69.0;                   // 车底的光开始跳

// ── S4 海豚跳 ──
export const LOWER = [75.4, 77.6];             // 车身越压越低
export const STALL_HITS = [Q(78.0), Q(79.6)];  // 失速、车弹起（两次）
export const WAVE = [80.8, 84.8];              // 波浪轨迹画出
export const PEAKS = 86.0;                     // 波峰处箭头一长一短

// ── S5 前悬架 ──
export const COMP_BRAKE = Q(96.4);             // 对比车刹车点头
export const MECH5 = [100.0, 111.2];           // 机械特写窗口（含淡入淡出）
export const CUT5 = H(106.0);                  // 特写里换机位（硬切）
export const BRAKES5 = [[Q(101.2), H(105.0)], [Q(106.6), H(110.4)]]; // [踩下, 松开]
export const DUAL_BRAKE = Q(112.4);            // 两车并排刹车
export const FLOW5 = H(116.8);                 // 两车车底流线
export const RINGS = [Q(122.4), Q(123.4), Q(152.0), Q(153.0)]; // 链条四环扣上

// ── S6 尾翼与 DRS ──
export const BEAM_SHRINK = Q(127.2);           // 梁翼两片缩成一片
export const DRAG = H(130.4);                  // 阻力箭头
export const MECH6 = [135.2, 151.0];           // DRS 特写窗口
export const DRS = [[Q(136.6), Q(141.6)], [Q(143.2), Q(146.8)]]; // [张开, 合上]
export const STAMP = Q(148.2);                 // 「2011–2025」印章

// ── S7 一条链＋反转 ──
export const CHAIN_LIT = [0, 1, 2, 3].map((i) => Q(156.4) + i * BEAT);
export const PENALTY = Q(161.2);               // 「风洞＋CFD −10%」压进来
export const RECORD = H(166.8);                // 两块胜率数字牌
export const tickAt = (i) => 167.6 + (i - 1) * .16;

// ── S8 问句 ──
export const QUESTION = H(175.8);
