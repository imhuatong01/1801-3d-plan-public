// Existing installations, in plan metres. Heights and duct outlines are estimated from the site images.
export function addSiteServices({ THREE, group, box, top }) {
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.72 });
  const aluminum = material('#cecfc5');
  const galvanized = material('#929c9f');
  const grilleDark = material('#485055');
  const fireRed = material('#a84039');
  const cabinetEdge = material('#b8bab3');
  const cabinetDoor = material('#813c39');
  const addGroup = name => {
    const child = new THREE.Group();
    child.name = name;
    group.add(child);
    return child;
  };
  const hvac = addGroup('site-hvac');
  const fire = addGroup('site-fire');
  const ceilingPipes = addGroup('site-ceiling-pipes');

  const vertical = new THREE.Vector3(0, 1, 0);
  function pipe(parent, a, b, radius, finish) {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const axis = to.clone().sub(from);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, axis.length(), 10), finish);
    mesh.position.copy(from).lerp(to, 0.5);
    mesh.quaternion.setFromUnitVectors(vertical, axis.normalize());
    parent.add(mesh);
    return mesh;
  }

  // ---- 既有大风管（现场02 照片校正，2026-11-19）-----------------------------------------
  // 站在夹层边缘（约 x=11.6, z=4.8）朝 x=0 端墙看：左手玻璃（z=0），右手实墙（z≈7.675），正对端墙有消火栓箱。
  // 白色保温大风管从端墙附近沿 x 方向走到 x≈4.9，圆角转 90 度，再沿 z 方向走到右侧实墙端头封口。
  // 圆角内侧挂着一只带百叶的送风箱，百叶朝下；箱体底面比风管底面低一截（照片里能看见箱体的正立面）。
  // 端墙脚下另有一段更低的白色短风管（沿 z）和镀锌设备风管。
  // 以下尺寸均为照片估计，待现场核尺。
  // 校正前：风管底 6.17、高 0.62（顶 6.79），百叶口与风管底齐平且被风管盖住，在 3D 里几乎看不见。
  // 校正后：风管底 5.95、高 0.55（顶 6.50）。照片里风管顶并没有贴着屋顶梁底（梁底 7.73），中间还有约 1.2 m 空隙，
  // 之前把它画高了约 0.27 m。送风箱底面比风管底再低约 0.45 m。
  const ductBottom = 5.95;
  const ductHeight = 0.55;
  const ductTop = ductBottom + ductHeight;
  const boxDrop = 0.45;                       // 送风箱底面比风管底低
  const boxBottom = ductBottom - boxDrop;
  const boxTop = ductBottom + 0.30;
  const innerEdge = 5.40;                     // 沿 z 走向那一段风管的内侧面（x）
  const ductPlan = new THREE.Shape();
  ductPlan.moveTo(0.20, 4.05);
  ductPlan.lineTo(4.90, 4.05);
  ductPlan.absarc(4.90, 5.40, 1.35, -Math.PI / 2, 0, false);
  ductPlan.lineTo(6.25, 7.57);
  ductPlan.lineTo(innerEdge, 7.57);
  ductPlan.lineTo(innerEdge, 5.40);
  ductPlan.absarc(4.90, 5.40, 0.50, 0, -Math.PI / 2, true);
  ductPlan.lineTo(0.20, 4.90);
  ductPlan.closePath();

  for (const finish of [aluminum, grilleDark]) finish.side = THREE.DoubleSide;
  const trunk = new THREE.Group();
  trunk.name = 'site-duct-rounded-elbow';
  hvac.add(trunk);
  function horizontalSheet(parent, shape, y, finish) {
    const geometry = new THREE.ShapeGeometry(shape, 12);
    geometry.rotateX(Math.PI / 2);
    const sheet = new THREE.Mesh(geometry, finish);
    sheet.position.y = y;
    sheet.castShadow = sheet.receiveShadow = true;
    parent.add(sheet);
    return sheet;
  }
  function rectangle(left, near, right, far) {
    return new THREE.Shape([new THREE.Vector2(left, near), new THREE.Vector2(right, near),
      new THREE.Vector2(right, far), new THREE.Vector2(left, far)]);
  }
  function sidePanel(vertices, x1, z1, x2, z2, low, high) {
    vertices.push(x1, low, z1, x1, high, z1, x2, high, z2,
      x1, low, z1, x2, high, z2, x2, low, z2);
  }
  function casing(parent, vertices, finish) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, finish);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  horizontalSheet(trunk, ductPlan, ductTop, aluminum);
  horizontalSheet(trunk, ductPlan, ductBottom, aluminum);
  const outline = ductPlan.getPoints(12);
  const trunkSides = [];
  for (let i = 1; i < outline.length; i++) {
    const a = outline[i - 1], b = outline[i];
    sidePanel(trunkSides, a.x, a.y, b.x, b.y, ductBottom, ductTop);
  }
  const last = outline[outline.length - 1], first = outline[0];
  if (last.x !== first.x || last.y !== first.y) sidePanel(trunkSides, last.x, last.y, first.x, first.y, ductBottom, ductTop);
  casing(trunk, trunkSides, aluminum);

  // 圆角内侧的送风箱（既有预留出风口）。箱体贴着风管内侧面，顶部藏在风管高度范围内，底面下垂 boxDrop。
  const boxLeft = 4.35, boxNear = 5.45, boxFar = 7.50;
  const branch = new THREE.Group();
  branch.name = 'site-outlet-casing';
  hvac.add(branch);
  const outletBox = box(branch, boxLeft, boxBottom, boxNear, innerEdge - boxLeft, boxTop - boxBottom, boxFar - boxNear, aluminum);
  outletBox.name = 'site-outlet-box';
  // 百叶口：长边沿 z（跟风管同向），朝下，嵌在箱体底面。
  const left = 4.48, right = 5.27, near = 5.62, far = 7.33, rim = 0.035;
  const rimProfile = rectangle(left - rim, near - rim, right + rim, far + rim);
  rimProfile.holes.push(rectangle(left, near, right, far));
  const outlet = horizontalSheet(branch, rimProfile, boxBottom - 0.004, grilleDark);
  outlet.name = 'site-supply-outlet';
  const slatCount = 9, slatWidth = 0.022, slatHeight = 0.012;
  const slat = new THREE.BoxGeometry(slatWidth, slatHeight, far - near);
  const slats = new THREE.InstancedMesh(slat, galvanized, slatCount);
  slats.name = 'site-supply-louvers';
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < slatCount; i++) {
    slats.setMatrixAt(i, matrix.makeTranslation(left + (i + 0.5) * (right - left) / slatCount,
      boxBottom - slatHeight / 2 - 0.004, (near + far) / 2));
  }
  branch.add(slats);
  // 供新增支管读取接口位置（air-layout.js 用）。
  outlet.userData.duct = { ductBottom, ductHeight, ductTop, boxDrop, boxBottom, boxTop, boxLeft, boxNear, boxFar,
    innerEdge, runEndX: 6.25, wallZ: 7.57, photoEstimate: true };

  // 端墙脚下更低的一段白色风管（沿 z，约 x 0.68~1.36），以及镀锌设备风管。照片里这段底面比大风管底再低约 0.3 m。
  const lowerRun = box(hvac, 0.68, ductBottom - 0.30, 4.89, 0.68, 0.60, 2.63, aluminum);
  lowerRun.name = 'site-duct-back-run';
  box(hvac, 1.35, ductBottom + 0.05, 6.64, 1.68, 0.32, 0.42, galvanized).name = 'site-duct-galvanized-1';
  box(hvac, 2.66, ductBottom + 0.05, 7.05, 0.37, 0.32, 0.49, galvanized).name = 'site-duct-galvanized-2';

  // CAD locates the fire cabinet on the x=0 end wall. Its doors face +x, toward the room.
  const cabinet = box(fire, 0.062, 0.04, 6.725, 0.20, 1.62, 0.75, cabinetEdge);
  cabinet.name = 'site-fire-cabinet';
  for (const y of [0.09, 0.87]) box(fire, 0.262, y, 6.763, 0.012, 0.74, 0.674, cabinetDoor);
  const reel = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.044, 8, 32), fireRed);
  reel.rotation.y = Math.PI / 2;
  reel.position.set(0.279, 1.24, 7.10);
  fire.add(reel);
  const riser = pipe(fire, [0.13, 0.48, 7.56], [0.13, 6.62, 7.56], 0.04, fireRed);
  riser.name = 'site-fire-riser';
  pipe(fire, [0.13, 0.48, 7.56], [0.13, 0.48, 7.46], 0.04, fireRed);
  // Only the exposed upper part of the second red line can be traced in the image.
  pipe(fire, [0.14, 2.80, 4.10], [0.14, 6.28, 4.10], 0.038, fireRed);

  // Small silver pipes and rod hangers are visible on both sides of the building. The slab soffit is passed as top.
  const pipeLevel = top - 0.85;
  pipe(ceilingPipes, [0.26, pipeLevel, 2.30], [18.70, pipeLevel, 2.30], 0.029, galvanized);
  for (const x of [3.30, 8.10, 12.90, 17.10]) {
    pipe(ceilingPipes, [x, pipeLevel, 0.80], [x, pipeLevel, 5.80], 0.023, galvanized);
    for (const z of [1.15, 5.45]) {
      pipe(ceilingPipes, [x, pipeLevel, z], [x, top, z], 0.012, galvanized);
    }
  }
  return { hvac, fire, ceilingPipes, outlet, cabinet, riser };
}
