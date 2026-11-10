// 时间真相（单位：秒）。段落窗口来自 03-分镜脚本/_gen/script.py。
// BGM：Aurelia 系 bgm-270（112.96 BPM，一拍 0.53116 秒）。拍网格是 B(n)=n·BEAT；「五盏红灯熄灭」（OUT）落在第 12 拍，
// 音乐从这一刻起播（tools/bgm.mjs），所以片子里的整拍＝音乐里的拍。重击点用 Q() 吸整拍，轻击用 H() 吸半拍。
export const BEAT = 60 / 112.96;
export const B = (n) => n * BEAT;
export const OUT = 12 * BEAT;   // 6.374 s：第 4 小节第 1 拍，音乐从这一刻进来（bgm 切入点 2.303 s 是重拍）
export const Q = (t) => OUT + Math.round((t - OUT) / BEAT) * BEAT;
export const H = (t) => OUT + Math.round((t - OUT) / (BEAT / 2)) * (BEAT / 2);
export const DUR = 209.4;

export const S = {
  S1: [0, 18.4], S2: [18.4, 45.0], S3: [45.0, 81.4], S4: [81.4, 97.8],
  S5: [97.8, 147.8], S6: [147.8, 172.8], S7: [172.8, 196.4], S8: [196.4, DUR],
};
