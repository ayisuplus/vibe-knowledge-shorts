// 时间真相（单位：秒）。动效测试只做正片 ⑤ 段「钻进车底」：翻转看车底 → 剖面气流 → 海豚跳 → 刹车对比。
// 正片 BGM 还没生成（本期起新生成），测试版无音乐，拍网格暂按目标 120 BPM（一拍 0.5 秒）。
export const BEAT = .5;
export const B = (n) => n * BEAT;
export const DUR = 15;

/** 段落窗口：[起, 止]（秒） */
export const S = {
  hero: [0, 1.5],    // 裸碳纤维整车
  flip: [1.5, 4.6],  // 升起翻转，车底朝上
  side: [4.6, 8.4],  // 落回 → 侧面剖面，气流穿过隧道
  porp: [8.4, 11.2], // 海豚跳
  brake: [11.2, 15], // 刹车对比
};
/** 刹车开始 */
export const BRAKE = 11.7;
/** 海豚跳：失速的时刻（秒） */
export const STALLS = [9.05, 10.05];
/** 推镜落点 */
export const HITS = [1.5, 4.6, 8.4, 9.05, 10.05, 11.2, BRAKE];
