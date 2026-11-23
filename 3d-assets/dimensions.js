// Always-on dimension layer. Every dimension has a line, two extension lines, end ticks and an
// HTML label that always faces the screen. Colour states where the number comes from:
//   cad  = the park's CAD drawing / level schedule (authoritative)
//   plan = this fit-out design (stair, void, bathroom, mezzanine)
//   est  = read from site photos or assumed, must be measured on site
import * as THREE from 'three';

const SRC = {
  cad: {color: '#0b5f6b', name: 'CAD 图纸'},
  plan: {color: '#b04e12', name: '方案设计'},
  est: {color: '#6a7480', name: '照片估计 · 待现场核尺'}
};

export function setupDimensions({camera, host, model}) {
  const layer = document.createElement('div');
  layer.id = 'dimLayer';
  host.append(layer);
  const css = document.createElement('style');
  css.textContent = `
#dimLayer{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:3;font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans GB",sans-serif}
#dimLayer .q{position:absolute;left:0;top:0;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:700;line-height:18px;will-change:transform}
#dimLayer .d{font-size:13px;background:#fffffff5;border:1px solid;border-radius:4px;padding:0 6px}
#dimLayer .d.cad{color:${SRC.cad.color};border-color:${SRC.cad.color}66}
#dimLayer .d.plan{color:${SRC.plan.color};border-color:${SRC.plan.color}66}
#dimLayer .d.est{color:${SRC.est.color};border-color:${SRC.est.color}88;border-style:dashed}
#dimLayer .l{font-size:12.5px;color:#fff;border-radius:3px;padding:0 7px}
#dimLayer .l::before{content:"▼ ";font-size:9px}
#dimLayer .l.cad{background:${SRC.cad.color}}#dimLayer .l.plan{background:${SRC.plan.color}}#dimLayer .l.est{background:${SRC.est.color}}
#dimLayer .z{font-size:13px;color:#1d2a33;background:#ffffffe0;border:1px solid #1d2a3326;border-radius:11px;padding:1px 10px}
#dimLegend{position:absolute;right:10px;bottom:46px;z-index:4;background:#fffffff0;border:1px solid #1d2a3322;border-radius:8px;padding:6px 10px;font:12px/19px "Microsoft YaHei","PingFang SC",sans-serif;color:#33414b;pointer-events:none}
#dimLegend i{display:inline-block;width:18px;height:0;border-top:3px solid;vertical-align:middle;margin-right:6px}
#dimLegend i.est{border-top-style:dashed}
@media (max-width:640px){#dimLayer .d,#dimLayer .z{font-size:12px}#dimLegend{font-size:11px;line-height:17px;bottom:auto;top:62px;right:8px;padding:4px 8px}}`;
  document.head.append(css);
  const legend = document.createElement('div');
  legend.id = 'dimLegend';
  legend.innerHTML = `<b>尺寸来源（单位：米）</b><br><i style="border-color:${SRC.cad.color}"></i>${SRC.cad.name}（为准）<br><i style="border-color:${SRC.plan.color}"></i>${SRC.plan.name}<br><i class="est" style="border-color:${SRC.est.color}"></i>${SRC.est.name}`;
  host.append(legend);

  const items = [];                 // labels
  const buckets = new Map();        // owner.uuid|src -> {owner,src,pts:[]}
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  model.updateMatrixWorld(true);
  const toLocal = (owner, p) => owner.worldToLocal(model.localToWorld(p.clone()));
  function seg(owner, src, a, b) {
    const key = owner.uuid + '|' + src;
    if (!buckets.has(key)) buckets.set(key, {owner, src, pts: []});
    buckets.get(key).pts.push(toLocal(owner, a), toLocal(owner, b));
  }
  function label(owner, p, text, cls, src, lvl) {
    const el = document.createElement('div');
    el.className = 'q ' + cls + ' ' + src; el.textContent = text; el.style.display = 'none';
    layer.append(el);
    items.push({el, owner, p: toLocal(owner, p), lvl, w: 0, h: 0, shown: false, cls});
  }
  // a, b: model coordinates (absolute elevations). off: vector that pulls the dimension line off the object.
  function dim(owner, a, b, off, text, {src = 'cad', lvl = 2} = {}) {
    a = V(a); b = V(b); off = V(off);
    const a2 = a.clone().add(off), b2 = b.clone().add(off);
    seg(owner, src, a2, b2);
    if (off.lengthSq() > 1e-6) {
      seg(owner, src, a.clone().addScaledVector(off, .12), a.clone().addScaledVector(off, 1.12));
      seg(owner, src, b.clone().addScaledVector(off, .12), b.clone().addScaledVector(off, 1.12));
    }
    const along = b.clone().sub(a).normalize();
    let side = off.lengthSq() > 1e-6 ? off.clone().normalize() : new THREE.Vector3(0, 1, 0).cross(along);
    if (side.lengthSq() < 1e-6) side = new THREE.Vector3(1, 0, 0);
    const t = side.normalize().multiplyScalar(.085).add(along.clone().multiplyScalar(.085));
    for (const p of [a2, b2]) seg(owner, src, p.clone().sub(t), p.clone().add(t));
    label(owner, a2.clone().add(b2).multiplyScalar(.5), text, 'd', src, lvl);
  }
  const level = (owner, p, text, o = {}) => label(owner, V(p), text, 'l', o.src || 'cad', o.lvl || 1);
  const note = (owner, p, text, o = {}) => label(owner, V(p), text, 'z', o.src || 'plan', o.lvl || 2);

  const lines = [];
  function build() {
    for (const {owner, src, pts} of buckets.values()) {
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = src === 'est'
        ? new THREE.LineDashedMaterial({color: SRC[src].color, dashSize: .12, gapSize: .07, depthTest: false, transparent: true, opacity: .95})
        : new THREE.LineBasicMaterial({color: SRC[src].color, depthTest: false, transparent: true, opacity: .95});
      const l = new THREE.LineSegments(g, m);
      if (src === 'est') l.computeLineDistances();
      l.renderOrder = 105; l.raycast = () => {}; l.userData.isDimension = true; l.frustumCulled = false;
      owner.add(l); lines.push(l);
    }
  }

  let enabled = true, detail = 0, frame = 0;      // detail 0 = by distance, 3 = everything
  const chainVisible = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const wp = new THREE.Vector3();
  function update() {
    if (frame++ % 2) return;
    const w = host.clientWidth, h = host.clientHeight, placed = [];
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const cand = [];
    for (const it of items) {
      let ok = enabled && chainVisible(it.owner);
      if (ok) {
        wp.copy(it.p); it.owner.localToWorld(wp);
        const dist = wp.distanceTo(camera.position);
        wp.project(camera);
        // Detail follows on-screen scale (pixels per metre), so a phone and a monitor behave alike.
        const ppm = h / (2 * dist * tanHalf);
        const edge = it.lvl === 1 ? 1.08 : .97;      // only the primary dimensions may be pulled back in from the edge
        ok = wp.z > -1 && wp.z < 1 && Math.abs(wp.x) < edge && Math.abs(wp.y) < edge &&
          (detail >= it.lvl || it.lvl === 1 || (it.lvl === 2 && ppm > 17) || (it.lvl === 3 && ppm > 38));
        if (ok) {
          const hw = (it.w || 80) / 2 + 4;
          it.x = Math.min(w - hw, Math.max(hw, (wp.x + 1) / 2 * w));
          it.y = Math.min(h - 14, Math.max(62, (1 - wp.y) / 2 * h));
          it.dist = dist; cand.push(it);
        }
      }
      if (!ok && it.shown) { it.el.style.display = 'none'; it.shown = false; }
    }
    cand.sort((a, b) => a.lvl - b.lvl || a.dist - b.dist);
    for (const it of cand) {
      if (!it.w) { it.el.style.display = ''; it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; if (!it.shown) it.el.style.display = 'none'; }
      const r = {x: it.x - it.w / 2 - 3, y: it.y - it.h / 2 - 2, w: it.w + 6, h: it.h + 4};
      const clash = placed.some(o => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
      if (clash) { if (it.shown) { it.el.style.display = 'none'; it.shown = false; } continue; }
      placed.push(r);
      it.el.style.transform = `translate(${(it.x - it.w / 2).toFixed(1)}px,${(it.y - it.h / 2).toFixed(1)}px)`;
      if (!it.shown) { it.el.style.display = ''; it.shown = true; }
    }
    for (const l of lines) l.visible = enabled;
    legend.style.display = enabled ? '' : 'none';
    host.dataset.dimensionLabelsShown = String(placed.length);
  }
  return {
    dim, level, note, build, update,
    setEnabled(v) { enabled = v; frame = 0; }, isEnabled: () => enabled,
    setDetail(v) { detail = v; frame = 0; }, getDetail: () => detail,
    count: () => items.length
  };
}
