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
  ductPlan.lineTo(5.40, 7.57);
  ductPlan.lineTo(5.40, 5.40);
  ductPlan.absarc(4.90, 5.40, 0.50, 0, -Math.PI / 2, true);
  ductPlan.lineTo(0.20, 4.90);
  ductPlan.closePath();
  const ductGeometry = new THREE.ExtrudeGeometry(ductPlan, {
    depth: ductHeight, bevelEnabled: false, curveSegments: 12
  });
  ductGeometry.rotateX(Math.PI / 2);
  const duct = new THREE.Mesh(ductGeometry, aluminum);
  duct.name = 'site-duct-rounded-elbow';
  duct.position.y = ductBottom + ductHeight;
  duct.castShadow = true;
  hvac.add(duct);

  // The outlet is a broad downward-facing grille beside and below the wall end of the elbow.
  box(hvac, 4.26, 5.86, 5.97, 1.44, 0.40, 1.52, aluminum);
  const outlet = box(hvac, 4.32, 5.84, 6.04, 1.31, 0.025, 1.38, grilleDark);
  outlet.name = 'site-supply-outlet';
  const louver = new THREE.BoxGeometry(1.30, 0.012, 0.019);
  const slats = new THREE.InstancedMesh(louver, galvanized, 15);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < slats.count; i++) {
    slats.setMatrixAt(i, matrix.makeTranslation(4.975, 5.836, 6.08 + i * 0.092));
  }
  hvac.add(slats);
  box(hvac, 0.68, 6.23, 4.89, 0.68, 0.43, 2.63, aluminum);
  box(hvac, 1.35, 6.30, 6.64, 1.68, 0.32, 0.42, galvanized);
  box(hvac, 2.66, 6.30, 7.05, 0.37, 0.32, 0.49, galvanized);

  // CAD locates the fire cabinet on the x=0 end wall. Its doors face +x, toward the room.
  const cabinet = box(fire, 0.062, 0.04, 6.725, 0.20, 1.62, 0.75, cabinetEdge);
  cabinet.name = 'site-fire-cabinet';
  for (const y of [0.09, 0.87]) box(fire, 0.262, y, 6.763, 0.012, 0.74, 0.674, cabinetDoor);
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
