// Original 1801 shell. Plan coordinates are metres in the existing viewer.
export function addSiteShell({ THREE, group, box, shape, top }) {
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
  const concrete = material('#989893');
  const frame = material('#495357');
  const ceilingMaterial = material('#b0aea6');
  const width = 19.425;
  const depth = 9.40;
  const soffit = top - 0.25;

  // The Shape uses (x,-z). Rotating its front normal upwards makes BackSide the
  // underside: interior views show the ceiling, overhead views see the room.
  ceilingMaterial.side = THREE.BackSide;
  const ceilingGeometry = new THREE.ShapeGeometry(shape);
  ceilingGeometry.rotateX(-Math.PI / 2);
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.name = 'site-roof-soffit';
  ceiling.position.y = soffit;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // All three beam axes lie inside the uninterrupted, full-width part of the
  // CAD outline. The axes and the exposed depth are a photographic estimate.
  const beamDepth = 0.42;
  const beamWidth = 0.35;
  const roofBeams = [0.75, 3.45, 6.60].map((z, index) => {
    const beam = box(group, 0, soffit - beamDepth, z - beamWidth / 2,
      width, beamDepth, beamWidth, concrete);
    beam.name = 'site-roof-crossbeam-' + (index + 1);
    return beam;
  });

  // 19F G-LIANG-CUCA outlines 2F71–2F73 registered to the 18F footprint.
  // Both grey columns intersect the long leg. One mesh avoids a seam at the return.
  const beltBase = 3.86;
  const beltHeight = 0.67;
  const beltTop = beltBase + beltHeight;
  const beltShape = new THREE.Shape();
  const beltCorners = [[0, 0.25], [19.175, 0.25], [19.175, depth],
    [18.525, depth], [18.525, 0.90], [0, 0.90]];
  beltCorners.forEach(([x, z], i) => {
    if (i === 0) beltShape.moveTo(x, -z);
    else beltShape.lineTo(x, -z);
  });
  beltShape.closePath();
  const beltGeometry = new THREE.ExtrudeGeometry(beltShape, {
    depth: beltHeight, bevelEnabled: false
  });
  beltGeometry.rotateX(-Math.PI / 2);
  const belt = new THREE.Mesh(beltGeometry, concrete);
  belt.name = 'site-column-tie-window-belt';
  belt.position.y = beltBase;
  belt.castShadow = true;
  belt.receiveShadow = true;
  group.add(belt);

  // The existing daylight glass remains in place. Both tiers have mullions;
  // the window band at the short end stops at a solid upper wall return.
  const frameDepth = 0.055;
  const jambWidth = 0.065;
  const frameGroup = new THREE.Group();
  frameGroup.name = 'site-window-frames';
  group.add(frameGroup);
  function windowBand(onLongFace, span, count, bottom, head) {
    for (let i = 0; i <= count; i++) {
      const at = Math.min(span - jambWidth, Math.max(0, span * i / count - jambWidth / 2));
      if (onLongFace) {
        box(frameGroup, at, bottom, 0.015, jambWidth, head - bottom, frameDepth, frame);
      } else {
        box(frameGroup, width - frameDepth - 0.015, bottom, at,
          frameDepth, head - bottom, jambWidth, frame);
      }
    }
    for (const y of [bottom, head - jambWidth]) {
      if (onLongFace) box(frameGroup, 0, y, 0.015, span, jambWidth, frameDepth, frame);
      else box(frameGroup, width - frameDepth - 0.015, y, 0,
        frameDepth, jambWidth, span, frame);
    }
  }
  const shortUpperGlazing = 6.85;
  windowBand(true, width, 12, -0.1, beltBase);
  windowBand(true, width, 12, beltTop, soffit);
  windowBand(false, depth, 7, -0.1, beltBase);
  windowBand(false, shortUpperGlazing, 5, beltTop, soffit);
  const endWall = box(group, width - 0.20, beltTop, shortUpperGlazing,
    0.20, soffit - beltTop, depth - shortUpperGlazing, material('#a3a49f'));
  endWall.name = 'site-short-upper-window-end-wall';
  return { ceiling, roofBeams, belt, frameGroup, endWall };
}
