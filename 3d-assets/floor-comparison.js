// Projection of the open 18F bay onto 17F. The storey height comes from
// the CAD level schedule. Framing and glazing follow the shared-bay assumption.
export function buildFloorComparison({
  THREE, box, openOutline, storeyHeight, columnXs, upperSlabUnderside = storeyHeight - 0.26
}) {
  const floor17 = new THREE.Group();
  floor17.name = 'floor17-open-bay';

  const material = (color, opacity = 1) => new THREE.MeshStandardMaterial({
    color, roughness: 0.84, transparent: opacity < 1, opacity, depthWrite: opacity === 1
  });
  const concrete = material('#979d99');
  const wall = material('#b1c0bb', 0.3);
  const glazing = material('#6995a6', 0.10);
  const frame = material('#52616a');

  const shape = new THREE.Shape(openOutline.map(([x, z]) => new THREE.Vector2(x, -z)));
  const slabGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false });
  slabGeometry.rotateX(-Math.PI / 2);
  const slab = new THREE.Mesh(slabGeometry, material('#b5b5ab'));
  slab.name = 'floor17-slab';
  slab.position.y = -0.16;
  slab.receiveShadow = true;
  floor17.add(slab);

  const left = Math.min(...openOutline.map(([x]) => x));
  const cut = Math.max(...openOutline.map(([x]) => x));
  const front = Math.min(...openOutline.map(([, z]) => z));
  const back = Math.max(...openOutline.map(([, z]) => z));
  const glazingStart = Math.min(...openOutline.filter(([, z]) => z === front).map(([x]) => x));
  const endWallStart = Math.min(...openOutline.filter(([x]) => x === left).map(([, z]) => z));
  box(floor17, left, 0, endWallStart, 0.10, upperSlabUnderside, back - endWallStart, wall).name = 'floor17-end-wall';
  box(floor17, left + 0.10, 0, back - 0.10, cut - left - 0.10, upperSlabUnderside, 0.10, wall).name = 'floor17-back-wall';

  // Clip the section to the surveyed bay; the open cut carries no wall.
  for (const axis of columnXs) {
    const x = Math.max(left, axis - 0.25);
    const end = Math.min(cut, axis + 0.25);
    if (end > x) {
      box(floor17, x, 0, 0.50, end - x, upperSlabUnderside, 0.50, concrete).name = 'floor17-original-column';
    }
  }
  for (const z of [0.75, 3.45, 6.60]) {
    box(floor17, left, upperSlabUnderside - 0.42, z - 0.175,
      cut - left, 0.42, 0.35, concrete).name = 'floor17-projected-head-beam';
  }

  const glazedWidth = cut - glazingStart;
  const glass = box(floor17, glazingStart, 0, front, glazedWidth, upperSlabUnderside, 0.025, glazing);
  glass.castShadow = false;
  glass.name = 'floor17-window';
  const mullion = 0.055;
  for (const y of [0, upperSlabUnderside - mullion]) {
    box(floor17, glazingStart, y, front + 0.025, glazedWidth, mullion, mullion, frame).name = 'floor17-window-rail';
  }
  // Keep the mullions registered with the 18F long facade. A section cut
  // through a pane does not introduce a new window jamb.
  const facadeBay = 19.425 / 12;
  for (let i = 0; i * facadeBay < cut; i++) {
    const x = Math.max(glazingStart, i * facadeBay - mullion / 2);
    box(floor17, x, mullion, front + 0.025, mullion,
      upperSlabUnderside - 2 * mullion, mullion, frame).name = 'floor17-window-mullion';
  }
  return floor17;
}
