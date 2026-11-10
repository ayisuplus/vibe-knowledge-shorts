// 时间真相（单位：秒）。段落窗口来自 03-分镜脚本/_gen/script.py 的 SEGMENTS。
// BGM：Aurelia 系 bgm-270（112.96 BPM，一拍 0.53116 秒）。「五盏红灯熄灭」（OUT）落在第 12 拍，音乐从这一刻起播，
// 所以片子里的整拍＝音乐里的拍。重击点用 Q() 吸整拍，轻击用 H() 吸半拍。
export const BEAT = 60 / 112.96;
export const OUT = 12 * BEAT;   // 6.374 s
export const Q = (t) => OUT + Math.round((t - OUT) / BEAT) * BEAT;
export const H = (t) => OUT + Math.round((t - OUT) / (BEAT / 2)) * (BEAT / 2);
export const DUR = 180.4;
export const S = {
  S1: [0, 18.4], S2: [18.4, 42.0], S3: [42.0, 75.0], S4: [75.0, 95.0],
  S5: [95.0, 125.0], S6: [125.0, 155.0], S7: [155.0, 175.0], S8: [175.0, DUR],
};
