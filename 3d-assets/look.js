// Drawing-style presentation layer: warm white model, dark outlines, soft light, and
// cut-away walls so the interior reads from any side. It changes appearance only; no geometry.
import * as THREE from 'three';

// New steel is matt jet black (RAL 9005); existing concrete stays mid grey so old and new read apart.
const ANCHORS = [[0.16, '#070708'], [0.45, '#0a0a0b'], [0.50, '#8f9391'], [0.58, '#a9adab'], [0.70, '#d9d8d2'], [0.86, '#efede7'], [1.0, '#f6f4ef']];
const hsl = {h: 0, s: 0, l: 0};
function neutral(l) {
  for (let i = 1; i < ANCHORS.length; i++) {
    if (l <= ANCHORS[i][0]) {
      const [l0, c0] = ANCHORS[i - 1], [l1, c1] = ANCHORS[i];
      return new THREE.Color(c0).lerp(new THREE.Color(c1), Math.max(0, (l - l0) / (l1 - l0)));
    }
  }
  return new THREE.Color(ANCHORS.at(-1)[1]);
}

export function setupLook({scene, renderer, camera, controls = null, model, walls = [], roof = null, roofBeams = [], centre = [9.7, -4.7], wallColor = '#f1ece1'}) {
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  scene.background = new THREE.Color('#f3f1eb');
  scene.traverse(o => {
    if (o.isHemisphereLight) { o.intensity = 2.05; o.color.set('#ffffff'); o.groundColor.set('#d9d2c4'); }
    if (o.isDirectionalLight) {
      o.intensity = 1.55; o.color.set('#fff4e2'); o.position.set(3, 26, 9); o.target.position.set(10, 0, -5); scene.add(o.target);
      Object.assign(o.shadow.camera, {left: -17, right: 17, top: 14, bottom: -14, near: 1, far: 60});
      o.shadow.camera.updateProjectionMatrix(); o.shadow.radius = 5; o.shadow.normalBias = .03;
    }
  });

  // ---- palette: neutrals collapse onto one warm grey ramp; saturated colours keep their meaning.
  const seen = new Set();
  function restyle(m) {
    if (!m || seen.has(m) || !m.isMeshStandardMaterial || m.map || m.userData.keepLook) return;
    seen.add(m);
    // Judge the colour as it is written (sRGB), not in the linear working space: there dark steel greys
    // read as saturated and were being lightened to blue-grey instead of going black.
    m.color.getHSL(hsl, THREE.SRGBColorSpace);
    if (hsl.s < .26) m.color.copy(neutral(hsl.l));
    else m.color.setHSL(hsl.h, Math.min(hsl.s, .5), Math.min(Math.max(hsl.l, .36), .74), THREE.SRGBColorSpace);
    m.roughness = .86; m.metalness = 0;
    m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1;
  }

  // ---- outlines
  const edgeDark = new THREE.LineBasicMaterial({color: '#26323b', transparent: true, opacity: .62});
  const edgeSoft = new THREE.LineBasicMaterial({color: '#4f6772', transparent: true, opacity: .42});
  const edgeOnBlack = new THREE.LineBasicMaterial({color: '#8d969d', transparent: true, opacity: .6});
  const sphere = new THREE.Sphere();
  let edgeCount = 0;
  function outline(o) {
    if (!o.isMesh || o.userData.noEdges || o.userData.areaOverlay || o.userData.edged) return;
    const m = o.material;
    if (!m || Array.isArray(m) || m.map || !m.isMeshStandardMaterial) return;
    const g = o.geometry;
    if (!g || g.type === 'SphereGeometry' || g.type === 'PlaneGeometry' || g.type === 'CircleGeometry' || g.type === 'RingGeometry') return;
    if (!g.boundingSphere) g.computeBoundingSphere();
    sphere.copy(g.boundingSphere);
    const s = o.getWorldScale(new THREE.Vector3());
    if (sphere.radius * Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)) < .11) return;
    if (m.transparent && m.opacity < .09) return;
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, g.type === 'CylinderGeometry' ? 50 : 22),
      m.transparent && m.opacity < .6 ? edgeSoft : (m.color.getHSL(hsl, THREE.SRGBColorSpace).l < .2 ? edgeOnBlack : edgeDark));
    e.raycast = () => {}; e.userData.isLookEdge = true; e.renderOrder = o.renderOrder;
    o.add(e); o.userData.edged = e; edgeCount++;
  }
  model.updateMatrixWorld(true);
  const all = []; scene.traverse(o => { if (o.isMesh) all.push(o); });
  for (const o of all) { if (!Array.isArray(o.material)) restyle(o.material); outline(o); }

  // ---- cut-away: a wall between the camera and the room turns into a faint outline.
  const C = new THREE.Vector3(centre[0], 0, centre[1]);
  const wallState = walls.map(w => {
    w.material = w.material.clone(); w.material.userData.keepLook = true;
    w.material.color.set(wallColor); w.material.transparent = true; w.material.opacity = 1; w.material.depthWrite = true;
    w.material.polygonOffset = true; w.material.polygonOffsetFactor = 1; w.material.polygonOffsetUnits = 1;
    if (w.userData.edged) { w.userData.edged.material = edgeDark.clone(); }
    return {w, c: new THREE.Vector3(), n: new THREE.Vector3(), a: 1};
  });
  const roofParts = [roof, ...roofBeams].filter(Boolean).map(o => {
    o.material = o.material.clone(); o.material.userData.keepLook = true; o.material.transparent = true;
    return {o, base: o === roof ? .16 : 1, a: 1};
  });
  const q = new THREE.Quaternion(), tmp = new THREE.Vector3(), viewDir = new THREE.Vector3(), vt = new THREE.Vector3();
  let last = 0;
  function update(now = performance.now()) {
    const dt = Math.min(.1, (now - last) / 1000 || .016); last = now;
    const k = 1 - Math.exp(-dt * 9);
    const cp = camera.position;
    const camOutside = cp.x < -.3 || cp.x > 19.75 || cp.z > .3 || cp.z < -11 || cp.y > 8.4 || cp.y < -.3;
    camera.getWorldDirection(viewDir);
    const targetDepth = controls ? vt.copy(controls.target).sub(cp).dot(viewDir) : 20;
    for (const s of wallState) {
      const {w} = s;
      w.getWorldPosition(s.c); w.getWorldQuaternion(q); s.n.set(0, 0, 1).applyQuaternion(q);
      tmp.copy(s.c).sub(C); tmp.y = 0;
      if (tmp.dot(s.n) < 0) s.n.negate();           // outward normal
      tmp.copy(camera.position).sub(s.c);
      // Either the camera is on the outer face, or (seen from outside the building) the wall
      // stands in front of the point being looked at. The second test covers the concave entry.
      let outside = tmp.dot(s.n) > .15;
      if (!outside && camOutside) outside = tmp.copy(s.c).sub(camera.position).dot(viewDir) < targetDepth - .6;
      const target = outside ? .045 : 1;
      s.a += (target - s.a) * k;
      w.material.opacity = s.a; w.material.depthWrite = s.a > .92; w.castShadow = s.a > .5;
      if (w.userData.edged) w.userData.edged.material.opacity = .18 + .44 * s.a;
    }
    for (const s of roofParts) {
      const above = camera.position.y > 7.4;
      const target = above ? (s.o === roof ? .03 : .10) : s.base;
      s.a += (target - s.a) * k;
      s.o.material.opacity = s.a; s.o.material.depthWrite = s.a > .92; s.o.castShadow = s.a > .5;
    }
  }
  update();
  return {update, restyle, outline, edgeCount: () => edgeCount};
}
