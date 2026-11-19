// Plan elevations in metres, relative to the 18F building datum (+72.190 m).
// The 18F/19F datum difference is 4.20 m. The 40 mm deck sits directly on steel.
// The window-belt section and its alignment with the steel are design assumptions pending survey.
const floorFinish = 4.20, finishThickness = 0.04, steelTop = floorFinish - finishThickness;
const beltHeight = 0.67, beltBase = steelTop - beltHeight;
const lowerFinish = -0.017, lowerRisers = 17, upperRisers = 9, going = 0.28;
const riser = (floorFinish - lowerFinish) / (lowerRisers + upperRisers);
const midLanding = lowerFinish + lowerRisers * riser;
const lowerStartX = 17.71, thresholdX = 17.43;
const lowerLandingX = lowerStartX - (lowerRisers - 1) * going;
const upperStartX = thresholdX - (upperRisers - 1) * going;
const platformBeamDepth = 0.44, wetFloorFinish = lowerFinish + 0.10;
const opening = [[11.64,6.00],[14.90,6.00],[14.90,7.68],[thresholdX,7.68],[thresholdX,9.27],[11.64,9.27]];
const wetFixtures = Object.freeze({door:{x:12.88,z:8.25},head:{x:12.535,z:6.475},
  drain:{x:12.35,z:6.62,width:.10,depth:.10},basin:{x:11.07,z:8.70,width:.48,depth:.36}});
const midPlatformOutline = [[10.75,6.04],[lowerLandingX,6.04],[lowerLandingX,7.64],
  [upperStartX,7.64],[upperStartX,9.24],[10.75,9.24]];
function planArea(points) {
  return Math.abs(points.reduce((sum,[x,z],i)=>{
    const [nextX,nextZ]=points[(i+1)%points.length];
    return sum + x*nextZ - nextX*z;
  },0))/2;
}
export const MEZZANINE = Object.freeze({
  steelTop, beltBase, beltHeight, finishThickness, floorFinish, lowerFinish, riser, lowerRisers, upperRisers,
  going, midLanding, lowerStartX, lowerLandingX, upperStartX, thresholdX, opening, midPlatformOutline,
  openingArea: planArea(opening), upperArea: 81.965 - planArea(opening),
  platformArea: planArea(midPlatformOutline), platformBeamDepth, wetFloorFinish, wetFixtures, wetHeadBottom: wetFloorFinish+2.22,
  wetBeamClearance: midLanding-platformBeamDepth-wetFloorFinish,
  roomTop: 8.40, primaryDepth: 0.26,
  beltInnerZ: 0.90, beltInnerX: 18.525
});

export function addSiteShell({ THREE, group, box, shape, top }) {
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
  const concrete = material('#989893');
  const frame = material('#495357');
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: '#d7e3e5', roughness: 0.92, transparent: true, opacity: 0.17, depthWrite: false,
    side: THREE.DoubleSide
  });
  const width = 19.425;
  const depth = 9.40;
  const soffit = top - 0.25;

  // Both faces follow the CAD outline, including the entry recess.
  const ceilingGeometry = new THREE.ExtrudeGeometry(shape, {depth: top - soffit, bevelEnabled: false});
  ceilingGeometry.rotateX(-Math.PI / 2);
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.name = 'site-roof-soffit';
  ceiling.position.y = soffit;
  ceiling.renderOrder = 4;
  const roofEdge = new THREE.LineSegments(new THREE.EdgesGeometry(ceilingGeometry),
    new THREE.LineBasicMaterial({color:'#8d9fa4',transparent:true,opacity:0.40,depthWrite:false}));
  roofEdge.renderOrder = 5;
  ceiling.add(roofEdge);
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
  const beltTop = MEZZANINE.steelTop;
  const beltShape = new THREE.Shape();
  const beltCorners = [[0, 0.25], [19.175, 0.25], [19.175, depth],
    [MEZZANINE.beltInnerX, depth], [MEZZANINE.beltInnerX, MEZZANINE.beltInnerZ], [0, MEZZANINE.beltInnerZ]];
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
  const windowBays = {long: 12, short: 7};
  windowBand(true, width, windowBays.long, lowerFinish, beltBase);
  windowBand(true, width, windowBays.long, beltTop, soffit);
  windowBand(false, depth, windowBays.short, lowerFinish, beltBase);
  windowBand(false, shortUpperGlazing, 5, beltTop, soffit);
  const endWall = box(group, width - 0.20, beltTop, shortUpperGlazing,
    0.20, soffit - beltTop, depth - shortUpperGlazing, material('#a3a49f'));
  endWall.name = 'site-short-upper-window-end-wall';
  return { ceiling, roofBeams, belt, frameGroup, endWall, windowBays };
}
