// Small furniture kit the owner arranges by hand: tea chair, office chair, square table, plus a bar
// counter and two plants used in the default layout. Every piece is a Group centred on its footprint,
// standing on y = 0, facing +z, so it can be moved, scaled (whole or one side) and turned in 90° steps.
import * as THREE from 'three';

const M = (color, rough = .8) => new THREE.MeshStandardMaterial({color, roughness: rough});
const fabric = M('#b9a892'), fabricDark = M('#8f8271'), woodM = M('#c8a777'), woodDark = M('#8b6a48'),
  metal = M('#3b444c', .5), white = M('#f4f1ea'), pot = M('#d9cfbf'), soil = M('#5b4a3a'),
  leaf = M('#4f8a66'), leafDark = M('#3c6f52'), leafLight = M('#79a981'), mesh = M('#4a5560');
// Modern home-office palette (owner, 2026-11-23: casual, like pieces you can actually buy): light oak, matt black
// steel, oatmeal and sage fabric.
const oak = M('#d6b98e', .7), blackSteel = M('#232629', .45), oat = M('#ddd3c4', .95), oatDark = M('#c7bba9', .95),
  sage = M('#9aa891', .95), cream = M('#f2efe8', .6), screen = M('#16191c', .3), glow = M('#f5e6c4', .4);
for (const m of [fabric, fabricDark, woodM, woodDark, pot, soil, leaf, leafDark, leafLight, oak, blackSteel, oat, oatDark, sage, cream, screen, glow]) m.userData.keepLook = true;
// Rounded cushion: a box with its long edges softened by half-cylinders.
function cushion(g, w, h, d, material, x, y, z) {
  bx(g, w - h, h, d, material, x, y, z);
  for (const s of [-1, 1]) { const c = part(g, new THREE.CylinderGeometry(h / 2, h / 2, d, 14), material, x + s * (w - h) / 2, y + h / 2, z); c.rotation.x = Math.PI / 2; }
}

function part(g, geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m;
}
const bx = (g, w, h, d, material, x, y, z) => part(g, new THREE.BoxGeometry(w, h, d), material, x, y + h / 2, z);
const cyl = (g, rt, rb, h, material, x, y, z, seg = 20) => part(g, new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y + h / 2, z);

// Lounge chair: 0.68 x 0.70, seat 0.42. Slim black steel sled frame, oatmeal cushions, a softly reclined back and
// thin oak arms - the kind of easy chair sold by any modern furniture shop.
function teaChair() {
  const g = new THREE.Group();
  for (const x of [-.31, .31]) {
    bx(g, .025, .025, .62, blackSteel, x, 0, 0);                                 // sled runner
    for (const z of [-.28, .28]) bx(g, .025, .40, .025, blackSteel, x, 0, z);
    bx(g, .06, .025, .56, oak, x, .58, .02);                                     // oak arm
  }
  bx(g, .60, .03, .58, blackSteel, 0, .30, .02);
  cushion(g, .60, .12, .56, oat, 0, .33, .04);                                   // seat cushion
  const back = part(g, new THREE.BoxGeometry(.58, .46, .11), oatDark, 0, .67, -.25); back.rotation.x = -.20;
  return g;
}
// Task chair: 0.60 footprint, seat 0.46, five-star base.
function officeChair() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5, leg = bx(g, .30, .035, .05, metal, Math.cos(a) * .15, .05, Math.sin(a) * .15);
    leg.rotation.y = -a;
    cyl(g, .03, .03, .05, metal, Math.cos(a) * .29, 0, Math.sin(a) * .29, 10);
  }
  cyl(g, .03, .03, .34, metal, 0, .08, 0, 12);
  bx(g, .48, .07, .46, mesh, 0, .42, 0);
  bx(g, .44, .50, .05, mesh, 0, .58, -.23);
  bx(g, .06, .16, .05, metal, 0, .46, -.22);
  for (const x of [-.27, .27]) { bx(g, .04, .20, .04, metal, x, .46, -.05); bx(g, .06, .03, .26, metal, x, .66, .0); }
  return g;
}
// Square table: 0.90 x 0.90 x 0.74.
function squareTable() {
  const g = new THREE.Group();
  bx(g, .90, .04, .90, woodM, 0, .70, 0);
  bx(g, .80, .06, .80, woodDark, 0, .64, 0);
  for (const [x, z] of [[-.39, -.39], [.39, -.39], [-.39, .39], [.39, .39]]) bx(g, .05, .64, .05, metal, x, 0, z);
  return g;
}
// Bar counter: 2.20 x 0.55 x 1.05, worktop overhanging the seating side.
function barCounter() {
  const g = new THREE.Group();
  bx(g, 2.20, 1.00, .45, fabricDark, 0, 0, -.05);
  bx(g, 2.20, .10, .06, woodDark, 0, 0, .19);
  bx(g, 2.30, .05, .62, woodM, 0, 1.00, .02);
  return g;
}
// Leafy floor plant (fiddle-leaf style): tapered pot, thin trunk, layered leaves.
function plantTall() {
  const g = new THREE.Group();
  cyl(g, .21, .15, .36, pot, 0, 0, 0, 24); cyl(g, .19, .19, .02, soil, 0, .34, 0, 24);
  cyl(g, .018, .026, 1.05, woodDark, 0, .34, 0, 8);
  const leaves = [[.0, .78, .16, 0, .5], [.15, .92, -.05, 1.3, .45], [-.14, 1.04, -.08, 2.6, .5], [.04, 1.16, .14, 3.7, .42],
    [-.12, 1.26, .08, 4.9, .4], [.13, 1.34, -.06, 5.8, .36], [0, 1.46, 0, .9, .3], [-.05, .66, -.15, 4.1, .44]];
  leaves.forEach(([x, y, z, a, s], i) => {
    const l = part(g, new THREE.SphereGeometry(.2, 10, 8), [leaf, leafDark, leafLight][i % 3], x, y, z);
    l.scale.set(s * 1.25, s * .22, s * .8); l.rotation.set(.35 * Math.cos(a), a, .45 * Math.sin(a) + .25);
  });
  return g;
}
// Low upright plant (snake-plant style) in a square planter.
function plantLow() {
  const g = new THREE.Group();
  bx(g, .32, .34, .32, pot, 0, 0, 0); bx(g, .28, .02, .28, soil, 0, .33, 0);
  [[-.08, -.05, .55, .2], [.07, -.07, .68, -.3], [.0, .05, .78, .1], [-.06, .08, .5, .5], [.09, .06, .6, -.55], [.02, -.02, .88, 0], [-.1, .0, .62, .9]]
    .forEach(([x, z, h, a], i) => { const b = bx(g, .055, h, .012, i % 2 ? leaf : leafDark, x, .34, z); b.rotation.set(.07 * Math.cos(a * 5), a, .09 * Math.sin(a * 3)); });
  return g;
}

// Tea and small-meeting table for nine (four a side, one at the head): 2.60 x 1.00, top at 0.62 to suit the
// low tea chairs. The far head stays open to face the mobile TV.
function teaTable() {
  const g = new THREE.Group();
  bx(g, 2.60, .06, 1.00, woodM, 0, .56, 0);
  for (const x of [-1.05, 1.05]) bx(g, .12, .56, .80, woodDark, x, 0, 0);  // two slab legs
  bx(g, 1.90, .04, .55, woodDark, 0, .14, 0);                             // low shelf for the tea tray
  return g;
}
// Mobile TV for video meetings: 86-inch screen on a wheeled stand, camera bar on top; 1.20 x 0.60 base.
function mobileTV() {
  const g = new THREE.Group();
  bx(g, 1.20, .06, .60, metal, 0, .06, 0);
  for (const [x, z] of [[-.55, -.25], [.55, -.25], [-.55, .25], [.55, .25]]) cyl(g, .04, .04, .06, mesh, x, 0, z, 10);
  for (const x of [-.30, .30]) bx(g, .06, 1.60, .06, metal, x, .12, -.05);
  bx(g, 1.92, 1.10, .06, M('#1d2226', .35), 0, .75, 0);
  bx(g, 1.86, 1.04, .005, M('#2c3e4a', .2), 0, .78, .032);
  bx(g, .30, .05, .06, M('#1d2226', .4), 0, 1.85, 0);
  return g;
}
// Tea cabinet: 1.60 x 0.45 x 0.85, kettle and cups on top, storage below.
function teaCabinet() {
  const g = new THREE.Group();
  bx(g, 1.60, .80, .45, white, 0, .05, 0);
  bx(g, 1.62, .04, .47, woodM, 0, .85, 0);
  for (const x of [-.40, .40]) bx(g, .76, .70, .01, woodM, x, .10, .226);
  bx(g, .18, .24, .18, metal, -.45, .89, 0);                              // kettle
  return g;
}
// Lidded bin, 0.30 across, 0.55 high.
function trashBin() {
  const g = new THREE.Group();
  cyl(g, .15, .13, .52, metal, 0, 0, 0, 20);
  cyl(g, .155, .155, .03, M('#5d666d', .45), 0, .52, 0, 20);
  return g;
}
// Workstation: 1.20 x 0.70 x 0.75 desk, the user sits on the +z side; monitor and a low privacy screen at the back.
function workDesk() {
  const g = new THREE.Group();
  bx(g, 1.20, .03, .70, white, 0, .72, 0);
  for (const x of [-.57, .57]) bx(g, .04, .72, .66, metal, x, 0, 0);
  bx(g, 1.20, .30, .02, fabricDark, 0, .75, -.34);                        // privacy screen
  bx(g, .60, .36, .03, mesh, 0, .92, -.20);                               // monitor
  bx(g, .06, .17, .06, metal, 0, .75, -.20);
  bx(g, .42, .02, .14, M('#d8d6d0'), 0, .75, .12);                        // keyboard
  return g;
}
// Casual tea table for four: round, 1.00 across, low (0.45) to go with the lounge chairs; a round rug under it.
function roundTeaTable() {
  const g = new THREE.Group();
  cyl(g, 1.10, 1.10, .01, M('#cfc4b2', .95), 0, 0, 0, 40);               // rug
  cyl(g, .50, .50, .04, woodM, 0, .41, 0, 40);
  cyl(g, .07, .10, .41, woodDark, 0, 0, 0, 16);
  cyl(g, .26, .26, .03, woodDark, 0, .01, 0, 24);
  return g;
}
// Owner's main desk: 1.80 x 0.80, user on the +z side; two monitors.
function ownerDesk() {
  const g = new THREE.Group();
  bx(g, 1.80, .04, .80, woodM, 0, .72, 0);
  for (const x of [-.86, .86]) bx(g, .06, .72, .74, woodDark, x, 0, 0);
  for (const x of [-.32, .32]) { bx(g, .60, .36, .03, mesh, x, .92, -.24); bx(g, .06, .17, .06, metal, x, .76, -.24); }
  bx(g, .45, .02, .15, M('#d8d6d0'), 0, .76, .14);
  return g;
}
// Side (return) desk: 1.40 x 0.60, plain top for papers and a laptop.
function sideDesk() {
  const g = new THREE.Group();
  bx(g, 1.40, .04, .60, woodM, 0, .72, 0);
  bx(g, .40, .60, .56, woodDark, -.48, .10, 0);                          // drawer pedestal
  bx(g, .05, .72, .54, woodDark, .66, 0, 0);
  return g;
}
// Figure-making bench: 2.00 x 0.70 worktop, pegboard shelf at the back, a small filtered spray booth at one end.
function labBench() {
  const g = new THREE.Group();
  bx(g, 2.00, .04, .70, M('#d9d4ca'), 0, .86, 0);
  for (const x of [-.96, .96]) bx(g, .05, .86, .66, metal, x, 0, 0);
  bx(g, 1.94, .03, .60, metal, 0, .18, 0);                               // lower shelf
  bx(g, 2.00, .70, .03, M('#b9b2a5'), 0, .90, -.335);                    // pegboard
  bx(g, 2.00, .03, .22, woodM, 0, 1.32, -.24);                           // shelf on the pegboard
  bx(g, .60, .50, .50, M('#e9e7e1', .6), .65, .90, -.07);                // spray booth with carbon filter
  bx(g, .52, .42, .01, M('#2d3d3f'), .65, .94, .18);
  cyl(g, .07, .07, .45, metal, .65, 1.40, -.20, 12);                     // exhaust spigot (duct to be agreed)
  return g;
}
// Display shelving wrapped round the existing 500 x 500 column: 0.80 square, 2.20 high, open cubbies for figures.
function columnShelf() {
  const g = new THREE.Group(), side = .80, depth = .15, h = 2.20;
  for (const [x, z, w, d] of [[0, -.325, side, depth], [0, .325, side, depth], [-.325, 0, depth, side - 2 * depth], [.325, 0, depth, side - 2 * depth]]) {
    bx(g, w, .03, d, woodM, x, 0, z);
    for (let y = .45; y <= h; y += .44) bx(g, w, .025, d, woodM, x, y, z);
    for (const e of [-1, 1]) bx(g, w > d ? .03 : d, h, w > d ? d : .03, woodDark, w > d ? x + e * (w / 2 - .015) : x, 0, w > d ? z : z + e * (d / 2 - .015));
  }
  return g;
}
// Low "cloud" sofa (owner, 2026-11-23: casual, not European): 1.90 x 0.95, cream boucle, no legs to speak of,
// plump rounded seat and back cushions you can sink into or sit cross-legged on.
function sofa2() {
  const g = new THREE.Group(), cream2 = M('#ece6da', .98), creamShade = M('#e0d8c9', .98);
  for (const m of [cream2, creamShade]) m.userData.keepLook = true;
  bx(g, 1.84, .10, .90, creamShade, 0, 0, 0);                                         // plinth
  cushion(g, 1.86, .26, .92, cream2, 0, .08, .02);                                     // deep seat
  for (const x of [-.46, .46]) {                                                       // two plump back cushions
    const b = part(g, new THREE.SphereGeometry(.5, 20, 14), cream2, x, .58, -.30); b.scale.set(.92, .62, .34);
  }
  for (const s of [-1, 1]) { const a = part(g, new THREE.SphereGeometry(.5, 18, 12), creamShade, s * .86, .40, .02); a.scale.set(.30, .52, .92); }
  for (const x of [-.55, .05, .55]) { const p = part(g, new THREE.SphereGeometry(.2, 14, 10), x ? sage : oatDark, x, .48, .05); p.scale.set(1, .45, .8); }   // throw pillows
  return g;
}
// Smart sintered-stone tea table (owner, 2026-11-23: modern, a bit of tech, nothing cheap-looking): 1.60 x 0.80,
// 0.72 high; light grey stone top on a matt black steel frame, flush tea tray, auto-fill kettle dock, cables hidden in
// the frame; a closed cabinet under one end holds the water bottle and the pump.
function smartTeaTable() {
  const g = new THREE.Group(), stone = M('#d8d9d6', .35), stoneEdge = M('#c6c8c5', .35), ink = M('#1f2326', .3), led = M('#9fd6ff', .3);
  for (const m of [stone, stoneEdge, ink, led]) m.userData.keepLook = true;
  bx(g, 1.60, .03, .80, stone, 0, .69, 0);
  bx(g, 1.60, .02, .80, stoneEdge, 0, .67, 0);
  for (const x of [-.74, .74]) { bx(g, .04, .67, .04, blackSteel, x, 0, -.34); bx(g, .04, .67, .04, blackSteel, x, 0, .34); bx(g, .04, .04, .72, blackSteel, x, .63, 0); bx(g, .04, .04, .72, blackSteel, x, 0, 0); }
  bx(g, .46, .60, .70, ink, -.52, .05, 0);                                             // water / pump cabinet
  bx(g, .02, .50, .62, blackSteel, -.29, .10, 0);
  bx(g, .62, .012, .36, ink, .05, .72, 0);                                             // flush tea tray
  cyl(g, .085, .085, .012, ink, .55, .72, -.20, 24); cyl(g, .086, .086, .004, led, .55, .725, -.20, 24);   // kettle dock with light ring
  cyl(g, .065, .07, .19, M('#e9e9e6', .25), .55, .732, -.20, 20);                      // glass/steel kettle
  for (const x of [-.12, 0, .12]) cyl(g, .028, .024, .05, white, x, .735, -.08, 12);
  cyl(g, .055, .05, .09, white, .05, .735, .09, 14);
  return g;
}
// Modern upholstered chair: 0.52 x 0.55, seat 0.46, warm grey fabric shell on matt black legs, user faces +z.
function modernChair() {
  const g = new THREE.Group(), shell = M('#9c9a96', .9), shellIn = M('#b3b1ad', .95);
  for (const m of [shell, shellIn]) m.userData.keepLook = true;
  for (const [x, z] of [[-.21, -.20], [.21, -.20], [-.21, .21], [.21, .21]]) bx(g, .025, .44, .025, blackSteel, x, 0, z);
  cushion(g, .50, .08, .50, shellIn, 0, .42, .02);
  const back = part(g, new THREE.CylinderGeometry(.27, .27, .36, 24, 1, true, Math.PI * .65, Math.PI * .7), shell, 0, .68, .02);
  back.material = shell.clone(); back.material.side = THREE.DoubleSide; back.material.userData.keepLook = true;
  return g;
}
// Plain tea table for four (owner, 2026-11-23): solid wood, 1.60 x 0.80, 0.65 high, with a tea tray, kettle and cups.
function chaTai() {
  const g = new THREE.Group(), walnut = M('#8a6545', .6), walnutDark = M('#6d4f35', .6);
  for (const m of [walnut, walnutDark]) m.userData.keepLook = true;
  bx(g, 1.60, .06, .80, walnut, 0, .59, 0);
  for (const x of [-.72, .72]) bx(g, .10, .59, .66, walnutDark, x, 0, 0);
  bx(g, 1.34, .04, .40, walnutDark, 0, .12, 0);                                       // low shelf
  bx(g, .60, .03, .36, M('#3b3631', .5), -.20, .65, 0);                               // tea tray
  cyl(g, .07, .08, .18, metal, .40, .65, -.10, 16);                                    // kettle
  for (const [x, z] of [[-.38, -.10], [-.26, -.10], [-.14, -.10], [-.02, -.10]]) cyl(g, .03, .025, .05, white, x, .68, z, 12);   // cups
  cyl(g, .06, .05, .10, white, -.20, .68, .10, 14);                                    // teapot
  return g;
}
// Simple solid-wood chair for the tea table: 0.48 x 0.50, seat 0.44, user faces +z.
function woodChair() {
  const g = new THREE.Group(), wood = M('#8a6545', .6), pad = M('#d9d0c1', .95);
  for (const m of [wood, pad]) m.userData.keepLook = true;
  for (const [x, z] of [[-.20, -.21], [.20, -.21], [-.20, .21], [.20, .21]]) bx(g, .035, .42, .035, wood, x, 0, z);
  bx(g, .46, .03, .48, wood, 0, .42, 0);
  bx(g, .42, .04, .42, pad, 0, .45, .02);
  for (const x of [-.20, .20]) bx(g, .035, .42, .035, wood, x, .45, -.21);
  bx(g, .44, .12, .025, wood, 0, .72, -.21);
  return g;
}
// Big one-person lounger: 1.70 x 0.90, low and soft enough to lie flat on, with a raised head end.
function lounger() {
  const g = new THREE.Group(), cream2 = M('#ece6da', .98), creamShade = M('#e0d8c9', .98);
  for (const m of [cream2, creamShade]) m.userData.keepLook = true;
  bx(g, 1.66, .10, .86, creamShade, 0, 0, 0);
  cushion(g, 1.70, .24, .90, cream2, 0, .08, 0);
  const head = part(g, new THREE.SphereGeometry(.5, 20, 14), cream2, -.70, .48, 0); head.scale.set(.42, .55, .88);
  const pil = part(g, new THREE.SphereGeometry(.2, 14, 10), oatDark, -.45, .42, 0); pil.scale.set(.7, .5, 1.6);
  bx(g, .60, .02, .70, M('#c9bfae', .98), .45, .32, 0);                                  // throw blanket
  return g;
}
// (previous European-style two-seater, kept for reference)
function sofa2Classic() {
  const g = new THREE.Group();
  for (const [x, z] of [[-.74, -.33], [.74, -.33], [-.74, .33], [.74, .33]]) cyl(g, .018, .014, .14, blackSteel, x, 0, z, 10);
  bx(g, 1.60, .16, .82, sage, 0, .14, 0);
  for (const x of [-.37, .37]) cushion(g, .70, .13, .64, sage, x, .30, .06);
  for (const x of [-.37, .37]) { const b = part(g, new THREE.BoxGeometry(.70, .40, .16), sage, x, .62, -.30); b.rotation.x = -.18; }
  for (const s of [-1, 1]) cushion(g, .14, .30, .82, sage, s * .73, .30, 0);
  return g;
}
// Round coffee table: oak top 0.80 across, black tripod, 0.42 high.
function coffeeTable() {
  const g = new THREE.Group();
  cyl(g, .40, .40, .03, oak, 0, .39, 0, 40);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, l = part(g, new THREE.CylinderGeometry(.014, .012, .42, 8), blackSteel, Math.cos(a) * .22, .20, Math.sin(a) * .22); l.rotation.set(Math.sin(a) * .25, 0, -Math.cos(a) * .25); }
  return g;
}
// Low-pile rug, 2.40 x 1.70.
function rug() { const g = new THREE.Group(); bx(g, 2.40, .012, 1.70, M('#e4dccd', .98), 0, 0, 0); bx(g, 2.20, .013, 1.50, M('#d5cbb8', .98), 0, 0, 0); return g; }
// Arc floor lamp: marble-look base, black arc, linen shade; footprint 0.40 x 0.40, reach 1.4.
function floorLamp() {
  const g = new THREE.Group();
  cyl(g, .17, .17, .05, cream, 0, 0, 0, 24);
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector3(Math.sin(t * Math.PI * .5) * 1.1, .05 + Math.sin(t * Math.PI * .5 + .05) * 1.75 + (t > .5 ? -(t - .5) * .6 : 0), 0)); }
  const arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .012, 6), blackSteel); g.add(arc);
  const end = pts.at(-1); const shade = part(g, new THREE.CylinderGeometry(.16, .22, .20, 24, 1, true), M('#f3ecdf', .9), end.x, end.y - .22, 0); shade.material.side = THREE.DoubleSide;
  part(g, new THREE.SphereGeometry(.05, 12, 8), glow, end.x, end.y - .18, 0);
  return g;
}
// The owner's U desk (dimensions from the owner's sketch, 2026-11-23): main top 3.00 x 1.00 along the end glazing,
// a 1.20 x 0.80 link on the user's left, a 3.00 x 0.50 back top; 1.20 clear between the long tops; 0.80 high.
// Footprint 2.70 x 3.00, local +x = glazing side, local -z = the column end. Light oak on slim black steel.
// The main top has two halves: a computer half by the column (ultrawide on an arm) and a hand-craft half
// (cutting mat, magnifier lamp, parts organiser). Drawers and a plant on the back top.
function uDesk() {
  const g = new THREE.Group(), H = .80, T = .035, X0 = -1.35, X1 = 1.35, Z0 = -1.50, Z1 = 1.50;
  const mainX0 = X1 - 1.00, backX1 = X0 + .50, linkZ1 = Z0 + .80;
  bx(g, 1.00, T, 3.00, oak, (mainX0 + X1) / 2, H - T, 0);
  bx(g, mainX0 - backX1, T, .80, oak, (backX1 + mainX0) / 2, H - T, (Z0 + linkZ1) / 2);
  bx(g, .50, T, 3.00, oak, (X0 + backX1) / 2, H - T, 0);
  for (const [x, z] of [[X1 - .04, Z0 + .04], [X1 - .04, Z1 - .04], [mainX0 + .04, Z1 - .04], [mainX0 + .04, linkZ1 + .04],
    [backX1 - .04, linkZ1 + .04], [backX1 - .04, Z1 - .04], [X0 + .04, Z0 + .04], [X0 + .04, Z1 - .04]]) bx(g, .035, H - T, .035, blackSteel, x, 0, z);
  // computer half: ultrawide on an arm, keyboard, speaker
  const mx = X1 - .18;
  bx(g, .05, .015, .05, blackSteel, mx, H, -.80); bx(g, .025, .30, .025, blackSteel, mx, H, -.80);
  bx(g, .03, .38, .86, screen, mx - .04, H + .18, -.80);
  bx(g, .14, .02, .44, cream, mainX0 + .30, H, -.80);
  bx(g, .08, .10, .06, cream, mx, H, -1.30);
  // hand-craft half: cutting mat, magnifier lamp, parts organiser
  bx(g, .60, .004, .90, M('#4f6b5a', .9), mainX0 + .45, H, .80);
  const lampArm = part(g, new THREE.CylinderGeometry(.01, .01, .55, 8), blackSteel, X1 - .12, H + .25, .30); lampArm.rotation.z = .5;
  part(g, new THREE.CylinderGeometry(.11, .11, .03, 20), glow, X1 - .30, H + .45, .30);
  bx(g, .26, .12, .40, cream, X1 - .16, H, 1.20);
  // back top: drawer unit under, boxes and a plant on top
  bx(g, .45, .55, .42, cream, (X0 + backX1) / 2, .02, .90);
  for (const z of [.10, .45]) bx(g, .40, .14, .28, M('#e8e3d8'), (X0 + backX1) / 2, H, z);
  cyl(g, .11, .08, .20, cream, (X0 + backX1) / 2, H, -1.05, 16);
  for (let i = 0; i < 5; i++) part(g, new THREE.SphereGeometry(.09, 8, 6), [leaf, leafDark, leafLight][i % 3], (X0 + backX1) / 2 + Math.cos(i) * .06, H + .30 + i * .03, -1.05 + Math.sin(i) * .06);
  return g;
}
// The owner's U desk wrapped round the existing column (owner, 2026-11-23): same tops as the U desk (main 3.00 x
// 1.00, link 1.20 x 0.80, back 3.00 x 0.50, 1.20 clear, 0.80 high) but laid with the column inside the closed
// corner: the main top is notched round the oak-clad column, so the column reads as part of the desk. Local axes
// match the plan: main top on -z (long glazing), link on +x (end glazing), opening on -x (towards the tea corner).
// Footprint 3.00 x 2.70; the column centre sits at local (0.975, -0.85).
function uDeskColumn() {
  const g = new THREE.Group(), H = .80, T = .035, X0 = -1.50, X1 = 1.50, Z0 = -1.35, Z1 = 1.35;
  const mainZ1 = Z0 + 1.00, backZ0 = Z1 - .50, linkX0 = X1 - .80;
  const cx = .975, cz = -.85, n = .29;                                    // column notch (cladding 0.56 + 10 mm gap)
  const top = (x0, x1, z0, z1) => bx(g, x1 - x0, T, z1 - z0, oak, (x0 + x1) / 2, H - T, (z0 + z1) / 2);
  top(X0, cx - n, Z0, mainZ1); top(cx + n, X1, Z0, mainZ1);              // main top either side of the column
  top(cx - n, cx + n, Z0, cz - n); top(cx - n, cx + n, cz + n, mainZ1);  // the collar in front of / behind it
  top(linkX0, X1, mainZ1, backZ0);                                        // link along the end glazing
  top(X0, X1, backZ0, Z1);                                                // back top
  for (const [x, z] of [[X0 + .04, Z0 + .04], [X0 + .04, mainZ1 - .04], [X0 + .04, backZ0 + .04], [X0 + .04, Z1 - .04],
    [X1 - .04, Z0 + .04], [X1 - .04, Z1 - .04], [linkX0 + .04, mainZ1 + .04], [linkX0 + .04, backZ0 - .04]]) bx(g, .035, H - T, .035, blackSteel, x, 0, z);
  // computer half, just short of the column: ultrawide on an arm, keyboard, speaker
  const mx = .05;
  bx(g, .05, .015, .05, blackSteel, mx, H, Z0 + .18); bx(g, .025, .30, .025, blackSteel, mx, H, Z0 + .18);
  bx(g, .86, .38, .03, screen, mx, H + .18, Z0 + .22);
  bx(g, .44, .02, .14, cream, mx, H, mainZ1 - .30);
  bx(g, .06, .10, .08, cream, cx - n - .10, H, Z0 + .20);
  // hand-craft half: cutting mat, magnifier lamp, parts organiser
  bx(g, .90, .004, .60, M('#4f6b5a', .9), -.95, H, mainZ1 - .45);
  const arm = part(g, new THREE.CylinderGeometry(.01, .01, .55, 8), blackSteel, -.95, H + .25, Z0 + .12); arm.rotation.x = -.5;
  part(g, new THREE.CylinderGeometry(.11, .11, .03, 20), glow, -.95, H + .45, Z0 + .30);
  bx(g, .40, .12, .26, cream, -1.30, H, Z0 + .16);
  // back top: drawer unit under it, boxes and a plant on it
  bx(g, .42, .55, .45, cream, -1.10, .02, (backZ0 + Z1) / 2);
  for (const x of [-.45, .10]) bx(g, .28, .14, .40, M('#e8e3d8'), x, H, (backZ0 + Z1) / 2);
  cyl(g, .11, .08, .20, cream, 1.05, H, (backZ0 + Z1) / 2, 16);
  for (let i = 0; i < 5; i++) part(g, new THREE.SphereGeometry(.09, 8, 6), [leaf, leafDark, leafLight][i % 3], 1.05 + Math.cos(i) * .06, H + .30 + i * .03, (backZ0 + Z1) / 2 + Math.sin(i) * .06);
  return g;
}
// The owner's single-person U desk (owner, 2026-11-23, second version): the owner sits with his back to the long
// glazing and faces the stair exit. The 1.00 main top is in front of him (stair side), the 0.50 back top behind him
// along the glazing, the 0.80 link along the end glazing; the opening faces the tea corner. The existing column
// stands in the closed corner: the back top and the link are notched round its oak cladding.
// Local axes match the plan; footprint 3.00 x 2.70; column centre at local (0.975, -0.85).
function uDeskOwner() {
  const g = new THREE.Group(), H = .80, T = .035, X0 = -1.50, X1 = 1.50, Z0 = -1.35, Z1 = 1.35;
  const backZ1 = Z0 + .50, mainZ0 = Z1 - 1.00, linkX0 = X1 - .80;
  const nx0 = .685, nx1 = 1.265, nz0 = -1.14, nz1 = -.56;                 // column notch (cladding 0.56 + 10 mm gap)
  // a rectangular top with the notch taken out of it
  const top = (x0, x1, z0, z1) => {
    const put = (a, b, c, d) => { if (b - a > .005 && d - c > .005) bx(g, b - a, T, d - c, oak, (a + b) / 2, H - T, (c + d) / 2); };
    if (x1 <= nx0 || x0 >= nx1 || z1 <= nz0 || z0 >= nz1) return put(x0, x1, z0, z1);
    put(x0, nx0, z0, z1); put(nx1, x1, z0, z1); put(Math.max(x0, nx0), Math.min(x1, nx1), z0, nz0); put(Math.max(x0, nx0), Math.min(x1, nx1), nz1, z1);
  };
  top(X0, X1, Z0, backZ1);                    // back top along the glazing
  top(linkX0, X1, backZ1, mainZ0);            // link along the end glazing
  top(X0, X1, mainZ0, Z1);                    // main top, facing the stair exit
  for (const [x, z] of [[X0 + .04, Z0 + .04], [X0 + .04, backZ1 - .04], [X0 + .04, mainZ0 + .04], [X0 + .04, Z1 - .04],
    [X1 - .04, Z1 - .04], [X1 - .04, mainZ0 - .04], [linkX0 + .04, mainZ0 - .04], [-.10, Z0 + .04], [-.10, Z1 - .04]]) bx(g, .035, H - T, .035, blackSteel, x, 0, z);
  // main top: ultrawide on an arm facing the owner, keyboard; hand-craft corner with cutting mat and lamp
  const mz = Z1 - .18;
  bx(g, .05, .015, .05, blackSteel, -.15, H, mz); bx(g, .025, .30, .025, blackSteel, -.15, H, mz);
  bx(g, .86, .38, .03, screen, -.15, H + .18, mz - .04);
  bx(g, .44, .02, .14, cream, -.15, H, mainZ0 + .30);
  bx(g, .70, .004, .55, M('#4f6b5a', .9), .85, H, mainZ0 + .45);
  const arm = part(g, new THREE.CylinderGeometry(.01, .01, .55, 8), blackSteel, .85, H + .25, Z1 - .12); arm.rotation.x = .5;
  part(g, new THREE.CylinderGeometry(.11, .11, .03, 20), glow, .85, H + .45, Z1 - .30);
  bx(g, .30, .12, .22, cream, 1.30, H, Z1 - .16);
  // back top behind the owner: drawer unit under it, boxes and a plant on it
  bx(g, .42, .55, .42, cream, -1.10, .02, (Z0 + backZ1) / 2);
  for (const x of [-.55, -.05]) bx(g, .40, .14, .30, M('#e8e3d8'), x, H, (Z0 + backZ1) / 2);
  cyl(g, .11, .08, .20, cream, .35, H, (Z0 + backZ1) / 2, 16);
  for (let i = 0; i < 5; i++) part(g, new THREE.SphereGeometry(.09, 8, 6), [leaf, leafDark, leafLight][i % 3], .35 + Math.cos(i) * .06, H + .30 + i * .03, (Z0 + backZ1) / 2 + Math.sin(i) * .06);
  return g;
}
// Slatted oak cladding for the existing 500 x 500 column with two floating shelves on its room face; it wraps the
// column only (0.56 square) so the U desk still butts the column.
function columnCladding() {
  const g = new THREE.Group(), s = .56, h = 3.40;
  for (let i = 0; i < 12; i++) { const t = -s / 2 + .02 + i * (s - .04) / 11;
    bx(g, .03, h, .02, oak, t, 0, -s / 2); bx(g, .03, h, .02, oak, t, 0, s / 2); bx(g, .02, h, .03, oak, -s / 2, 0, t); bx(g, .02, h, .03, oak, s / 2, 0, t); }
  for (const y of [1.15, 1.55]) bx(g, .22, .03, .50, oak, -s / 2 - .11, y, 0);
  return g;
}
// Storage bench by the mat: 2.00 x 0.45 x 0.45 (sit to wrap hands; gloves and towels inside).
function gymBench() {
  const g = new THREE.Group();
  bx(g, 2.00, .40, .45, woodDark, 0, 0, 0);
  bx(g, 2.00, .05, .45, fabricDark, 0, .40, 0);
  return g;
}

export const FURNITURE_KIT = {
  teaChair: {name: '茶椅', build: teaChair, size: [.68, .70]},
  officeChair: {name: '办公椅', build: officeChair, size: [.60, .60]},
  squareTable: {name: '方桌', build: squareTable, size: [.90, .90]},
  barCounter: {name: '吧台', build: barCounter, size: [2.30, .62]},
  teaTable: {name: '茶桌', build: teaTable, size: [2.60, 1.00]},
  mobileTV: {name: '移动电视', build: mobileTV, size: [1.92, .60]},
  teaCabinet: {name: '茶水柜', build: teaCabinet, size: [1.60, .45]},
  trashBin: {name: '垃圾桶', build: trashBin, size: [.30, .30]},
  gymBench: {name: '储物凳', build: gymBench, size: [2.00, .45]},
  workDesk: {name: '工位', build: workDesk, size: [1.20, .70]},
  roundTeaTable: {name: '圆茶几', build: roundTeaTable, size: [1.00, 1.00]},
  ownerDesk: {name: '主办公桌', build: ownerDesk, size: [1.80, .80]},
  sideDesk: {name: '侧桌', build: sideDesk, size: [1.40, .60]},
  labBench: {name: '手办工作台', build: labBench, size: [2.00, .70]},
  columnShelf: {name: '柱子展示格', build: columnShelf, size: [.80, .80]},
  sofa2: {name: '云朵沙发', build: sofa2, size: [1.90, .95]},
  lounger: {name: '单人躺椅', build: lounger, size: [1.70, .90]},
  chaTai: {name: '实木茶桌', build: chaTai, size: [1.60, .80]},
  smartTeaTable: {name: '智能岩板茶台', build: smartTeaTable, size: [1.60, .80]},
  modernChair: {name: '现代布艺椅', build: modernChair, size: [.52, .55]},
  woodChair: {name: '实木椅', build: woodChair, size: [.48, .50]},
  coffeeTable: {name: '圆茶几（矮）', build: coffeeTable, size: [.80, .80]},
  rug: {name: '地毯', build: rug, size: [2.40, 1.70]},
  floorLamp: {name: '落地灯', build: floorLamp, size: [.40, .40]},
  uDesk: {name: 'U 型工作台', build: uDesk, size: [2.70, 3.00]},
  uDeskColumn: {name: 'U 型工作台（包柱）', build: uDeskColumn, size: [3.00, 2.70]},
  uDeskOwner: {name: 'U 型主办公桌（单人）', build: uDeskOwner, size: [3.00, 2.70]},
  columnCladding: {name: '柱子木格栅', build: columnCladding, size: [.56, .56]},
  plantTall: {name: '绿植（高）', build: plantTall, size: [.42, .42]},
  plantLow: {name: '绿植（矮）', build: plantLow, size: [.32, .32]}
};

// Default arrangement (the owner rearranges it). floor: 'ground' | 'upper'. rot in quarter turns.
// Ground floor, owner side (owner brief 2026-11-23): tea and small-meeting corner for nine by the main aisle
// (four a side, the host at the stair-aisle end facing a mobile TV against the glazing), boxing mat by the
// glazed corner, a storage bench along the end glass.
const TEA_X = 12.40;
export function defaultFurnitureLayout() {
  const rows = [
    // The table, its head seat and the TV share one centre line (x = TEA_X) so everyone faces the screen square on.
    ['mobileTV', TEA_X, .65, 0],          // 86-inch screen 1.92 wide: x 11.44~13.36
    ['teaTable', TEA_X, 2.70, 1],
    ...[1.72, 2.37, 3.02, 3.67].map(z => ['teaChair', TEA_X - .80, z, 1, .82]),
    ...[1.72, 2.37, 3.02, 3.67].map(z => ['teaChair', TEA_X + .80, z, 3, .82]),
    ['teaChair', TEA_X, 4.32, 2, .82],
    ['teaCabinet', 13.82, .58, 0, .50],   // 0.80 wide, x 13.42~14.22, inside the meeting room by the gym-side glass
    ['trashBin', 13.75, 4.95, 0],         // inside the meeting room, clear of the door
    ['gymBench', 18.85, 2.90, 1],
    // Open office (owner brief 2026-11-23): 20 workstations in two back-to-back rows of ten, laid at right angles to
    // the glazing so every desk takes daylight from the side: nobody faces the glass or has it behind the screen.
    // The rows start 0.20 from the glazing (room for the roller blind); 1.47 m clear behind them at the back wall.
    // Desks 1.20 x 0.70; 2.35 m between the two groups so both rows can push back and someone can still walk by.
    ...[.80, 2.00, 3.20, 4.40, 5.60].flatMap(z => [1.80, 5.55].flatMap(cx => [
      ['workDesk', cx - .35, z, 3], ['officeChair', cx - .95, z, 1],
      ['workDesk', cx + .35, z, 1], ['officeChair', cx + .95, z, 3]]))
  ];
  // Mezzanine (owner brief 2026-11-23): a casual tea corner for four on the open-office side, and the owner's
  // corner at the L of the glazing: an L desk (main + return) that ends on the existing column, the column wrapped
  // in display shelving, and a figure-making bench along the end glazing.
  // Upgraded 2026-11-23: the owner's U desk replaces separate desks; a living-room style tea corner.
  const upperRows = [
    // Smart stone tea table for four against the long glazing (owner, 2026-11-23): the short end stops 0.30 off the
    // glass (room for the blinds), two modern chairs a side, so every seat looks out of the window.
    ['rug', 12.40, 1.25, 0],
    ['smartTeaTable', 12.40, 1.10, 1],
    ['modernChair', 11.73, .80, 1], ['modernChair', 11.73, 1.50, 1],
    ['modernChair', 13.07, .80, 3], ['modernChair', 13.07, 1.50, 3],
    // Single-person U desk, x 16.20~19.20, z 0.25~2.95 (clear of the blinds), opening towards the tea corner. The owner
    // sits with his back to the long glazing, facing the big top and the stair exit; the column is in the closed corner.
    ['uDeskOwner', 17.70, 1.60, 0],
    ['officeChair', 17.55, 1.30, 0],                   // the one seat, facing the stair exit
    ['columnCladding', 18.675, .75, 0]
  ];
  return [
    ...rows.map(([type, x, z, rot, sx = 1], i) => ({id: 'd' + i, type, floor: 'ground', x, z, rot, sx, sy: 1, sz: 1})),
    ...upperRows.map(([type, x, z, rot, sx = 1], i) => ({id: 'u' + i, type, floor: 'upper', x, z, rot, sx, sy: 1, sz: 1}))
  ];
}
