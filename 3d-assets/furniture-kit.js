// Small furniture kit the owner arranges by hand: tea chair, office chair, square table, plus a bar
// counter and two plants used in the default layout. Every piece is a Group centred on its footprint,
// standing on y = 0, facing +z, so it can be moved, scaled (whole or one side) and turned in 90° steps.
import * as THREE from 'three';

const M = (color, rough = .8) => new THREE.MeshStandardMaterial({color, roughness: rough});
const fabric = M('#b9a892'), fabricDark = M('#8f8271'), woodM = M('#c8a777'), woodDark = M('#8b6a48'),
  metal = M('#3b444c', .5), white = M('#f4f1ea'), pot = M('#d9cfbf'), soil = M('#5b4a3a'),
  leaf = M('#4f8a66'), leafDark = M('#3c6f52'), leafLight = M('#79a981'), mesh = M('#4a5560');
for (const m of [fabric, fabricDark, woodM, woodDark, pot, soil, leaf, leafDark, leafLight]) m.userData.keepLook = true;

function part(g, geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m;
}
const bx = (g, w, h, d, material, x, y, z) => part(g, new THREE.BoxGeometry(w, h, d), material, x, y + h / 2, z);
const cyl = (g, rt, rb, h, material, x, y, z, seg = 20) => part(g, new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y + h / 2, z);

// Low lounge chair for the tea table: 0.68 x 0.70, seat 0.40.
function teaChair() {
  const g = new THREE.Group();
  for (const [x, z] of [[-.28, -.29], [.28, -.29], [-.28, .29], [.28, .29]]) bx(g, .045, .22, .045, woodDark, x, 0, z);
  bx(g, .68, .06, .70, woodDark, 0, .22, 0);
  bx(g, .60, .14, .58, fabric, 0, .28, .04);            // seat cushion
  bx(g, .68, .42, .12, fabricDark, 0, .28, -.29);       // back
  bx(g, .56, .30, .10, fabric, 0, .40, -.20);           // back cushion
  for (const x of [-.31, .31]) bx(g, .07, .22, .60, fabricDark, x, .28, .03);
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

export const FURNITURE_KIT = {
  teaChair: {name: '茶椅', build: teaChair, size: [.68, .70]},
  officeChair: {name: '办公椅', build: officeChair, size: [.60, .60]},
  squareTable: {name: '方桌', build: squareTable, size: [.90, .90]},
  barCounter: {name: '吧台', build: barCounter, size: [2.30, .62]}
};

// Default arrangement (the owner rearranges it). floor: 'ground' | 'upper'. rot in quarter turns.
// Each row: [type, floor, x, z, rot, sx, sz]
export function defaultFurnitureLayout() {
  return [];
}
