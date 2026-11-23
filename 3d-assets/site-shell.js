// Plan elevations in metres, relative to the outside / public corridor datum (±0.000).
// Site figures from the owner (2026-11-20): the interior floor is 150 mm below the datum; from that floor to the
// top of the existing concrete beam is 4.250 m, and the finished mezzanine floor is flush with that beam top.
// The mezzanine build-up is 250 mm of steel under a 140 mm poured slab.
const lowerFinish = -0.150;
const floorFinish = lowerFinish + 4.250, finishThickness = 0.14, steelTop = floorFinish - finishThickness;
const beltHeight = 0.67, beltBase = floorFinish - beltHeight;
// With only 4.25 m in total there is no room for a floor over the landing: bathroom + landing + 2.00 m headroom
// + 390 mm floor does not fit. So the floor is left open over the landing and the top of the first flight.
// The landing can then sit one riser higher (18 + 16 risers), which gives the bathroom 1.98 m clear.
const lowerRisers = 18, upperRisers = 16, going = 0.28;
const riser = (floorFinish - lowerFinish) / (lowerRisers + upperRisers);
const midLanding = lowerFinish + lowerRisers * riser;
// The approved landing keeps its 2.20 m depth: both flights meet it at x = 12.95.
const lowerLandingX = 12.95, upperStartX = 12.95;
const lowerStartX = lowerLandingX + (lowerRisers - 1) * going;
const thresholdX = upperStartX + (upperRisers - 1) * going;
// Bathroom floor and entry strip are built up 150 mm to the outside datum, so the waste pipe can fall inside.
const wetRaise = 0.15;
const wetFloorFinish = lowerFinish + wetRaise;
// Steel zone is 250 mm deep: HN250x125 edge beams and trimmers, HM244x175 main beams, 120 x 60 joists.
const primaryDepth = 0.25, mainBeamDepth = 0.244, joistDepth = 0.12;
const headroomLimit = 2.00;
// Flights are 1.20 m wide with a 100 mm gap between them (owner, 2026-11-20). The whole stair stands against
// the back wall at z = 9.40 (owner, 2026-11-23): the 160 mm gap behind the second flight is gone, and the
// landing and the bathroom under it moved back with the stair.
const backWallZ = 9.40;
const stairWidth = 1.20, flightGap = 0.10, upperFlightZ = backWallZ - stairWidth, lowerFlightZ = upperFlightZ - flightGap - stairWidth;
const flightGapZ = lowerFlightZ + stairWidth, openingFrontZ = upperFlightZ;
// Rectangle over the second flight (kept for the stair and steel set-out).
const opening = [[upperStartX,openingFrontZ],[thresholdX,openingFrontZ],[thresholdX,backWallZ],[upperStartX,backWallZ]];
// A 250 mm beam may cross the first flight only where the pitch line is 2.00 m or more below its soffit:
// pitch(x) = lowerFinish + (1 + (lowerStartX - x) / going) * riser.
const deepBeamMinX = lowerStartX - ((steelTop - primaryDepth - headroomLimit - lowerFinish) / riser - 1) * going;
// Eight beams run from the glazed side to the back (owner's framing sketch), about 1.09 m apart, with one
// cross beam along the stair-aisle side. Beam 4 is the edge of the open area: nothing deep is over the top of
// the first flight. Beam 7 is on the arrival line of the second flight.
const beamXs = [10.70, 11.79, 12.88, 13.97, 15.03, 16.09, thresholdX, 18.31];
const mainBeam2X = beamXs[3];
// The landing, and the bathroom under it, are as wide as the two flights together (1.20 + 0.10 + 1.20 = 2.50).
const platformZ0 = lowerFlightZ, platformZ1 = upperFlightZ + stairWidth;
const mezzanineEdgeX = 10.70, voidFrontZ = platformZ0;
// Open area: over the landing and the last treads of the first flight, plus the second flight.
const voidOutline = [[mezzanineEdgeX,voidFrontZ],[mainBeam2X,voidFrontZ],[mainBeam2X,openingFrontZ],
  [thresholdX,openingFrontZ],[thresholdX,backWallZ],[mezzanineEdgeX,backWallZ]];
// Shower fixtures keep their places inside the bathroom, measured from its front edge.
const wetFixtures = Object.freeze({door:{x:12.88,z:platformZ0+1.875},head:{x:11.00,z:platformZ0+.51},
  drain:{x:11.10,z:platformZ0+1.21,width:.10,depth:.10},basin:{x:11.07,z:platformZ0+1.96,width:.48,depth:.36}});
const midPlatformOutline = [[10.75,platformZ0],[lowerLandingX,platformZ0],[lowerLandingX,platformZ1],[10.75,platformZ1]];
function planArea(points) {
  return Math.abs(points.reduce((sum,[x,z],i)=>{
    const [nextX,nextZ]=points[(i+1)%points.length];
    return sum + x*nextZ - nextX*z;
  },0))/2;
}
export const MEZZANINE = Object.freeze({
  steelTop, beltBase, beltHeight, finishThickness, floorFinish, lowerFinish, riser, lowerRisers, upperRisers,
  going, midLanding, lowerStartX, lowerLandingX, upperStartX, thresholdX, opening, midPlatformOutline,
  voidOutline, voidFrontZ, platformZ0, platformZ1, backWallZ, mezzanineEdgeX, beamXs, stairWidth, flightGap, upperFlightZ, lowerFlightZ, joistDepth, mainBeamDepth, headroomLimit, flightGapZ, openingFrontZ, mainBeam2X, deepBeamMinX,
  openingArea: planArea(voidOutline), upperArea: 81.965 - planArea(voidOutline),
  platformArea: planArea(midPlatformOutline), wetRaise, wetFloorFinish, wetFixtures, wetHeadBottom: midLanding-.09,
  wetToPlatformSurface: midLanding-wetFloorFinish,
  roomTop: 8.40, primaryDepth,
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
  const beltTop = MEZZANINE.floorFinish;
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
