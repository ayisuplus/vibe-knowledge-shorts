// Machine Skill 的宿主：用它的几何库、材质和影棚（kit 原样不改），但不用它自己的时钟和渲染循环——
// 每一帧由我们的 t 驱动（kit 的 driven 模式）：设好零件姿态，再 lab.drive(t, 镜头)。kit 的界面全部隐藏，标注用我们自己的（hud.js）。
import "../../vendor/labkit.js";
const { THREE, Lab } = window.LabKit;
export { THREE };
export const { MAT, GEO, heatGlow } = window.LabKit;

export const lab = new Lab({ theme: "night", size: 1.4, frame: "center", driven: true, view: { az: 74, el: 17, dist: 1.75, target: [0, .36, .38] } });
const canvas = lab.renderer.domElement;
document.getElementById("mech").append(canvas);

/** 特写的底图：虚化的 P 房（中度），用 <img> 预载，第一帧就有 */
const bgImg = document.getElementById("bg-garage-blur");
const bg = new THREE.Texture(bgImg); bg.colorSpace = THREE.SRGBColorSpace; bg.needsUpdate = true;
bg.repeat.set(.9, .9); bg.matrixAutoUpdate = true;

const scenes = [];
/** 注册一个特写：build(group) 建零件；state(t) 设姿态并返回镜头 { az, el, dist, target }；a/b 是窗口 */
export function defineMech(m) {
  const group = new THREE.Group(); group.name = m.name; lab.machine.add(group); m.build(group); group.visible = false;
  scenes.push({ ...m, group });
}
let started = false;
const _v = new THREE.Vector3();
/** 机械特写里的一个点（机器坐标，米）此刻在屏幕上的位置；看不见返回 null */
export function mechPoint(p, obj = lab.machine) {
  _v.set(...p); obj.localToWorld(_v); _v.project(lab.camera);
  return _v.z < 1 ? [(_v.x + 1) * 960, (1 - _v.y) * 540] : null;
}

export function mechState(t) {
  if (!started) { lab.start(); lab.scene.background = bg; lab.floor.material = new THREE.ShadowMaterial({ opacity: .5 }); started = true; }
  const cur = scenes.find((s) => t >= s.a && t < s.b);
  canvas.style.opacity = cur ? cur.opacity(t).toFixed(3) : "0"; canvas.style.visibility = cur ? "visible" : "hidden";
  if (!cur) return;
  for (const s of scenes) s.group.visible = s === cur;
  const v = cur.state(t);
  // 底图跟着镜头方位轻微横移，给一点视差
  bg.offset.set(.05 + (v.az - 74) * .0012, .05 + (v.el - 17) * .0008);
  lab.drive(t, v);
}
