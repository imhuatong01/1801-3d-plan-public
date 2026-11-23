// All coordinates are metres in the plan of 18F. Circuit drawings use this same layout.
import {MEZZANINE} from './site-shell.js?v=157';

const fixtureWidth = .70;
const fixtureHalfHeight = .084;
const fixtureDepth = .094;
const beltLongZ = .90, beltShortX = 18.525;
const groups = { WL1: 'lower', WL2: 'roof', WL3: 'wall' };
export const lightingColors = { WL1: '#a6530d', WL2: '#6c4a8c', WL3: '#227568' };
const backWalls = [
  {a:[0,7.675],b:[9.15,7.675]},
  {a:[10.70,9.40],b:[18.425,9.40]}
];

export function lightingLayout({ beltTop = MEZZANINE.steelTop, windowBays = {long:12,short:7},
  roofBeam, wallSegments = backWalls } = {}) {
  const lights = [], routes = [], omitted = [];
  // The belt face is taken up by the mezzanine steel from its soffit upwards, so the lamp sits centred in the
  // free part of the face below it: between the bottom of the existing window beam and the steel soffit.
  const beltBase = beltTop - MEZZANINE.beltHeight, steelSoffit = MEZZANINE.steelTop - MEZZANINE.primaryDepth;
  const lowerY = Math.round((beltBase + steelSoffit) * 500) / 1000;
  const roofY = roofBeam?.position.y ?? MEZZANINE.roomTop - .25 - .21;
  const roofZ = roofBeam ? roofBeam.position.z + roofBeam.geometry.parameters.depth / 2 : .925;
  // Keep roughly one lamp per two windows. Equal developed pitches extend through the
  // corner. The 2.95 m grid also leaves the opposing door jamb and the concrete columns clear.
  const pitch = 2.95;
  const longCount = Math.floor(windowBays.long / 2), shortCount = Math.floor(windowBays.short / 2);
  const stations = Array.from({length:longCount}, (_,i)=>beltShortX - (longCount - i - .5)*pitch);
  const label = (prefix, index) => prefix + String(index+1).padStart(2, '0');
  function light(id,circuit,face,nx,nz,x,y,z){
    lights.push({id,circuit,group:groups[circuit],face,axis:nx?'z':'x',normal:[nx,nz],mount:[x,y,z],
      x:x+nx*fixtureDepth/2,y,z:z+nz*fixtureDepth/2});
  }
  for (const [index,x] of stations.entries()) light(label('L',index),'WL1','long',0,1,x,lowerY,beltLongZ);
  for (let i=0;i<shortCount;i++) light(label('L',longCount+i),'WL1','short',-1,0,beltShortX,lowerY,beltLongZ+(i+.5)*pitch);
  // Top-beam lamps only over the mezzanine: the open double-height side has none (owner, 2026-11-20).
  for (const [index,x] of stations.entries()) if (x > 10.70) light(label('U',index),'WL2','long',0,1,x,roofY,roofZ);

  const wallThickness = .12;
  for (const [index,x] of stations.entries()) {
    const wall=wallSegments.find(({a,b})=>Math.abs(a[1]-b[1])<.001 && a[1]>beltLongZ &&
      Math.min(a[0],b[0]) <= x-fixtureWidth/2 && Math.max(a[0],b[0]) >= x+fixtureWidth/2);
    const peer=label('L',index);
    if (!wall){omitted.push({peer,x,reason:'轴线落在墙端或门洞'});continue;}
    // The station nearest the arrival threshold is left out: the end-wall lamp at the exit lights that spot.
    if (x > MEZZANINE.thresholdX - 1.5) { omitted.push({peer, x, reason: '楼梯出口由端墙灯照明'}); continue; }
    // Over the stair there is no floor, so the two back-wall lamps there sit higher, clear of people on the stair.
    // With the stair against the wall they are directly over the second flight: +5.20 keeps 2.20 m under them.
    light(label('W',index),'WL3','long',0,-1,x,x>10.70?5.20:lowerY,wall.a[1]-wallThickness/2);
  }

  function route(circuit,kind,id,points){
    routes.push({id,circuit,group:groups[circuit],kind,points});
  }
  const lowBusY = lowerY-.15, upBusY = roofY-.15;
  const lowerZ = beltLongZ+.018, shortX=beltShortX-.018, upperZ=roofZ+.018;
  const skirtY = MEZZANINE.lowerFinish+.125, panelBottom=MEZZANINE.lowerFinish+1.15;
  const last=lights.filter(l=>l.circuit==='WL1').at(-1);
  const branch=(l,busY)=>{
    const [mx,my,mz]=l.mount, [nx,nz]=l.normal, x=mx+nx*.018,z=mz+nz*.018;
    route(l.circuit,'tap',l.circuit+'-'+l.id,[[x,busY,z],[x,busY>my?my+.073:my-.073,z]]);
  };
  // Pass below the floor across the footprint of the fire cabinet, keeping its
  // door and the clear access strip in front of it available at finished level.
  const underCabinet=MEZZANINE.lowerFinish-.050;
  const wl1Floor=[[8.17,panelBottom,7.555],[8.17,skirtY,7.555],[.34,skirtY,7.555],
    [.34,underCabinet,7.555],[.078,underCabinet,7.555],[.078,underCabinet,6.66],[.078,skirtY,6.66],[.078,skirtY,lowerZ]];
  route('WL1','floor','WL1-skirt',wl1Floor);
  route('WL1','rise','WL1-rise',[wl1Floor.at(-1),[.078,lowBusY,lowerZ]]);
  route('WL1','beam','WL1-belt',[[.078,lowBusY,lowerZ],[8.625,lowBusY,lowerZ],[8.625,lowBusY,1.025],
    [9.175,lowBusY,1.025],[9.175,lowBusY,lowerZ],[18.400,lowBusY,lowerZ],[18.400,lowBusY,1.025],
    [shortX,lowBusY,1.025],[shortX,lowBusY,last.z]]);
  const upFloor=[[8.27,panelBottom,7.555],[8.27,skirtY+.04,7.555],[8.27,skirtY+.04,7.515],
    [.38,skirtY+.04,7.515],[.38,underCabinet,7.515],[.108,underCabinet,7.515],
    [.108,underCabinet,6.62],[.108,skirtY+.04,6.62],[.108,skirtY+.04,upperZ]];
  route('WL2','floor','WL2-skirt',upFloor);
  route('WL2','rise','WL2-rise',[upFloor.at(-1),[.108,upBusY,upperZ]]);
  route('WL2','beam','WL2-beam',[[.108,upBusY,upperZ],[8.625,upBusY,upperZ],[8.625,upBusY,1.025],
    [9.175,upBusY,1.025],[9.175,upBusY,upperZ],[stations.at(-1),upBusY,upperZ]]);

  const wallLights=lights.filter(l=>l.group==='wall');
  const office=wallLights.filter(l=>l.mount[2]<8), stairWall=wallLights.filter(l=>l.mount[2]>8);
  const dryZ=office[0].mount[2]-.018, wallRiserX=8.37;
  const wallFoot=[wallRiserX,skirtY,dryZ];
  route('WL3','floor','WL3-skirt',[[wallRiserX,panelBottom,7.555],[wallRiserX,panelBottom,dryZ],wallFoot]);
  route('WL3','rise','WL3-office-rise',[wallFoot,[wallRiserX,lowBusY,dryZ]]);
  route('WL3','wall','WL3-office-wall',[[wallRiserX,lowBusY,dryZ],[office[0].x,lowBusY,dryZ]]);
  // The stair stands against the back wall (2026-11-23), so nothing may run along that wall below the stair
  // headroom line, and nothing may rise through the shower or the landing. The stair lamps are fed from the
  // east end: along the high trunk to the riser at (18.20, 9.30) beside the arrival, up the wall to +6.40
  // (2.30 m over the top tread at +4.10), then west along the wall and down to each lamp.
  const stairBusY=6.40, stairRiseX=18.20;
  if(stairWall.length){
    const rearZ=stairWall[0].mount[2]-.018, trunkY=lowBusY;
    route('WL3','wall','WL3-stair-trunk',[[wallRiserX,lowBusY,dryZ],[9.24,trunkY,dryZ],[9.24,trunkY,10.60],
      [10.62,trunkY,10.60],[10.62,trunkY,6.70],[10.85,trunkY,6.70],[10.85,trunkY,1.20],[stairRiseX,trunkY,1.20],[stairRiseX,trunkY,rearZ]]);
    route('WL3','rise','WL3-stair-rise',[[stairRiseX,trunkY,rearZ],[stairRiseX,stairBusY,rearZ]]);
    route('WL3','wall','WL3-stair-wall',[[stairRiseX,stairBusY,rearZ],[Math.min(...stairWall.map(l=>l.x)),stairBusY,rearZ]]);
  }
  for(const l of lights)branch(l,l.group==='roof'?upBusY:stairWall.includes(l)?stairBusY:lowBusY);
  return {lights,routes,omitted,pitch};
}

export function makeWindowLighting({THREE,box,...options}) {
  const layout=lightingLayout(options),fixtures=new THREE.Group(),circuit=new THREE.Group();
  fixtures.name='proposed-light-fixtures';circuit.name='proposed-light-wiring';
  const fixtureGroups={},circuitGroups={};
  const finished=(color,roughness)=>new THREE.MeshStandardMaterial({color,roughness});
  const plate=finished('#46535b',.64), casework=finished('#716b60',.48);
  const lens=new THREE.MeshStandardMaterial({color:'#ffb31a',emissive:'#ff9d00',emissiveIntensity:.9,roughness:.6});lens.userData.keepLook=true;
  const wireMaterials={};
  for(const [id,group] of Object.entries(groups)){
    const fa=new THREE.Group(),ca=new THREE.Group();
    fa.name=id+'-fixtures';ca.name=id+'-conduits';
    fa.userData={circuit:id,group};ca.userData={circuit:id,group};
    fixtures.add(fa);circuit.add(ca);fixtureGroups[id]=fa;circuitGroups[id]=ca;
    wireMaterials[id]=new THREE.MeshBasicMaterial({color:lightingColors[id]});
  }
  for(const l of layout.lights){
    const item=new THREE.Group();
    item.name=l.id;item.userData={...l};
    item.position.set(...l.mount);
    item.rotation.y=Math.atan2(l.normal[0],l.normal[1]);
    fixtureGroups[l.circuit].add(item);
    box(item,-fixtureWidth/2,-fixtureHalfHeight,0,fixtureWidth,2*fixtureHalfHeight,.028,plate);
    box(item,-.32,-.070,.028,.64,.140,.040,casework);
    box(item,-.292,-.048,.068,.584,.096,.026,lens);
  }
  const vertical=new THREE.Vector3(0,1,0);
  for(const r of layout.routes){
    const group=new THREE.Group();group.name=r.id;group.userData={circuit:r.circuit,kind:r.kind};
    circuitGroups[r.circuit].add(group);
    for(let i=1;i<r.points.length;i++){
      const a=new THREE.Vector3(...r.points[i-1]),b=new THREE.Vector3(...r.points[i]),axis=b.clone().sub(a);
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,axis.length(),8),wireMaterials[r.circuit]);
      mesh.position.copy(a).lerp(b,.5);mesh.quaternion.setFromUnitVectors(vertical,axis.normalize());group.add(mesh);
    }
  }
  return {...layout,fixtures,circuit,fixtureGroups,circuitGroups};
}
