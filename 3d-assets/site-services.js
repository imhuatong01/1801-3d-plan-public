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

  // Looking toward the x=0 end wall, the trunk runs along the open bay and turns toward the solid wall on the right.
  const ductBottom = 6.17;
  const ductHeight = 0.62;
  const ductPlan = new THREE.Shape();
  ductPlan.moveTo(0.20, 4.05);
  ductPlan.lineTo(4.90, 4.05);
  ductPlan.absarc(4.90, 5.40, 1.35, -Math.PI / 2, 0, false);
  ductPlan.lineTo(6.25, 7.57);
  const innerEdge = 5.40, branchNear = 5.97, branchFar = 7.49, branchLeft = 4.26;
  const branchHeight = 0.40;
  ductPlan.lineTo(innerEdge, 7.57);
  ductPlan.lineTo(innerEdge, branchFar);
  ductPlan.lineTo(innerEdge, branchNear);
  ductPlan.lineTo(innerEdge, 5.40);
  ductPlan.absarc(4.90, 5.40, 0.50, 0, -Math.PI / 2, true);
  ductPlan.lineTo(0.20, 4.90);
  ductPlan.closePath();

  const branchFinish = material('#acb5b5');
  for (const finish of [aluminum, branchFinish, grilleDark]) finish.side = THREE.DoubleSide;
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

  // The terminal connects through an open side of the main duct. Its sheet-metal top
  // is lower than the trunk top; both undersides meet the same finished elevation.
  horizontalSheet(trunk, ductPlan, ductBottom + ductHeight, aluminum);
  const outline = ductPlan.getPoints(12);
  const trunkSides = [];
  const outerBottom = new THREE.Shape();
  outerBottom.moveTo(outline[0].x, outline[0].y);
  for (let i = 1; i < outline.length; i++) {
    const a = outline[i - 1], b = outline[i];
    const branchMouth = a.x === innerEdge && b.x === innerEdge && a.y === branchFar && b.y === branchNear;
    if (branchMouth) {
      outerBottom.lineTo(branchLeft, branchFar);
      outerBottom.lineTo(branchLeft, branchNear);
    }
    outerBottom.lineTo(b.x, b.y);
    sidePanel(trunkSides, a.x, a.y, b.x, b.y,
      ductBottom + (branchMouth ? branchHeight : 0), ductBottom + ductHeight);
  }
  outerBottom.closePath();
  casing(trunk, trunkSides, aluminum);

  const branch = new THREE.Group();
  branch.name = 'site-outlet-casing';
  hvac.add(branch);
  horizontalSheet(branch, rectangle(branchLeft, branchNear, innerEdge, branchFar),
    ductBottom + branchHeight, branchFinish);
  const branchSides = [];
  sidePanel(branchSides, innerEdge, branchFar, branchLeft, branchFar, ductBottom, ductBottom + branchHeight);
  sidePanel(branchSides, branchLeft, branchFar, branchLeft, branchNear, ductBottom, ductBottom + branchHeight);
  sidePanel(branchSides, branchLeft, branchNear, innerEdge, branchNear, ductBottom, ductBottom + branchHeight);
  casing(branch, branchSides, branchFinish);

  // A genuine opening crosses the junction. The rim and louvers sit flush; there is
  // no overlapping duct bottom or solid backing plate across the grille.
  const left = 4.32, right = 5.63, near = 6.04, far = 7.42, rim = 0.035;
  const rimProfile = rectangle(left - rim, near - rim, right + rim, far + rim);
  outerBottom.holes.push(rimProfile.clone());
  horizontalSheet(trunk, outerBottom, ductBottom, aluminum);
  rimProfile.holes.push(rectangle(left, near, right, far));
  const outlet = horizontalSheet(branch, rimProfile, ductBottom, grilleDark);
  outlet.name = 'site-supply-outlet';
  const louverHeight = 0.012;
  const louver = new THREE.BoxGeometry(right - left, louverHeight, 0.019);
  const slats = new THREE.InstancedMesh(louver, galvanized, 15);
  slats.name = 'site-supply-louvers';
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < slats.count; i++) {
    slats.setMatrixAt(i, matrix.makeTranslation((left + right) / 2, ductBottom + louverHeight / 2,
      near + (i + 0.5) * (far - near) / slats.count));
  }
  branch.add(slats);
  box(hvac, 0.68, 6.23, 4.89, 0.68, 0.43, 2.63, aluminum);
  box(hvac, 1.35, 6.30, 6.64, 1.68, 0.32, 0.42, galvanized);
  box(hvac, 2.66, 6.30, 7.05, 0.37, 0.32, 0.49, galvanized);

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
