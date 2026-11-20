// All coordinates are metres in the plan of 18F. Circuit drawings use this same layout.
import {MEZZANINE} from './site-shell.js?v=105';

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
  const lowerY = beltTop - .38;
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
    // The far end of the second flight is at the same height as this source. A
    // wall light there would throw light directly into risers and their steelwork.
    if (x >= MEZZANINE.upperStartX && x <= MEZZANINE.thresholdX) {
      const top=MEZZANINE.midLanding + Math.min(MEZZANINE.upperRisers-1,
        Math.floor((x+fixtureWidth/2-MEZZANINE.upperStartX)/MEZZANINE.going)+1)*MEZZANINE.riser;
      if(top >= lowerY-fixtureHalfHeight){omitted.push({peer,x,reason:'末段踏步遮挡同高墙灯'});continue;}
    }
    // Over the stair there is no floor, so the two back-wall lamps there sit higher, clear of people on the stair.
    light(label('W',index),'WL3','long',0,-1,x,x>10.70?5.00:lowerY,wall.a[1]-wallThickness/2);
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
    route(l.circuit,'tap',l.circuit+'-'+l.id,[[x,busY,z],[x,my-.073,z]]);
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
  if(stairWall.length){
    // Cross the open, dry corridor below the floor. Rise beyond the shower's back
    // enclosure. No line crosses the glass door or the wet floor.
    const buriedY=MEZZANINE.lowerFinish-.055, rearZ=stairWall[0].mount[2]-.018, leftX=stairWall[0].x;
    const pass=[wallFoot,[wallRiserX,buriedY,dryZ],[wallRiserX,buriedY,7.49],[10.59,buriedY,7.49],
      [10.59,buriedY,rearZ],[leftX,buriedY,rearZ]];
    route('WL3','floor','WL3-underpass',pass);
    route('WL3','rise','WL3-stair-rise',[pass.at(-1),[leftX,lowBusY,rearZ]]);
    if(stairWall.length>1)route('WL3','wall','WL3-stair-wall',[[leftX,lowBusY,rearZ],[stairWall.at(-1).x,lowBusY,rearZ]]);
  }
  for(const l of lights)branch(l,l.group==='roof'?upBusY:lowBusY);
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
