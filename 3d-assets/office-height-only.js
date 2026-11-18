import * as THREE from 'three';
import {addSiteShell,MEZZANINE} from './site-shell.js?v=77';
import {makeWindowLighting,lightingColors} from './window-lights.js?v=77';
import {makeAirLayout} from './air-layout.js?v=77';
import {makeWastewater} from './wastewater.js?v=77';
import {addSiteServices} from './site-services.js?v=74';
import {buildFloorComparison} from './floor-comparison.js?v=74';
import {setupSupportStudy} from './support-side-bath.js?v=5-no-candidate-posts';
import {OrbitControls} from './OrbitControls.js';
import {setupMeasurements} from './measurements-height-only.js?v=77';
const $=s=>document.querySelector(s), host=$('#viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#edf3f6');
const camera=new THREE.PerspectiveCamera(43,1,.1,180);camera.position.set(25,20,-24);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setSize(host.clientWidth,host.clientHeight);host.prepend(renderer.domElement);
let viewportFit=1,insideSite=false;
function fitViewport(){
 if(insideSite){
  camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(43/2))/Math.min(1,camera.aspect)));
  camera.updateProjectionMatrix();return;
 }
 camera.fov=43;camera.updateProjectionMatrix();
 const next=Math.max(1,1.4/camera.aspect);camera.position.sub(controls.target).multiplyScalar(next/viewportFit).add(controls.target);viewportFit=next;controls.update();
}
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(9.7,2.5,-4.8);controls.enableDamping=true;controls.minDistance=4;controls.maxDistance=65;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=.7;
scene.add(new THREE.HemisphereLight(0xffffff,0x98a9b7,1.8));const sun=new THREE.DirectionalLight(0xfff1dc,2);sun.position.set(5,24,-12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.normalBias=.03;scene.add(sun);
const totalHeight=MEZZANINE.roomTop, levelHeight=MEZZANINE.floorFinish;
const upperDeckUnderside=MEZZANINE.steelTop, lowerBeamHeight=upperDeckUnderside-MEZZANINE.primaryDepth;
const ground=new THREE.Group(),upper=new THREE.Group(),stairs=new THREE.Group(),structure=new THREE.Group(),shell=new THREE.Group(),fieldFrame=new THREE.Group(),labelGroup=new THREE.Group();const model=new THREE.Group();model.scale.z=-1;scene.add(model);model.add(ground,upper,stairs,structure,shell,fieldFrame,labelGroup);upper.position.y=levelHeight;
// Show the actual stair treads so the circulation route can be read directly in the 3D model.
const stairTreads=new THREE.Group();stairs.add(stairTreads);stairTreads.visible=true;
const stairShift=0;const stairStorage=new THREE.Group(),openingRails=new THREE.Group();stairStorage.scale.x=-1;stairStorage.position.x=29.975;openingRails.scale.x=-1;openingRails.position.x=29.975;ground.add(stairStorage);upper.add(openingRails);
const partitions=[],labels=[],pickables=[];const mat=(c,op=1)=>new THREE.MeshStandardMaterial({color:c,roughness:.72,transparent:op<1,opacity:op,depthWrite:op===1});const glass=mat('#89c2d4',.23),steel=mat('#333b42'),wallmat=mat('#edf0ec'),semiWallMat=mat('#c0cbc8',.28),wood=mat('#ccb18a'),white=mat('#fbfaf6'),charcoal=mat('#4c6576');
function box(g,x,y,z,w,h,d,m){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m);a.position.set(x+w/2,y+h/2,z+d/2);a.castShadow=true;a.receiveShadow=true;g.add(a);return a}
function label(g,text,x,y,z,color='#254d65',scale=4.2){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#fffffff0';ctx.beginPath();ctx.roundRect(4,8,760,112,18);ctx.fill();ctx.strokeStyle='#c6d9e4';ctx.lineWidth=3;ctx.stroke();ctx.font='bold 60px Microsoft YaHei,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;let fs=60;while(ctx.measureText(text).width>720&&fs>28){fs-=2;ctx.font='bold '+fs+'px Microsoft YaHei,sans-serif'}ctx.fillText(text,384,65);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,toneMapped:false}));s.position.set(x,y,z);s.scale.set(scale,scale/6,1);s.renderOrder=50;s.userData.labelText=text;g.add(s);labels.push(s);return s}
function zone(g,x,z,w,d,color,name,desc){const a=box(g,x,0,z,w,.004,d,color);a.userData={name,desc,hoverIgnore:true};pickables.push(a);return a}
function partition(g,x,z,w,d){const a=box(g,x,0,z,w,2.5,d,glass);partitions.push(a);const b=box(g,x,0,z,w,.1,d,steel);partitions.push(b);return a}
function desk(g,x,z,w=1.35,d=.65){box(g,x,.72,z,w,.055,d,white);for(const dx of [.06,w-.09])box(g,x+dx,0,z+.07,.04,.72,d-.14,steel);box(g,x+w*.4,.78,z+d*.7,.45,.32,.035,charcoal);box(g,x+w*.5,.78,z+d*.7,.04,.04,.12,steel)}
function chair(g,x,z,rot=0){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=rot;g.add(c);box(c,-.23,.43,-.23,.46,.08,.46,charcoal);box(c,-.23,.5,.19,.46,.45,.06,charcoal);box(c,-.035,.08,-.035,.07,.35,.07,steel);box(c,-.25,.05,-.025,.5,.035,.05,steel);box(c,-.025,.05,-.25,.05,.035,.5,steel);return c}
function plant(g,x,z){box(g,x-.17,0,z-.17,.34,.4,.34,'#eee7da');const b=new THREE.Mesh(new THREE.SphereGeometry(.36,9,8),mat('#5e9279'));b.scale.y=1.6;b.position.set(x,.8,z);g.add(b)}
function rail(g,x,z,w,d,firstGlassGap=0){
 const alongX=w>=d,long=alongX?w:d,gap=long>1?.05:0,count=long>1?3:1,panel=(long-firstGlassGap-gap*(count-1))/count;
 for(let i=0;i<count;i++){const at=firstGlassGap+i*(panel+gap);if(alongX)box(g,x+at,0,z,panel,1.08,d,glass);else box(g,x,0,z+at,w,1.08,panel,glass)}
 box(g,x,1.08,z,w,.045,d,steel)
}
// Sloped stair guards use three installable glass panels with 50mm gaps and a slim dark handrail.
function slopeGlassRail(g,a,b){
 const h=1.05,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),gap=.05,panel=(len-gap*2)/3,ux=dx/len,uy=dy/len;
 for(let i=0;i<3;i++){const start=i*(panel+gap),end=start+panel,p0=[a[0]+ux*start,a[1]+uy*start,a[2]],p1=[a[0]+ux*end,a[1]+uy*end,a[2]],positions=[...p0,...p1,p1[0],p1[1]+h,p1[2],p0[0],p0[1]+h,p0[2]];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();
  const pane=new THREE.Mesh(geo,mat('#89c2d4',.30));pane.material.side=THREE.DoubleSide;pane.castShadow=true;pane.receiveShadow=true;g.add(pane)}
 line(g,[[a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]]],'#333b42');
}
// Side-elevation profiles provide square-cut ends against floor and platform faces.
function steelProfile(parent,name,points,z,width){
 const sh=new THREE.Shape();
 points.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();
 const geometry=new THREE.ExtrudeGeometry(sh,{depth:width,bevelEnabled:false});
 const mesh=new THREE.Mesh(geometry,steel);mesh.position.z=z;mesh.name=name;
 mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
// Ground outline uses the same CAD vertices as the existing 1801 page, including its notches.
const verified=await fetch('./1801_专页核对数据.json?v=74').then(r=>r.json());
const contour=verified.geometry.poly.map(a=>[(a[0]+25113)/1000,(a[1]+10830)/1000]);const shape=new THREE.Shape();contour.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const fg=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false});fg.rotateX(-Math.PI/2);const floor=new THREE.Mesh(fg,mat('#d1d0c8'));floor.position.y=-.16;floor.receiveShadow=true;ground.add(floor);

// Both sides and the main aisle share the surveyed-coordinate floor reference.
const groundFloorMeshes=[floor],upperFloorMeshes=[];
const sidePolys=[[[3.9, 7.675], [5.15, 7.675], [9.15, 7.675], [9.15, 0.0], [0.125, 0.0], [0.125, 0.1], [0.0, 0.1], [0.0, 0.5], [0.0, 1.0], [0.0, 7.675], [0.05, 7.675], [0.25, 7.675], [0.7, 7.675], [3.9, 7.675]], [[10.8, 9.4], [18.425, 9.4], [18.425, 9.3], [18.925, 9.3], [18.925, 9.4], [19.025, 9.4], [19.425, 9.4], [19.425, 0.0], [10.7, 0.0], [10.7, 9.4], [10.8, 9.4]]];
for(const points of sidePolys){const sh=new THREE.Shape();points.forEach((p,i)=>i?sh.lineTo(p[0],-p[1]):sh.moveTo(p[0],-p[1]));sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:false});geo.rotateX(-Math.PI/2);const m=new THREE.Mesh(geo,mat('#d6d5cd'));m.position.y=-.1;m.receiveShadow=true;ground.add(m);groundFloorMeshes.push(m)}
// The slab and trimmers follow the same headroom opening.
const upperBoundary=[[18.425,9.4],[18.425,9.3],[18.925,9.3],[18.925,9.4],[19.425,9.4],[19.425,0.0],[10.7,0.0],[10.7,9.4],[10.8,9.4],[18.425,9.4]];
const upperShape=new THREE.Shape();upperBoundary.forEach((p,i)=>i?upperShape.lineTo(p[0],-p[1]):upperShape.moveTo(p[0],-p[1]));upperShape.closePath();
const stairOpening=MEZZANINE.opening;
const stairHole=new THREE.Path();stairOpening.forEach((p,i)=>i?stairHole.lineTo(p[0],-p[1]):stairHole.moveTo(p[0],-p[1]));stairHole.closePath();upperShape.holes.push(stairHole);
// Keep the mezzanine as a thin floor finish only: the field condition has no exposed grey-white fascia band.
const upperGeo=new THREE.ExtrudeGeometry(upperShape,{depth:MEZZANINE.finishThickness,bevelEnabled:false});upperGeo.rotateX(-Math.PI/2);const upperSlab=new THREE.Mesh(upperGeo,mat('#c7c3b9'));upperSlab.position.y=-MEZZANINE.finishThickness;upperSlab.receiveShadow=true;upper.add(upperSlab);upperFloorMeshes.push(upperSlab);
zone(ground,.1,.1,8.95,7.45,'#d6d5cd','进门右侧 · 开放办公预留区','独立矩形开放办公侧；当前不布置工位或会议桌，与老板侧分别从中央通道进入。');
const corridor=zone(ground,9.15,0,1.55,10.7,'#cbcac3','中间 · 完成面通道','原中间下沉示意取消；一楼全部统一为同一完成面，保持1.55米宽通道。');
// The plan datum is zero; the continuous finished first floor is 17 mm below it.
ground.position.y=MEZZANINE.lowerFinish;
zone(ground,16.7,1.2,2.55,7.9,'#d6d5cd','老板侧 · 平地运动','沿窗运动和设备带的原预留范围约20.15㎡；显示候选柱位时，训练垫移至中部开放区。此范围不是净训练面积。');
zone(ground,10.85,.15,2.65,6.9,'#d6d5cd','老板侧 · 休闲茶吧','开放休闲区域，保留入口至楼梯的接近路线。');
zone(ground,10.65,5.94,6.88,3.30,'#d2d1ca','贴墙U型楼梯','单跑宽1.50m，共26级，第一跑17级、第二跑9级；两跑等踏高、等踏深，出口贴墙。');
const furnitureObjects=[],furnitureMovables=[],furnitureAnchoredNotes=[];
const furnitureStorageKey='1801-furniture-reference-v1';
function markFurnitureMovable(object,id,name){object.userData.furnitureMovable={id,name,initial:{x:object.position.x,z:object.position.z,scale:object.scale.x,rotation:object.rotation.y}};furnitureMovables.push(object);return object}
function saveFurnitureLayout(){try{localStorage.setItem(furnitureStorageKey,JSON.stringify(furnitureMovables.map(o=>({id:o.userData.furnitureMovable.id,x:o.position.x,z:o.position.z,scale:o.scale.x,rotation:o.rotation.y}))))}catch{}}
function restoreFurnitureLayout(){try{const saved=JSON.parse(localStorage.getItem(furnitureStorageKey)||'[]');for(const item of saved){const object=furnitureMovables.find(o=>o.userData.furnitureMovable.id===item.id);if(object&&Number.isFinite(item.x)&&Number.isFinite(item.z)&&Number.isFinite(item.scale)){object.position.x=item.x;object.position.z=item.z;object.scale.setScalar(THREE.MathUtils.clamp(item.scale,.55,1.8));if(Number.isFinite(item.rotation))object.rotation.y=item.rotation}}}catch{}}
function resetFurnitureLayout(){for(const object of furnitureMovables){const initial=object.userData.furnitureMovable.initial;object.position.x=initial.x;object.position.z=initial.z;object.rotation.y=initial.rotation;object.scale.setScalar(initial.scale)}try{localStorage.removeItem(furnitureStorageKey)}catch{}}
function updateFurnitureAnchoredNotes(){for(const note of furnitureAnchoredNotes){const a=note.userData.furnitureAnchor;note.position.x=a.x+a.owner.position.x;note.position.z=a.z+a.owner.position.z}}
function furnitureStart(){return new Set([...ground.children,...upper.children])}
function furnitureEnd(previous){for(const o of [...ground.children,...upper.children])if(!previous.has(o)){o.userData.furniture=true;furnitureObjects.push(o)}}
const furnitureGroundStart=furnitureStart();
// The former 20-workstation concept is intentionally removed.  Keep this side open
// so its final workstations and meeting layout can be decided after circulation review.
// Ground private furnishings: left-side changes only; the right-side office zone stays open.
// Small open gym bar on the left owner side; it is furniture only, never a room partition.
box(ground,11.05,.3,.5,.8,.42,2.8,charcoal);box(ground,10.98,.6,.5,.15,.65,2.8,charcoal);box(ground,12.1,.38,1.15,.72,.08,1.75,wood);
for(const z of [1.38,1.98,2.58]){const stool=new THREE.Group();stool.position.set(13.02,0,z);ground.add(stool);box(stool,-.18,.44,-.18,.36,.07,.36,charcoal);box(stool,-.03,.08,-.03,.06,.36,.06,steel);box(stool,-.22,.05,-.02,.44,.03,.04,steel);box(stool,-.02,.05,-.22,.04,.03,.44,steel)}
box(ground,11.05,0,4.20,2.1,.88,.45,steel);box(ground,11,.88,4.15,2.2,.06,.55,wood);
const trainingMat=box(ground,16.5,.005,.2,1.8,.012,2.4,'#657c7d');box(ground,18.65,0,2.9,.4,.8,1.3,steel);
for(let i=0;i<4;i++)box(ground,18.58,.9,3.05+i*.28,.55,.08,.07,charcoal);
const bag=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,1.5,24),mat('#7a6254'));bag.position.set(18.1,.85,2.2);ground.add(bag);box(ground,17.77,0,1.87,.66,.12,.66,steel);
furnitureEnd(furnitureGroundStart);
// Upper: compact wet block against exterior wall; the remainder stays open.
zone(upper,10.85,.25,2.35,3.85,'#c5bd9c','二楼 · 临挑空茶桌','6人茶桌，临挑空边设栏杆。');
zone(upper,16.85,1.2,2.35,4.2,'#b5cbd1','二楼 · 主电脑位','外墙侧深处的主电脑位，屏幕朝座位，远离公共挑空边。');
zone(upper,13.85,2.6,2.65,2.35,'#c6bacb','二楼 · 直播与日常办公','直播和日常办公，家具避开楼梯洞口；大屏已按要求移除。');
// U flights swapped: upper arrival against the original solid wall.
zone(upper,17.53,7.74,1.50,1.50,'#d5c9a4','二楼 · 贴墙出口','第二跑沿实体墙折返上楼；到达区1.50×1.50m，保持无家具，通过入口侧楼面连接办公区。');
label(upper,'贴墙出口 · 上跑到达',18.28,.55,8.45,'#966b30',3.5);
const furnitureUpperStart=furnitureStart();
// Furniture v1: column-wrapping work desk and separate tea table, matching the marked two zones.
const columnDesk=new THREE.Group();upper.add(columnDesk);
// Existing 500mm column occupies x18.425–18.925 / z0.50–1.00; desktop wraps around it without touching the column.
box(columnDesk,17.12,.72,.25,1.18,.09,.68,wood);box(columnDesk,17.86,.72,1.06,.66,.09,.86,wood);box(columnDesk,18.98,.72,.25,.25,.09,.68,wood);
for(const [x,z] of [[17.20,.30],[18.18,.30],[17.94,1.80],[18.43,1.80],[19.12,.30]])box(columnDesk,x,0,z,.06,.72,.06,steel);
markFurnitureMovable(columnDesk,'upper-column-desk','柱边办公桌');
markFurnitureMovable(chair(upper,17.42,1.78,Math.PI),'upper-desk-chair','柱边办公椅');
const teaTable=new THREE.Group();upper.add(teaTable);box(teaTable,13.55,.72,2.08,2.00,.09,.82,wood);
for(const [x,z] of [[13.65,2.16],[15.38,2.16],[13.65,2.78],[15.38,2.78]])box(teaTable,x,0,z,.06,.72,.06,steel);
markFurnitureMovable(teaTable,'upper-tea-table','茶桌');
for(const [index,[x,z,r]] of [[13.72,3.12,Math.PI],[14.55,3.12,Math.PI],[15.38,3.12,Math.PI],[14.10,1.52,0],[15.00,1.52,0]].entries())markFurnitureMovable(chair(upper,x,z,r),'upper-tea-chair-'+(index+1),'茶桌椅 '+(index+1));
function furnitureNote(text,x,z,owner){const s=label(upper,text,x,1.28,z,'#385d6d',3.45);s.userData.furniture=true;s.userData.furnitureAnchor={owner,x,z};furnitureAnchoredNotes.push(s);return s}
furnitureNote('柱边办公桌 1.80×0.75m',18.05,2.10,columnDesk);furnitureNote('茶桌 2.00×0.82m',14.55,3.70,teaTable);
furnitureEnd(furnitureUpperStart);
restoreFurnitureLayout();
// Ground-group elevations are relative to the finished first-floor surface.
const wet=new THREE.Group(),wetWalls=new THREE.Group();ground.add(wet);wet.add(wetWalls);
const wetFloorFinish=MEZZANINE.wetFloorFinish, wetLocalFloor=wetFloorFinish-MEZZANINE.lowerFinish;
const wetUnderPlatformBeam=MEZZANINE.wetBeamClearance;
const {head:headAt,drain:drainAt,basin:basinAt,door:wetDoorAt}=MEZZANINE.wetFixtures;
box(wet,10.77,.005,6.09,2.16,wetLocalFloor-.005,3.10,mat('#d0cfc7')).name='shower-finished-floor';
const headBottom=MEZZANINE.wetHeadBottom-MEZZANINE.lowerFinish;
const showerRiser=box(wet,12.795,1.05,6.46,.055,headBottom+.07-1.05,.045,steel);
showerRiser.name='shower-wall-riser';
const showerArm=box(wet,12.54,headBottom+.04,6.46,.255,.03,.045,steel);
showerArm.name='shower-arm';
const showerHead=box(wet,headAt.x-.095,headBottom,headAt.z-.095,.19,.04,.19,steel);
showerHead.name='shower-head';
const showerGlass=mat('#26383f',.78),showerDoorGlass=mat('#365159',.68);
const glassHeight=2.20, doorFrameHeight=2.225;
box(wetWalls,10.77,wetLocalFloor,6.09,.06,glassHeight,3.10,showerGlass);
for(const z of [6.09,9.13])box(wetWalls,10.83,wetLocalFloor,z,2.02,glassHeight,.06,showerGlass);
for(const [z,depth] of [[6.09,1.66],[8.75,.44]])box(wetWalls,12.85,wetLocalFloor,z,.06,glassHeight,depth,showerGlass);
// The closed door fills the opening in the stair-side wall at x=12.88.
const showerDoor=new THREE.Group();showerDoor.name='shower-closed-door';wetWalls.add(showerDoor);
box(showerDoor,wetDoorAt.x-.02,wetLocalFloor+.025,wetDoorAt.z-.475,.035,doorFrameHeight-.05,.95,showerDoorGlass);
for(const z of [7.75,8.725])box(showerDoor,12.85,wetLocalFloor,z,.055,doorFrameHeight,.025,steel);
box(showerDoor,12.85,wetLocalFloor+doorFrameHeight-.025,7.775,.055,.025,.95,steel);
box(showerDoor,12.816,wetLocalFloor+.80,8.60,.11,.42,.035,steel);
// Facing inward along −X, lower plan Z is on the left and higher Z is on the right.
box(wet,basinAt.x-basinAt.width/2,wetLocalFloor+.74,basinAt.z-basinAt.depth/2,basinAt.width,.10,basinAt.depth,white).name='shower-basin';
box(wet,basinAt.x-.035,wetLocalFloor,basinAt.z-.035,.07,.74,.07,steel).name='shower-basin-waste';
box(wet,10.88,wetLocalFloor+.84,basinAt.z-.025,.05,.15,.05,steel);
box(wet,10.93,wetLocalFloor+.965,basinAt.z-.018,.12,.025,.036,steel);
box(wet,basinAt.x-.015,wetLocalFloor+.84,basinAt.z-.015,.030,.001,.030,steel);
const grate=box(wet,drainAt.x-drainAt.width/2,wetLocalFloor,drainAt.z-drainAt.depth/2,drainAt.width,.001,drainAt.depth,steel);
grate.name='shower-floor-drain';
for(let i=0;i<5;i++)box(wet,drainAt.x-.041,wetLocalFloor+.001,drainAt.z-.039+i*.018,.082,.0008,.006,'#989d9e');
const wetFloor=zone(ground,10.77,6.09,2.16,3.10,'#d0cfc7','平台下 · 淋浴区','外框2.16×3.10m，含一个花洒、洗手池与封闭玻璃门。');wetFloor.position.y=wetLocalFloor-.005;
$('#wetWalls').checked=true;wetWalls.visible=true;
$('#wetWalls').onchange=e=>{wetWalls.visible=e.target.checked};

const {lowerFinish,riser:rise,going,lowerRisers,upperRisers,lowerLandingX,lowerStartX,
 upperStartX,thresholdX,midLanding:midHeight,platformBeamDepth}=MEZZANINE;
const stairW=1.50, approachDepth=19.275-lowerStartX;
const showerDimension=new THREE.Group();
showerDimension.name='shower-dimension-at-platform-edge';
model.add(showerDimension);showerDimension.visible=false;
const dimX=11.28,dimZ=9.43,dimBottom=MEZZANINE.wetFloorFinish,dimTop=midHeight-platformBeamDepth;
line(showerDimension,[[dimX,dimBottom,dimZ],[dimX,dimTop,dimZ]],'#b44f20');
for(const y of [dimBottom,dimTop])line(showerDimension,[[dimX-.11,y,dimZ],[dimX+.11,y,dimZ],[dimX+.11,y,9.06]],'#b44f20');
const showerDimTag=label(showerDimension,'梁下净高 '+(dimTop-dimBottom).toFixed(2)+' 米',11.28,(dimTop+dimBottom)/2,dimZ+.03,'#944519',2.22);
zone(ground,lowerStartX,6.04,approachDepth,stairW,'#d4c6a4','内侧楼梯起步区','进深约'+approachDepth.toFixed(2)+'m，保留一楼进出通路。');
const flights=[
 {id:'lower',start:lowerStartX,end:lowerLandingX,direction:-1,z:6.04,base:lowerFinish,count:lowerRisers},
 {id:'upper',start:upperStartX,end:thresholdX,direction:1,z:7.74,base:midHeight,count:upperRisers}
];
for(const f of flights){
 for(let i=0;i<f.count-1;i++){
  const nose=f.start+f.direction*i*going, plane=f.base+(i+1)*rise;
  const tread=box(stairTreads,Math.min(nose,nose+f.direction*going),plane-.10,f.z,going,.10,stairW,steel);
  tread.name='stair-'+f.id+'-tread-'+String(i+1).padStart(2,'0');
 }
 for(const z of [f.z+.11,f.z+stairW-.11]){
  const topAtStart=f.base-.10,topAtEnd=f.base+(f.count-1)*rise-.10;
  const verticalDepth=.18/Math.cos(Math.atan(rise/going));
  const lower=f.id==='lower';
  let profile;
  if(lower){
   // A horizontal shoe sits on the existing floor. The first support terminates at this shoe.
   const clipX=y=>f.start+(y-topAtStart)*f.direction*going/rise;
   const shoeTop=lowerFinish+.018;
   profile=[[clipX(shoeTop),shoeTop],[f.end,topAtEnd],[f.end,topAtEnd-verticalDepth],
    [clipX(shoeTop+verticalDepth),shoeTop]];
   const startX=clipX(shoeTop+verticalDepth);
   box(stairs,startX,lowerFinish,z-.095,f.start-startX,.018,.19,steel).name='stair-base-shoe';
  }else{
   profile=[[f.start,topAtStart],[f.end,topAtEnd],[f.end,topAtEnd-verticalDepth],[f.start,topAtStart-verticalDepth]];
  }
  steelProfile(stairs,'stair-'+f.id+'-stringer',profile,z-.07,.14);
  for(let i=0;i<f.count-1;i++){
   const nose=f.start+f.direction*i*going, treadUnder=f.base+(i+1)*rise-.10;
   const bearingEnd=nose+f.direction*going;
   // A level seat supports the tread face; its inclined underside bears on the stringer.
   const base=(lower&&i===0)?lowerFinish+.018:treadUnder-rise;
   const pts=[[nose,treadUnder],[bearingEnd,treadUnder]];
   if(lower&&i===0)pts.push([nose+f.direction*(base-topAtStart)*going/rise,base]);
   pts.push([nose,base]);
   steelProfile(stairs,'stair-'+f.id+'-tread-seat',pts,z-.055,.11);
  }
 }
}
const platformObstacles=[];
function platformPart(name,x1,x2,z1,z2,bottom,top){
 const mesh=box(stairs,x1,bottom,z1,x2-x1,top-bottom,z2-z1,steel);
 mesh.name=name;platformObstacles.push(mesh);
}
const deckUnder=midHeight-.30, platformBeamUnder=midHeight-platformBeamDepth;
platformPart('stair-turning-platform',10.75,lowerLandingX,6.04,9.24,deckUnder,midHeight);
platformPart('stair-turning-platform-extension',lowerLandingX,upperStartX,7.64,9.24,deckUnder,midHeight);
platformPart('platform-beam-lower-edge',10.75,lowerLandingX,6.12,6.26,platformBeamUnder,deckUnder);
platformPart('platform-beam-wall-side',10.75,upperStartX,9.00,9.14,platformBeamUnder,deckUnder);
platformPart('platform-beam-extension-edge',lowerLandingX,upperStartX,7.65,7.79,platformBeamUnder,deckUnder);
for(const z of [6.015,7.565])slopeGlassRail(stairs,[lowerStartX,lowerFinish+rise,z],[lowerLandingX,midHeight,z]);
slopeGlassRail(stairs,[upperStartX,midHeight+rise,7.715],[thresholdX,levelHeight,7.715]);
const [[openLeft,openFront],[openCorner],[,openStep],,,[,openBack]]=stairOpening;
const turnWalkX=openLeft+.04;
const midGuard=new THREE.Group();midGuard.position.y=midHeight;stairs.add(midGuard);
rail(midGuard,turnWalkX-.05,5.99,.05,3.25);
rail(midGuard,turnWalkX,5.99,lowerLandingX-turnWalkX,.05);
rail(midGuard,lowerLandingX,7.64,upperStartX-lowerLandingX,.05);
openingRails.scale.x=1;openingRails.position.x=0;
rail(openingRails,openLeft,openFront-.06,openCorner-openLeft,.06);
rail(openingRails,openCorner,openFront,.06,openStep-openFront);
rail(openingRails,openCorner+.06,openStep-.06,thresholdX-openCorner-.06,.06);
rail(openingRails,openLeft-.06,openFront,.06,openBack-openFront);

// Keep the interior-edge guard only.  The exterior L-shaped daylight glass is already the enclosure and has no added handrail.
rail(upper,10.7,0,.07,7.44);
// Carry the exposed mezzanine edge to the inner face of the 120 mm end wall.
const guardReturn=new THREE.Group();
guardReturn.name='mezzanine-edge-guard-extension';
upper.add(guardReturn);
rail(guardReturn,10.7,7.44,.07,9.34-7.44,.05);
// No short cutaway wall band is shown here: it is not present in the field condition.

function stairArrow(a,b,color){const from=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(from);const arrow=new THREE.ArrowHelper(delta.clone().normalize(),from,delta.length(),color,.32,.18);stairs.add(arrow)}
stairArrow([lowerStartX-.05,lowerFinish+rise+.22,6.79],[lowerLandingX+.08,midHeight+.18,6.79],0xd28a24);
stairArrow([11.85,midHeight+.18,6.79],[11.85,midHeight+.18,8.49],0xd28a24);
stairArrow([upperStartX+.04,midHeight+rise+.18,8.49],[thresholdX-.05,levelHeight+.18,8.49],0x258b9a);
label(stairs,'第一跑 '+lowerRisers+'级 · 宽1.50m',15.3,1.5,6.0,'#96621e',4.2);
label(stairs,'第二跑 '+upperRisers+'级 · 贴墙出口',15.8,levelHeight+.65,9.0,'#287b8b',4.2);
label(stairs,'转身平台顶 +'+midHeight.toFixed(3)+'m',11.75,midHeight+.45,7.6,'#755b3e',3.5);
// Stop the steel at the inside faces of the two existing window beams. The top
// contact plane is shared by every steel member and the underside of the finish.
const frameBeam=mat('#27313a');
function frameMember(name,x1,z1,x2,z2,depth=MEZZANINE.primaryDepth){
 const beam=box(structure,x1,upperDeckUnderside-depth,z1,x2-x1,depth,z2-z1,frameBeam);
 beam.name=name;
}
const windowX=MEZZANINE.beltInnerX, windowZ=MEZZANINE.beltInnerZ;
const outerSteelX=windowX-.18;
frameMember('left-edge',10.70,windowZ,10.88,openBack);
frameMember('column-side-edge',outerSteelX,1.00,windowX,openBack);
frameMember('glazing-side-span',10.88,windowZ,outerSteelX,windowZ+.18);
frameMember('platform-opening-front',10.88,openFront-.18,openCorner+.14,openFront);
frameMember('platform-helper-edge',openLeft-.14,openFront,openLeft,openBack);
frameMember('platform-opening-return',openCorner,openFront,openCorner+.14,openStep);
frameMember('upper-flight-opening-side',openCorner+.14,openStep-.18,outerSteelX,openStep);
frameMember('back-wall-span',10.70,openBack,18.425,9.40);
frameMember('opening-threshold',thresholdX,openStep,thresholdX+.14,openBack);
for(const x of [12.25,13.70,15.15,16.60,18.05]){
 const headerFace=x<openCorner+.14?openFront-.18:openStep-.18;
 frameMember('floor-secondary',x,windowZ+.18,x+.14,headerFace,.18);
}
function line(g,points,c='#546978'){const a=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:c}));g.add(a);return a}
// 3D electrical overlay mirrors the two circuit drawings. Every socket is a selectable
// five-hole panel (two-pin plus three-pin). These positions were removed by the user
// in the live review and are now deliberately absent from the published layout.
const circuitGround=new THREE.Group(),circuitUpper=new THREE.Group(),circuitPickables=[],socketItems=[];ground.add(circuitGround);upper.add(circuitUpper);circuitGround.visible=false;circuitUpper.visible=false;
const circuitBlue='#1683c2',circuitAmber='#c98926',circuitTeal='#187a80',circuitPurple='#7a56a4',c1Mat=mat('#1975a3'),c2Mat=mat('#c98926'),c3Mat=mat('#187a80'),c4Mat=mat('#7a56a4'),socketFace=mat('#f7f4ea'),socketHole=mat('#273b46');
let socketSeq=0,selectedSocket=null;
const permanentlyDeletedSocketIds=new Set(['S04','S05','S06','S07','S11','S12','S13','S14','S15','S16','S17','S18','S19','S20','S21','S22','S23','S24','S25','S26','S27','S28','S29','S30','S34','S35','S36','S38','S39','S40','S41']);
function roundHole(g,x,y){const h=new THREE.Mesh(new THREE.CircleGeometry(.024,12),socketHole);h.position.set(x,y,.031);g.add(h)}
function outlet(g,x,z,side='z',color=c1Mat,circuit='C1',floor='一楼',height=.38){const o=new THREE.Group(),id=`S${String(++socketSeq).padStart(2,'0')}`,rimMaterial=color.clone();o.position.set(x,height,z);if(side==='x')o.rotation.y=Math.PI/2;g.add(o);if(permanentlyDeletedSocketIds.has(id)){g.remove(o);return null}const rim=box(o,-.215,-.145,-.035,.43,.29,.025,rimMaterial),plate=box(o,-.195,-.125,-.02,.39,.25,.05,socketFace);roundHole(o,-.055,.062);roundHole(o,.055,.062);roundHole(o,0,-.008);roundHole(o,-.068,-.074);roundHole(o,.068,-.074);const meta={id,circuit,floor,root:o,rim,plate,baseColor:rimMaterial.color.clone()};o.userData.socket=meta;plate.userData.socket=meta;circuitPickables.push(plate);socketItems.push(meta);return o}
function wire(g,points,color=circuitBlue){return line(g,points,color)}
// Routing is shown at the finished-floor / skirting level, then rises only the short distance into each outlet.
// It is a layout reference only; final conduit type and protection are for the licensed electrician to confirm.
function tray(g,points,color,y=.10){wire(g,points.map(([x,z])=>[x,y,z]),color)}
const pendingDrops=[],circuitDropLines=[];
function drop(g,x,z,color,from=.10,to=.38){pendingDrops.push({g,x,z,color,from,to})}
function drawSocketDrops(){for(const lead of pendingDrops){const socket=socketItems.find(item=>item.root.parent===lead.g&&Math.abs(item.root.position.x-lead.x)<.002&&Math.abs(item.root.position.z-lead.z)<.002);if(socket){const segment=wire(lead.g,[[lead.x,lead.from,lead.z],[lead.x,lead.to,lead.z]],lead.color);circuitDropLines.push({segment,root:socket.root})}}}
// 一楼 C1-C4：每条长墙的三点作为居中一组，给两端与桌位布置留出余地；入口右手墙另设两点。
for(const x of [3.00,4.60,6.20,8.40])outlet(circuitGround,x,7.53,'z',c1Mat,'C1','一楼');for(const z of [1.25,3.40,5.55])outlet(circuitGround,8.98,z,'x',c1Mat,'C1','一楼');for(const x of [3.00,4.60,6.20])outlet(circuitGround,x,.12,'z',c1Mat,'C1','一楼');
for(const [x,z,s] of [[11.1,1.0,'z'],[12.7,1.0,'z'],[13.35,4.2,'x']])outlet(circuitGround,x,z,s,c2Mat,'C2','一楼');for(const [x,z,s] of [[17.0,1.2,'z'],[18.85,2.9,'x'],[18.85,5.2,'x'],[18.85,7.5,'x'],[17.0,9.12,'z'],[14.6,9.12,'z']])outlet(circuitGround,x,z,s,c3Mat,'C3','一楼');
for(const z of [6.45,8.45])outlet(circuitGround,12.85,z,'x',c4Mat,'C4','一楼');
// 入口总电箱按红圈改至内侧墙位：箱体保持原规格，主干先贴近完成地面左转，再沿地脚线分配。
const trayY=.10,entryPanelX=8.25,entryWallFace=7.675-.06;
const entryPanel=box(circuitGround,entryPanelX-.29,1.15,entryWallFace-.12,.58,.72,.12,'#224b67');
entryPanel.name='entrance-wall-distribution-board';
box(circuitGround,entryPanelX-.265,1.175,entryWallFace-.127,.53,.67,.007,'#335b72');
box(circuitGround,entryPanelX+.18,1.46,entryWallFace-.14,.025,.09,.013,'#adbcc1');
const feedZ=entryWallFace-.06;
wire(circuitGround,[[entryPanelX,1.15,feedZ],[entryPanelX,trayY,feedZ],[entryPanelX,trayY,7.30]],circuitBlue);
wire(circuitGround,[[.85,trayY,7.30],[.85,trayY,.55]],circuitBlue);
// C1 · 开放办公普通插座回路（蓝）。
tray(circuitGround,[[.85,7.30],[8.60,7.30]],circuitBlue);for(const x of [3.00,4.60,6.20,8.40])drop(circuitGround,x,7.53,circuitBlue);
tray(circuitGround,[[.85,.55],[8.60,.55]],circuitBlue);for(const x of [3.00,4.60,6.20])drop(circuitGround,x,.12,circuitBlue);for(const z of [1.25,3.40,5.55])drop(circuitGround,8.98,z,circuitBlue);for(const z of [2.55,5.15]){tray(circuitGround,[[.85,z],[.12,z]],circuitBlue);drop(circuitGround,.12,z,circuitBlue)}
// C2 · 吧台/设备预留回路（琥珀）。
tray(circuitGround,[[8.71,.55],[13.35,.55],[13.35,4.20]],circuitAmber);for(const [x,z] of [[11.10,1.00],[12.70,1.00],[13.35,4.20]])drop(circuitGround,x,z,circuitAmber);
// C3 · 右侧开放区回路（青绿）。
tray(circuitGround,[[8.71,.55],[17.20,.55],[17.20,8.65],[18.85,8.65],[18.85,2.90]],circuitTeal);for(const [x,z] of [[17.0,1.2],[18.85,2.9],[18.85,5.2],[18.85,7.5],[17.0,9.12],[14.6,9.12]])drop(circuitGround,x,z,circuitTeal);for(const x of [12.8,17.2])drop(circuitGround,x,.12,circuitTeal)
// C4 · 卫浴防溅专用回路（紫），沿地脚线独立布设后短距离上引，不与普通插座串接。
tray(circuitGround,[[8.71,.55],[12.35,.55],[12.35,9.11]],circuitPurple);for(const z of [6.45,8.45]){tray(circuitGround,[[12.35,z],[12.85,z]],circuitPurple);drop(circuitGround,12.85,z,circuitPurple)}
// 二楼 C5-C8：按当前 L 形夹层楼面及洞口边界布点，独立竖向干线从一楼配电箱上引。
for(const x of [11.2,12.8,14.4,16.0,17.6])outlet(circuitUpper,x,9.24,'z',c1Mat,'C5','二楼');outlet(circuitUpper,19.25,8.0,'x',c1Mat,'C5','二楼');for(const z of [1.2,3.0,5.0])outlet(circuitUpper,10.8,z,'x',c2Mat,'C6','二楼');for(const x of [12.8,15.0,17.2])outlet(circuitUpper,x,.12,'z',c2Mat,'C7','二楼');
for(const [x,z,s] of [[11.25,1.3,'z'],[13.7,1.3,'z'],[16.0,1.3,'z']])outlet(circuitUpper,x,z,s,c2Mat,'C7','二楼');for(const [x,z,s] of [[18.9,3.3,'x'],[18.9,5.4,'x'],[18.9,7.0,'x'],[16.2,7.25,'z'],[13.8,7.25,'z']])outlet(circuitUpper,x,z,s,c3Mat,'C8','二楼');
// These four points retain their established positions and IDs after the user removed the other legacy points.
for(const z of [2.55,5.15])outlet(circuitGround,.12,z,'x',c1Mat,'C1','一楼');for(const x of [12.8,17.2])outlet(circuitGround,x,.12,'z',c3Mat,'C3','一楼');
// 卫浴点设在干区后墙，避开花洒喷淋范围；最终须用防溅面板、漏保回路并由持证电工深化。
outlet(circuitGround,12.35,9.11,'z',c4Mat,'C4','一楼',1.10);drop(circuitGround,12.35,9.11,circuitPurple,trayY,1.10);
// 上楼竖向干线：仅在入口侧墙内由一楼地脚线位置上引，二楼继续贴地脚线分回路。
wire(circuitGround,[[10.85,trayY,.55],[10.85,levelHeight,.55]],circuitBlue);const upperTrayY=.10;wire(circuitUpper,[[10.85,0,.55],[10.85,upperTrayY,.55]]);
// C5 · 二楼周边普通插座回路（蓝）。
tray(circuitUpper,[[10.85,8.70],[17.60,8.70]],circuitBlue,upperTrayY);for(const x of [11.20,12.80,14.40,16.00,17.60])drop(circuitUpper,x,9.24,circuitBlue,upperTrayY);tray(circuitUpper,[[17.60,8.70],[19.25,8.70]],circuitBlue,upperTrayY);drop(circuitUpper,19.25,8.00,circuitBlue,upperTrayY);
// C6/C7 · 茶台及日常办公回路（琥珀）。
tray(circuitUpper,[[10.85,.55],[17.20,.55]],circuitAmber,upperTrayY);for(const z of [1.20,3.00,5.00])drop(circuitUpper,10.80,z,circuitAmber,upperTrayY);for(const x of [12.80,15.00,17.20])drop(circuitUpper,x,.12,circuitAmber,upperTrayY);for(const x of [11.25,13.70,16.00])drop(circuitUpper,x,1.30,circuitAmber,upperTrayY);
// C8 · 二楼右侧设备/扩展回路（青绿）。
tray(circuitUpper,[[17.20,.55],[18.90,.55],[18.90,7.25],[13.80,7.25]],circuitTeal,upperTrayY);for(const z of [3.30,5.40,7.00])drop(circuitUpper,18.90,z,circuitTeal,upperTrayY);for(const x of [16.20,13.80])drop(circuitUpper,x,7.25,circuitTeal,upperTrayY);box(circuitUpper,10.56,1.15,.20,.58,.72,.12,'#224b67');
// Draw only leads whose socket panel remains in the current layout.  A deleted panel never leaves a floating vertical line behind.
drawSocketDrops();
// Existing 500mm columns remain at the CAD positions; no implied permission to alter them.
for(const x of [8.65,18.425])box(shell,x,0,.5,.5,8.4,.5,'#8c969a');
const upperOriginalColumn=box(upper,18.425,0,.5,.5,totalHeight-levelHeight,.5,'#8c969a');upperOriginalColumn.visible=false;
// The exterior envelope is a square: the z=0 + x=19.425 sides stay as the L-shaped daylight face.
// Merge every collinear run before creating a wall, so a straight wall has no false dark posts or panel seams.
const solidWallSegments=[];for(let i=1;i<contour.length;i++){const a=contour[i-1],b=contour[i],entryGap=Math.abs(a[1]-10.7)<.01&&Math.abs(b[1]-10.7)<.01,daylightFace=(Math.abs(a[1])<.01&&Math.abs(b[1])<.01)||(Math.abs(a[0]-19.425)<.01&&Math.abs(b[0]-19.425)<.01);if(entryGap||daylightFace)continue;const prev=solidWallSegments.at(-1),dx=b[0]-a[0],dz=b[1]-a[1];if(prev){const px=prev.b[0]-prev.a[0],pz=prev.b[1]-prev.a[1],joined=Math.hypot(prev.b[0]-a[0],prev.b[1]-a[1])<.001,collinear=Math.abs(px*dz-pz*dx)<.001;if(joined&&collinear){prev.b=b;continue}}solidWallSegments.push({a:[...a],b:[...b]})}
for(const {a,b} of solidWallSegments){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.03)continue;const w=box(shell,-len/2,0,-.06,len,8.4,.12,semiWallMat);w.position.set((a[0]+b[0])/2,4.2,(a[1]+b[1])/2);w.rotation.y=-Math.atan2(dz,dx);w.userData.hoverDimension={a:[a[0],.08,a[1]],b:[b[0],.08,b[1]],text:len.toFixed(3)+' m'}}
const entryDoorMat=mat('#6c98a0',.36);box(ground,9.15,0,10.66,1.55,2.50,.035,entryDoorMat);for(const x of [9.15,10.70])box(ground,x-.025,0,10.655,.05,2.50,.06,steel);box(ground,9.15,2.45,10.655,1.55,.05,.06,steel);box(ground,10.40,1.10,10.61,.035,.22,.08,wood);
// The dark translucent waistline spans the full glass width, edge to edge.
// The label keeps the canvas's natural aspect ratio and mirrors horizontally for the exterior view.
box(ground,9.15,1.28,10.695,1.55,.24,.018,mat('#1c3035',.62));
const doorSignCanvas=document.createElement('canvas');doorSignCanvas.width=1600;doorSignCanvas.height=250;const doorSignCtx=doorSignCanvas.getContext('2d');doorSignCtx.clearRect(0,0,1600,250);doorSignCtx.font='700 136px Microsoft YaHei,Segoe UI,sans-serif';doorSignCtx.textAlign='center';doorSignCtx.textBaseline='middle';doorSignCtx.fillStyle='#eef7f4';doorSignCtx.fillText('1801-OPC空间',800,132);const doorSignTexture=new THREE.CanvasTexture(doorSignCanvas);doorSignTexture.colorSpace=THREE.SRGBColorSpace;doorSignTexture.wrapS=THREE.RepeatWrapping;doorSignTexture.repeat.x=-1;doorSignTexture.offset.x=1;doorSignTexture.needsUpdate=true;const doorSign=new THREE.Mesh(new THREE.PlaneGeometry(1.40,.22),new THREE.MeshBasicMaterial({map:doorSignTexture,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));doorSign.position.set(9.925,1.400,10.716);doorSign.renderOrder=145;ground.add(doorSign);


const furniturePlantsStart=furnitureStart();plant(ground,.5,.5);plant(upper,16.3,5.1);furnitureEnd(furniturePlantsStart);
label(ground,'右侧 · 开放办公预留区',4.5,1.4,2.5);
label(ground,'左侧老板区 · 平地运动',18,1.4,5,'#8b6343');label(ground,'第一跑下 · 储物',14.975,1,6.7,'#566368');label(ground,'私用休闲',11.9,1.4,1.8,'#677243');
label(ground,'原入口',9.925,2.9,10.7,'#176a9c');label(ground,'一楼完成面 −0.017m',9.925,.5,5,'#8e6340',3.1);
label(upper,'主电脑位 · 朝向外侧',18,1.6,2.8);label(upper,'临挑空 · 茶桌',11.9,1.5,2.2,'#677243');label(upper,'直播 / 日常办公',15,2.2,4.0,'#77558b');
label(labelGroup,'夹层楼面 +'+levelHeight.toFixed(2)+'m',20.5,levelHeight+.18,5.4,'#466e82',4.2);
line(labelGroup,[[20,0,5.4],[20,levelHeight,5.4]],'#708899');
label(labelGroup,'屋顶结构标高 +'+totalHeight.toFixed(2)+'m',20.5,totalHeight+.18,5.4,'#466e82',4.2);
line(labelGroup,[[20,levelHeight,5.4],[20,totalHeight,5.4]],'#708899');
label(stairs,'淋浴边梁下 '+wetUnderPlatformBeam.toFixed(3)+'m',11.75,midHeight+.75,6.55,'#8a5c36',3.2);
line(stairs,[[11.8,wetFloorFinish,6.19],[11.8,platformBeamUnder,6.19]],'#8a5c36');
const facade=new THREE.Group();model.add(facade);const windowMat=mat('#5b91ad',.055);
// Align the existing frame and the proposed fit-out to the same CAD plan coordinates.
const siteShell = addSiteShell({ THREE, group: fieldFrame, box, shape, top: totalHeight });
// Shared geometry, shown on its own with the steel when comparing the joint.
const steelDatumReference=siteShell.belt.clone();
steelDatumReference.name='steel-reference-existing-window-beam';
steelDatumReference.visible=false;
model.add(steelDatumReference);
const roofUnderside = siteShell.ceiling.position.y;
const windowLighting=makeWindowLighting({THREE,box,belt:siteShell.belt,beltTop:MEZZANINE.steelTop,
 roofBeam:siteShell.roofBeams[0],windowBays:siteShell.windowBays,wallSegments:solidWallSegments});
model.add(windowLighting.fixtures,windowLighting.circuit);
windowLighting.circuit.visible=false;
const circuitBelt=siteShell.belt.clone();
circuitBelt.material=new THREE.MeshBasicMaterial({color:'#859399',transparent:true,opacity:.17,depthWrite:false});
circuitBelt.castShadow=circuitBelt.receiveShadow=false;
windowLighting.circuit.add(circuitBelt);
const roofLightReference=siteShell.roofBeams[0].clone();
roofLightReference.material=circuitBelt.material;roofLightReference.castShadow=roofLightReference.receiveShadow=false;
windowLighting.circuitGroups.WL2.add(roofLightReference);
const lampTags=windowLighting.lights.map(lamp=>label(windowLighting.circuitGroups[lamp.circuit],lamp.id,lamp.x,lamp.y+.30,lamp.z,lightingColors[lamp.circuit],1.08));
const siteServices=addSiteServices({ THREE, group: fieldFrame, box, top: roofUnderside });
const airLayout=makeAirLayout({THREE,box,datum:MEZZANINE,roofUnderside,existingOutlet:siteServices.outlet});
fieldFrame.add(airLayout.group);
const airLabels=new THREE.Group();airLayout.group.add(airLabels);airLabels.visible=false;
const airTags=airLayout.units.map(({id,description,x,y,z})=>label(airLabels,id+' '+description,x,y-.40,z,'#235f62',2.65));
const originalSlabFinish=upperSlab.material;
const airSlabFinish=originalSlabFinish.clone();
airSlabFinish.transparent=true;airSlabFinish.opacity=.17;airSlabFinish.depthWrite=false;
$('#steelViewLevels').textContent='模型标高：梁顶 +'+MEZZANINE.steelTop.toFixed(2)+' 米，夹层完成面 +'+levelHeight.toFixed(2)+' 米。连接节点待深化。';

// Probe the geometry in its assembled position, before any cutaway/exploded viewing transforms.
// Test both sides of every obstruction boundary, every nosing and the continuous pitch line.
const clearanceMeshes=[upperSlab,...structure.children,...siteShell.roofBeams,siteShell.belt,siteShell.ceiling];
for(const group of [siteServices.ceilingPipes,siteServices.hvac,siteServices.fire]){
 group.traverse(object=>{if(object.isMesh)clearanceMeshes.push(object)});
}
model.updateWorldMatrix(true,true);
function checkClearance(rectangles,meshes){
 const eps=.0002, ray=new THREE.Raycaster(), up=new THREE.Vector3(0,1,0);
 const obstacles=meshes.map(mesh=>({mesh,bounds:new THREE.Box3().setFromObject(mesh)}));
 let min=Infinity, limiting='', at=null;
 function stations(lo,hi,limits){
  const points=new Set([lo+eps,hi-eps,(lo+hi)/2]);
  for(const value of limits)for(const x of [value-eps,value,value+eps]){
   if(x>lo+eps&&x<hi-eps)points.add(x);
  }
  return [...points];
 }
 for(const r of rectangles){
  const relevant=obstacles.filter(({bounds:b})=>b.max.x>r.x1&&b.min.x<r.x2&&-b.min.z>r.z1&&-b.max.z<r.z2);
  const xs=stations(r.x1,r.x2,[...relevant.flatMap(o=>[o.bounds.min.x,o.bounds.max.x]),...stairOpening.map(p=>p[0])]);
  const zs=stations(r.z1,r.z2,[...relevant.flatMap(o=>[-o.bounds.max.z,-o.bounds.min.z]),...stairOpening.map(p=>p[1])]);
  for(const x of xs)for(const z of zs){
   const y=r.height(x);
   ray.set(new THREE.Vector3(x,y+eps,-z),up);
   const candidates=relevant.filter(({bounds:b})=>x>=b.min.x&&x<=b.max.x&&-z>=b.min.z&&-z<=b.max.z&&b.max.y>y+eps);
   const hit=ray.intersectObjects(candidates.map(o=>o.mesh),false)[0];
   if(hit&&hit.point.y-y<min){min=hit.point.y-y;limiting=hit.object.name;at=[x,y,z];}
  }
 }
 return {min,limiting,at};
}
const horizontal=(x1,x2,z1,z2,y)=>({x1,x2,z1,z2,height:()=>y});
const flightClearances=flights.map(f=>{
 const strips=[horizontal(Math.min(f.start,f.start-f.direction*.30),Math.max(f.start,f.start-f.direction*.30),f.z,f.z+stairW,f.base),
  horizontal(Math.min(f.end,f.end+f.direction*.30),Math.max(f.end,f.end+f.direction*.30),f.z,f.z+stairW,f.base+f.count*rise)];
 for(let i=0;i<f.count-1;i++){
  const nose=f.start+f.direction*i*going, next=nose+f.direction*going;
  strips.push({x1:Math.min(nose,next),x2:Math.max(nose,next),z1:f.z,z2:f.z+stairW,
   height:x=>f.base+(1+(x-f.start)*f.direction/going)*rise});
 }
 return checkClearance(strips,clearanceMeshes);
});
const turnClearance=checkClearance([horizontal(turnWalkX,lowerLandingX,6.04,9.24,midHeight),
 horizontal(lowerLandingX,upperStartX,7.69,9.24,midHeight)],clearanceMeshes);
const arrivalClearance=checkClearance([horizontal(thresholdX,thresholdX+1.50,7.74,9.24,levelHeight)],clearanceMeshes);
const wetBounds=[horizontal(10.77,12.93,6.09,9.19,wetFloorFinish)];
const showerOverhead=checkClearance(wetBounds,[...platformObstacles,...clearanceMeshes,showerHead,showerArm]);
const stairMinimum=Math.min(...flightClearances.map(v=>v.min));
$('#showerBeamClearance').textContent='淋浴完成面至边梁 '+wetUnderPlatformBeam.toFixed(3)+' m，至花洒底 '+
 (MEZZANINE.wetHeadBottom-wetFloorFinish).toFixed(3)+' m。第一跑净空 '+flightClearances[0].min.toFixed(2)+' m，第二跑 '+
 flightClearances[1].min.toFixed(2)+' m，中转平台 '+turnClearance.min.toFixed(2)+' m。模型尺寸，现场梁底和管线需复测。';


// The final lower window on the short elevation has solid infill above it.
const endWallBottom = siteShell.endWall.position.y - siteShell.endWall.geometry.parameters.height / 2;
const upperGlazingLength = siteShell.endWall.position.z - siteShell.endWall.geometry.parameters.depth / 2;
const daylightSouth=box(facade,0,lowerFinish,-.05,19.425,roofUnderside-lowerFinish,.05,windowMat);
const daylightRight=box(facade,19.425,lowerFinish,0,.05,endWallBottom-lowerFinish,9.40,windowMat);
const shortUpperGlass=box(facade,19.425,endWallBottom,0,.05,roofUnderside-endWallBottom,upperGlazingLength,windowMat);
daylightSouth.userData.hoverDimension={a:[0,lowerFinish,0],b:[19.425,lowerFinish,0],text:'19.425 m'};
daylightRight.userData.hoverDimension={a:[19.425,lowerFinish,0],b:[19.425,lowerFinish,9.4],text:'9.400 m'};
shortUpperGlass.userData.hoverDimension={a:[19.425,endWallBottom,0],b:[19.425,endWallBottom,upperGlazingLength],text:'约 '+upperGlazingLength.toFixed(2)+' m'};
line(facade,[[0,lowerFinish,0],[19.425,lowerFinish,0],[19.425,lowerFinish,9.4]],'#4f8eac');
label(facade,'原图下侧外窗 · L型采光面',8.0,.55,-.55,'#357c98',5.4);label(facade,'原图右侧外窗 · L型采光面',20.0,2.1,6.7,'#357c98',4.7);

// Original floor and recessed entry, visible in the final camera turn.
const existingOnly = new THREE.Group();
existingOnly.name = 'original-floor-and-entry';
existingOnly.visible = false;
fieldFrame.add(existingOnly);
const rawFloor = new THREE.Mesh(fg, mat('#a7a59e'));
rawFloor.position.y = lowerFinish-.16;
rawFloor.receiveShadow = true;
existingOnly.add(rawFloor);
const doorwayWall = mat('#acafa9');
const oldDoorFinish = mat('#717979');
box(existingOnly, 9.15, lowerFinish+2.25, 10.62, 1.55, roofUnderside-lowerFinish-2.25, .08, doorwayWall);
box(existingOnly, 9.15, lowerFinish, 10.62, .23, 2.25, .08, doorwayWall);
box(existingOnly, 10.47, lowerFinish, 10.62, .23, 2.25, .08, doorwayWall);
const doorHinge = new THREE.Group();
doorHinge.position.set(9.38, lowerFinish, 10.63);
doorHinge.rotation.y = Math.PI * .35;
existingOnly.add(doorHinge);
box(doorHinge, 0, .01, 0, 1.08, 2.23, .04, oldDoorFinish);
// Exterior apron deliberately uses a cool blue-grey, distinct from the warm light-grey self-leveling interior.
const pad=box(model,-2,-.4,-2,23.5,.2,15,'#bcced4');pad.receiveShadow=true;
const levelStudy=new THREE.Group();
model.add(levelStudy);
levelStudy.visible=false;
const storeyGap=verified.height.floor18_level_m-verified.height.floor17_level_m;
const wastewater=makeWastewater({THREE,box,datum:MEZZANINE,storeyGap,wet,wetWalls});
model.add(wastewater.group);wastewater.group.visible=false;
const wasteTags=[
 label(wastewater.group,'18 楼 · 卫浴垫高 100 mm',12.8,MEZZANINE.wetFloorFinish+.24,6.4,'#216a6c',2.45),
 label(wastewater.group,'17 楼顶内 · 废水接点待核',wastewater.joinX,wastewater.endY-.40,wastewater.joinZ,'#157367',2.85),
 label(wastewater.group,'17 楼地面投影',11.8,wastewater.floor17+.16,8.3,'#617079',2.25)
];
const floor17=buildFloorComparison({THREE,box,openOutline:sidePolys[0],storeyHeight:storeyGap,columnXs:[8.90],upperSlabUnderside:storeyGap-.16});
floor17.position.y=lowerFinish-storeyGap;
levelStudy.add(floor17);
const floorNotes=[
 label(levelStudy,'18楼  +72.190 m',2.60,lowerFinish+.26,8.29,'#26475c',3.55),
 label(levelStudy,'17楼  +67.990 m',2.60,floor17.position.y+.26,8.29,'#26475c',3.55)
];
const drainMarkers=new THREE.Group();
levelStudy.add(drainMarkers);
// The DXF circle is a plan location. A ring identifies it without assuming a vertical pipe route.
const rainAt={x:8.75,z:9.475};
const rainRing=new THREE.Mesh(new THREE.RingGeometry(.12,.22,32),new THREE.MeshBasicMaterial({color:'#00877d',side:THREE.DoubleSide,depthTest:false}));
rainRing.rotation.x=-Math.PI/2;rainRing.position.set(rainAt.x,lowerFinish+.03,rainAt.z);rainRing.renderOrder=95;
drainMarkers.add(rainRing);
line(drainMarkers,[[rainAt.x,lowerFinish+.03,rainAt.z],[rainAt.x,.85,rainAt.z],[rainAt.x-.8,.85,rainAt.z+.5]],'#00877d');
floorNotes.push(label(drainMarkers,'18楼 · 雨水立管',rainAt.x-1.25,1.02,rainAt.z+.72,'#00766f',3.05));
const supportStudy=setupSupportStudy({model,ground,box,label,mat,trainingMat,supportHeight:upperDeckUnderside});
let mode='all';function setMode(m){mode=m;supportStudy.update(m);ground.visible=m!=='upper';upper.visible=m!=='ground';stairs.visible=m==='all'||m==='ground';shell.visible=m==='all'||m==='ground';fieldFrame.visible=m==='all'||m==='ground';structure.visible=$('#frame').checked&&m==='all';labelGroup.visible=m==='all';upper.position.y=m==='split'?levelHeight+4:levelHeight;if(m==='upper')upper.position.y=0;const text={all:'整体 · 两层关系',ground:'一楼 · 左老板私用 / 中下沉通道 / 右办公会议',upper:'二楼 · 电脑 / 茶桌 / 开放预留区',split:'拆层展示 · 二层临时上移4米，非实际高度'};$('#modeLabel').textContent=text[m];document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));updateCircuitLayer();controls.target.set(9.7,m==='split'?4:m==='all'?2.5:0,-4.8);controls.update()}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{setMode(b.dataset.mode);upperOriginalColumn.visible=mode==='upper'||mode==='split';reset()});$('#labels').onchange=e=>labels.forEach(s=>s.visible=s.parent===labelGroup||e.target.checked);$('#frame').onchange=()=>setMode(mode);$('#spin').onchange=e=>controls.autoRotate=e.target.checked;$('#daylight').onchange=e=>facade.visible=e.target.checked&&mode!=='upper';
function selectSocket(meta){if(selectedSocket)selectedSocket.rim.material.color.copy(selectedSocket.baseColor);selectedSocket=meta||null;if(selectedSocket)selectedSocket.rim.material.color.set('#137bb3');$('#socketPicked').textContent=selectedSocket?`${selectedSocket.id} · ${selectedSocket.floor} ${selectedSocket.circuit} · 五孔（两孔＋三孔）`:'未选择插座';$('#removeSocket').disabled=!selectedSocket}
function updateCircuitLayer(){const show=$('#circuitLayer').checked;circuitGround.visible=show&&mode!=='upper';circuitUpper.visible=show&&mode!=='ground';windowLighting.circuit.visible=show;for(const tag of lampTags)tag.visible=show;$('#socketTools').hidden=!show;if(!show)selectSocket(null);renderer.domElement.dataset.circuitLayerVisible=String(show)}
$('#circuitLayer').onchange=updateCircuitLayer;
$('#removeSocket').onclick=()=>{if(!selectedSocket)return;selectedSocket.root.visible=false;for(const lead of circuitDropLines)if(lead.root===selectedSocket.root)lead.segment.visible=false;selectSocket(null)};
let boardMode='',wetChildSnapshot=null,siteReturnView=null;
function markBoard(id,on){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on))}
function restoreFullBoard(){
 if(boardMode==='water'){wastewater.group.visible=false;pad.visible=true;$('#waterInfo').hidden=true;markBoard('#waterBoard',false);closeSpacePlan();}
 if(boardMode==='air'){airLabels.visible=false;upperSlab.material=originalSlabFinish;$('#airInfo').hidden=true;markBoard('#airBoard',false);}
 applyLightFilter('all');$('#lightFilters').hidden=true;
 showerDimension.visible=false;
 upperSlab.visible=true;$('#focusLights').setAttribute('aria-pressed','false');
 if(boardMode==='steel'){
  steelDatumReference.visible=false;$('#steelDatumTools').hidden=true;
 }
 if(boardMode==='floorstack'){
  levelStudy.visible=false;pad.visible=true;$('#floorStackInfo').hidden=true;markBoard('#floorStackBoard',false);
 }
 if(boardMode==='wet'&&wetChildSnapshot){for(const [child,visible] of wetChildSnapshot)child.visible=visible;wetChildSnapshot=null}
 if(boardMode==='furniture'){$('#furniture').checked=false;updateFurniture()}
 if(boardMode==='circuit'){$('#circuitLayer').checked=false;updateCircuitLayer();wet.visible=true;wetFloor.visible=true;stairs.visible=true;stairStorage.visible=true;openingRails.visible=true}
 if(boardMode==='siteframe'){
  existingOnly.visible=false;
  useInteriorFinish(false);
  camera.fov=43;camera.updateProjectionMatrix();
  $('#siteLegend').hidden=true;
  controls.maxPolarAngle=Math.PI*.49;
 }
 boardMode='';clearFurnitureSelection();setMode('all');upperOriginalColumn.visible=false;facade.visible=$('#daylight').checked;fieldFrame.visible=true;structure.visible=$('#frame').checked;supportStudy.update('all');markBoard('#circuitBoard',false);markBoard('#steelBoard',false);markBoard('#wetBoard',false);markBoard('#furnitureBoard',false);markBoard('#siteFrameBoard',false)
 if(siteReturnView){
  camera.position.copy(siteReturnView.eye);controls.target.copy(siteReturnView.target);
  viewportFit=siteReturnView.fit;siteReturnView=null;controls.update();
 }
}
function showSteelBoard(){
 if(boardMode==='steel'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 boardMode='steel';ground.visible=false;upper.visible=false;stairs.visible=true;shell.visible=false;fieldFrame.visible=false;structure.visible=true;labelGroup.visible=false;facade.visible=false;upperOriginalColumn.visible=false;supportStudy.reserve.visible=false;
 $('#steelDatumTools').hidden=false;markBoard('#steelBoard',true);
 showSteelOverview();
}
function showSteelOverview(){
 ground.visible=false;upper.visible=false;setStairInspection(false);
 steelDatumReference.visible=false;
 camera.position.set(26,17,-22);controls.target.set(15,2.6,-4.8);viewportFit=1;fitViewport();
}
function showSteelDatum(){
 if(boardMode!=='steel')showSteelBoard();
 ground.visible=false;upper.visible=false;setStairInspection(false);
 steelDatumReference.visible=true;
 controls.target.set(14.6,upperDeckUnderside,-1.65);
 camera.position.set(11.0,6.15,-6.80);viewportFit=1;fitViewport();
}
$('#steelOverall').onclick=showSteelOverview;
$('#steelDatumView').onclick=showSteelDatum;
function setStairInspection(active){
 showerDimension.visible=active;showerDimTag.visible=active;
 $('#stairFlightsInfo').hidden=!active;
 $('#steelViewTitle').textContent=active?'淋浴间与两跑楼梯':'原窗腰梁上沿与夹层钢梁顶齐平';
 $('#steelViewLevels').hidden=active;
}
function showStairClearance(){
 if(boardMode!=='steel')showSteelBoard();
 steelDatumReference.visible=false;ground.visible=true;upper.visible=true;
 const info=$('#stairFlightsInfo');
 info.textContent='下跑 '+MEZZANINE.lowerRisers+' 级，上跑 '+MEZZANINE.upperRisers+' 级。每级高 '+(MEZZANINE.riser*1000).toFixed(1)+' 毫米，深 '+Math.round(MEZZANINE.going*1000)+' 毫米。';
 setStairInspection(true);
 camera.position.set(14.8,4.35,-18);controls.target.set(14.4,2.58,-7.4);viewportFit=1;fitViewport();
}
$('#steelStairs').onclick=showStairClearance;
function showWetBoard(){
 if(boardMode==='wet'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();boardMode='wet';wetChildSnapshot=new Map([...ground.children].map(child=>[child,child.visible]));setMode('ground');
 for(const child of ground.children)child.visible=child===wet||groundFloorMeshes.includes(child);upper.visible=false;stairs.visible=false;shell.visible=false;fieldFrame.visible=false;structure.visible=false;labelGroup.visible=false;facade.visible=false;upperOriginalColumn.visible=false;supportStudy.reserve.visible=false;
 camera.position.set(22,5.5,-12);controls.target.set(11.85,1.2,-7.7);controls.update();markBoard('#wetBoard',true)
}
function showCircuitBoard(){
 if(boardMode==='circuit'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 boardMode='circuit';closeSpacePlan();setMode('all');upperOriginalColumn.visible=false;
 $('#furniture').checked=false;updateFurniture();$('#labels').checked=false;labels.forEach(q=>q.visible=false);$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#circuitLayer').checked=true;updateCircuitLayer();
 // Circuit version keeps only architecture, outlet symbols and routes: no steel, stair, shower or glass enclosure.
 structure.visible=false;stairs.visible=false;stairStorage.visible=false;openingRails.visible=false;wet.visible=false;wetFloor.visible=false;fieldFrame.visible=false;supportStudy.reserve.visible=false;$('#daylight').checked=true;facade.visible=true;
 camera.position.set(25,20,-24);controls.target.set(9.7,2.5,-4.8);viewportFit=1;fitViewport();controls.update();$('#modeLabel').textContent='电路参考 · AL1 总箱安装在进门右侧实体墙，箱底下引至墙脚';markBoard('#circuitBoard',true)
}
function showFurnitureBoard(){
 if(boardMode==='furniture'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();boardMode='furniture';closeSpacePlan();setMode('all');upperOriginalColumn.visible=true;
 $('#furniture').checked=true;updateFurniture();$('#labels').checked=false;labels.forEach(q=>q.visible=!!q.userData.furniture);$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));
 structure.visible=false;supportStudy.reserve.visible=false;camera.position.set(25,20,-24);controls.target.set(15.3,2.8,-4.7);viewportFit=1;fitViewport();controls.update();$('#modeLabel').textContent='家具参考 · 点选后可拖动 / 微调 / 缩放（第一版）';updateFurnitureEditor();markBoard('#furnitureBoard',true)
}
const originalInteriorFinish=mat('#a5a39e');
function useInteriorFinish(on){
 insideSite=on;
 for(const wall of shell.children){
  if(wall.material===semiWallMat||wall.material===originalInteriorFinish)wall.material=on?originalInteriorFinish:semiWallMat;
 }
}
function siteView(eye, target, overview=false){
 useInteriorFinish(!overview);
 controls.target.set(...target);
 camera.position.set(...eye);
 viewportFit=1;
 fitViewport();
 controls.update();
}
$('#siteOverview').onclick=()=>siteView([25,17,-25],[9.7,3.4,-4.8],true);
$('#siteWindows').onclick=()=>siteView([9.65,1.85,-7.05],[18.30,4.05,-1.25]);
$('#siteOutlet').onclick=()=>siteView([14.50,2.00,-3.00],[2.50,3.40,-6.80]);
function showSiteFrameBoard(){
 if(boardMode==='siteframe'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 boardMode='siteframe';closeSpacePlan();setMode('all');
 $('#furniture').checked=false;updateFurniture();$('#circuitLayer').checked=false;updateCircuitLayer();$('#labels').checked=false;labels.forEach(q=>q.visible=false);$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));
 ground.visible=false;upper.visible=false;stairs.visible=false;structure.visible=false;labelGroup.visible=false;
 shell.visible=true;fieldFrame.visible=true;existingOnly.visible=true;facade.visible=true;supportStudy.reserve.visible=false;
 $('#siteLegend').hidden=false;
 controls.maxPolarAngle=Math.PI*.83;
 $('#siteOverview').click();
 $('#modeLabel').textContent='现场框架';markBoard('#siteFrameBoard',true)
}
$('#dimensionBoard').onclick=()=>{if(boardMode)restoreFullBoard();const on=!$('#dimensionBoard').classList.contains('active');$('#allDimensions').checked=on;$('#dimensions').checked=on;$('#allDimensions').dispatchEvent(new Event('change'));$('#dimensions').dispatchEvent(new Event('change'));markBoard('#dimensionBoard',on)};
$('#circuitBoard').onclick=showCircuitBoard;
function focusWindowLights(){
 const focus=$('#focusLights').getAttribute('aria-pressed')!=='true';
 $('#focusLights').setAttribute('aria-pressed',String(focus));
 upperSlab.visible=!focus;
 $('#lightFilters').hidden=!focus;
 applyLightFilter('all');
 if(focus){camera.position.set(4.8,14.0,-23);controls.target.set(9.3,4.58,-4.6);}
 else {camera.position.set(25,20,-24);controls.target.set(9.7,2.5,-4.8);}
 viewportFit=1;fitViewport();
}
function applyLightFilter(which){
 for(const id of Object.keys(windowLighting.fixtureGroups)){
  const visible=which==='all'||id===which;
  windowLighting.fixtureGroups[id].visible=visible;windowLighting.circuitGroups[id].visible=visible;
 }
 circuitBelt.visible=which==='all'||which==='WL1';
 for(const b of document.querySelectorAll('[data-light]')){
  b.setAttribute('aria-pressed',String(b.dataset.light===which));
 }
}
for(const b of document.querySelectorAll('[data-light]'))b.onclick=()=>applyLightFilter(b.dataset.light);
$('#focusLights').onclick=focusWindowLights;
$('#openGroundElectric').onclick=()=>$('#electricalGround').click();
$('#openUpperElectric').onclick=()=>$('#electricalUpper').click();
function stackView(drain=false){
 if(drain){camera.position.set(10.55,6.45,-17.8);controls.target.set(8.9,.15,-8.35);}
 else {camera.position.set(17.5,8.5,-29);controls.target.set(9.5,1.75,-4.8);}
 viewportFit=1;fitViewport();
}
function showFloorStack(){
 if(boardMode==='floorstack'){restoreFullBoard();return;}
 if(boardMode)restoreFullBoard();
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 closeSpacePlan();boardMode='floorstack';setMode('all');
 pad.visible=false;levelStudy.visible=true;labelGroup.visible=false;
 $('#labels').checked=false;labels.forEach(q=>q.visible=false);
 floorNotes.forEach(note=>note.visible=true);
 $('#floorStackInfo').hidden=false;markBoard('#floorStackBoard',true);stackView();
}
$('#floorStackBoard').onclick=showFloorStack;
$('#levelsOverview').onclick=()=>stackView();
$('#levelsDrain').onclick=()=>stackView(true);
function startServiceView(kind,button){
 if(boardMode===kind){restoreFullBoard();return false;}
 if(boardMode)restoreFullBoard();
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 closeSpacePlan();boardMode=kind;setMode('all');markBoard(button,true);
 labelGroup.visible=false;$('#labels').checked=false;labels.forEach(tag=>tag.visible=false);
 return true;
}
function airView(which){
 const views={all:[[6.2,3.2,13.7],[9.75,5.15,-4.0]],cassette:[[6.6,4.85,-11.4],[15.88,5.85,-3.8]],duct:[[8.85,4.2,-.05],[4.5,6.1,-6.6]]};
 const [eye,target]=views[which];camera.position.set(...eye);controls.target.set(...target);viewportFit=1;fitViewport();
 airTags.forEach((tag,i)=>tag.visible=which==='all'||(which==='cassette'?i<2:i>=2));
}
function showAirLayout(){
 if(!startServiceView('air','#airBoard'))return;
 upperSlab.material=airSlabFinish;airLabels.visible=true;fieldFrame.visible=true;
 $('#airInfo').hidden=false;airView('all');
}
$('#airBoard').onclick=showAirLayout;
$('#airOverall').onclick=()=>airView('all');$('#airCassettes').onclick=()=>airView('cassette');$('#airOutlets').onclick=()=>airView('duct');
function showWastewater(openSheet=true){
 if(!startServiceView('water','#waterBoard'))return;
 ground.visible=upper.visible=stairs.visible=structure.visible=fieldFrame.visible=shell.visible=facade.visible=pad.visible=false;
 wastewater.group.visible=true;wasteTags.forEach(t=>t.visible=true);$('#waterInfo').hidden=false;
 camera.position.set(22.4,3.9,-8.3);controls.target.set(11.8,-.7,-7.7);viewportFit=1;fitViewport();
 if(openSheet)$('#openWaterSheet').click();
}
$('#waterBoard').onclick=()=>showWastewater();
$('#openWaterSheet').onclick=()=>showFlatPlan('1801_淋浴废水排水图.svg','水路参考 · 18 楼废水排至 17 楼');
$('#steelBoard').onclick=showSteelBoard;$('#wetBoard').onclick=showWetBoard;$('#furnitureBoard').onclick=showFurnitureBoard;$('#siteFrameBoard').onclick=showSiteFrameBoard;
function reset(){pad.visible=mode!=='upper';facade.visible=$('#daylight').checked&&mode!=='upper';camera.up.set(0,1,0);camera.position.set(25,20,-24);if(mode==='split')camera.position.set(26,25,-28);controls.target.set(9.7,mode==='split'?4:mode==='upper'||mode==='ground'?0:2.5,-4.8);if(mode==='upper'){camera.position.set(26,15,-18);controls.target.set(15,1,-4.4)}controls.update()}$('#reset').onclick=reset;$('#supportView').onclick=()=>{$('#supportReserve').checked=true;$('#frame').checked=true;setMode('ground');reset();structure.visible=true;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#daylight').checked=false;facade.visible=false;$('#labels').checked=true;labels.forEach(s=>s.visible=supportStudy.labels.includes(s)||s.userData.labelText==='原入口');camera.position.set(26,15,-17);controls.target.set(15,1.2,-4.7);controls.update();$('#modeLabel').textContent='沿楼梯外侧候选柱位＋低柜 · 仅空间预留，未做承载验算';};$('#restFocus').onclick=()=>{setMode('upper');reset();upperOriginalColumn.visible=true;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#labels').checked=true;labels.forEach(q=>q.visible=q.userData.labelText.includes('并入主办公区')||q.userData.labelText.includes('出口贴墙'));camera.position.set(24,15,-15);controls.target.set(15.2,.4,-5.0);controls.update();};$('#stairView').onclick=()=>{setMode('ground');reset();$('#labels').checked=true;labels.forEach(s=>s.visible=s.parent===stairs||s.userData.labelText==='原入口');$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));camera.position.set(16,21,-7.599);controls.target.set(16,0,-7.6);controls.update()};$('#bossFocus').onclick=()=>{$('#labels').checked=false;labels.forEach(s=>s.visible=s.parent===labelGroup);$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#daylight').checked=false;setMode('all');upperOriginalColumn.visible=false;reset();camera.position.set(29,18,-20);controls.target.set(15,3,-4.7);controls.update()};$('#heightView').onclick=()=>{$('#labels').checked=false;labels.forEach(s=>s.visible=s.parent===labelGroup);$('#daylight').checked=false;facade.visible=false;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));camera.position.set(34,6,-4);controls.target.set(14.7,4.2,-4);controls.update()};$('#entryView').onclick=()=>{camera.position.set(9.925,12,-21);controls.target.set(9.925,1.5,-3);controls.update()};$('#top').onclick=()=>{const cx=mode==='upper'?15.05:9.7;camera.position.set(cx,mode==='upper'?18:24,-4.799);controls.target.set(cx,0,-4.8);controls.update()};$('#zoomIn').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(.8).add(controls.target);controls.update()};$('#zoomOut').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(1.25).add(controls.target);controls.update()};function fullView(on){$('#viewer').classList.toggle('expanded',on);document.body.style.overflow=on?'hidden':'';$('#full').textContent=on?'退出全屏':'全屏'}$('#full').onclick=()=>fullView(!$('#viewer').classList.contains('expanded'));window.addEventListener('keydown',e=>{if(e.key==='Escape')fullView(false)});
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start;
const furnitureOutline=new THREE.BoxHelper(new THREE.Object3D(),0x1b8eb7);furnitureOutline.visible=false;scene.add(furnitureOutline);
const furniturePlane=new THREE.Plane(new THREE.Vector3(0,1,0),-levelHeight);
let selectedFurniture=null,furnitureDrag=null;
function pointerRay(event){const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera)}
function furnitureOwner(object){let current=object;while(current&&current!==upper){if(current.userData?.furnitureMovable)return current;current=current.parent}return null}
function furnitureAt(event){if(boardMode!=='furniture')return null;pointerRay(event);return furnitureOwner(ray.intersectObjects(furnitureMovables.filter(o=>o.visible),true)[0]?.object)}
function updateFurnitureEditor(){const editor=$('#furnitureEditor');const on=boardMode==='furniture';editor.hidden=!on;renderer.domElement.style.cursor=on?'grab':'';$('#furniturePicked').textContent=selectedFurniture?'已选：'+selectedFurniture.userData.furnitureMovable.name+'（可拖动 / 缩放）':'点选二楼的桌、椅或小沙发';furnitureOutline.visible=!!selectedFurniture&&on}
function selectFurniture(object){selectedFurniture=object||null;updateFurnitureEditor()}
function clearFurnitureSelection(){selectedFurniture=null;furnitureDrag=null;furnitureOutline.visible=false;controls.enabled=true;updateFurnitureEditor()}
function updateFurnitureOutline(){if(selectedFurniture&&boardMode==='furniture'){furnitureOutline.setFromObject(selectedFurniture);furnitureOutline.visible=true}else furnitureOutline.visible=false}
function nudgeFurniture(dx,dz){if(!selectedFurniture)return;selectedFurniture.position.x+=dx;selectedFurniture.position.z+=dz;saveFurnitureLayout();updateFurnitureAnchoredNotes()}
function scaleFurniture(step){if(!selectedFurniture)return;const size=THREE.MathUtils.clamp(selectedFurniture.scale.x+step,.55,1.8);selectedFurniture.scale.setScalar(size);saveFurnitureLayout()}
function rotateFurniture(step){if(!selectedFurniture)return;selectedFurniture.rotation.y+=step;saveFurnitureLayout()}
$('#furnitureUp').onclick=()=>nudgeFurniture(0,-.15);$('#furnitureDown').onclick=()=>nudgeFurniture(0,.15);$('#furnitureLeft').onclick=()=>nudgeFurniture(-.15,0);$('#furnitureRight').onclick=()=>nudgeFurniture(.15,0);$('#furnitureSmaller').onclick=()=>scaleFurniture(-.08);$('#furnitureLarger').onclick=()=>scaleFurniture(.08);$('#furnitureTurnLeft').onclick=()=>rotateFurniture(Math.PI/12);$('#furnitureTurnRight').onclick=()=>rotateFurniture(-Math.PI/12);$('#furnitureReset').onclick=()=>{resetFurnitureLayout();updateFurnitureAnchoredNotes();clearFurnitureSelection()};
$('#furnitureDeselect').onclick=clearFurnitureSelection;
renderer.domElement.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];if(e.button!==0||boardMode!=='furniture'||measurement.isActive())return;const object=furnitureAt(e);if(!object)return;selectFurniture(object);const world=new THREE.Vector3();if(!ray.ray.intersectPlane(furniturePlane,world))return;const local=upper.worldToLocal(world.clone());furnitureDrag={pointerId:e.pointerId,object,start:local,origin:object.position.clone()};controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';e.preventDefault()});
renderer.domElement.addEventListener('pointermove',e=>{if(!furnitureDrag||furnitureDrag.pointerId!==e.pointerId)return;pointerRay(e);const world=new THREE.Vector3();if(!ray.ray.intersectPlane(furniturePlane,world))return;const local=upper.worldToLocal(world.clone()),d=local.clone().sub(furnitureDrag.start);furnitureDrag.object.position.x=furnitureDrag.origin.x+d.x;furnitureDrag.object.position.z=furnitureDrag.origin.z+d.z;updateFurnitureAnchoredNotes()});
function finishFurnitureDrag(e){if(!furnitureDrag||furnitureDrag.pointerId!==e.pointerId)return;saveFurnitureLayout();furnitureDrag=null;controls.enabled=true;renderer.domElement.style.cursor='grab'}
renderer.domElement.addEventListener('pointerup',finishFurnitureDrag);renderer.domElement.addEventListener('pointercancel',finishFurnitureDrag);
renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;if(measurement.isActive())return;const object=furnitureAt(e);if(object){selectFurniture(object);return}const socketHits=ray.intersectObjects(circuitPickables.filter(x=>x.visible&&x.parent.visible),true);if(socketHits[0]?.object.userData.socket){selectSocket(socketHits[0].object.userData.socket);return}const hits=ray.intersectObjects(pickables.filter(x=>x.visible&&x.parent.visible));if(hits[0]){const d=hits[0].object.userData;$('#selected').replaceChildren();const h=document.createElement('b'),p=document.createElement('p');h.textContent=d.name;p.textContent=d.desc;$('#selected').append(h,p)}});
const measurement=setupMeasurements({scene,camera,renderer,controls,model,ground,upper,stairs,structure,shell,facade,wet,supportReserve:supportStudy.reserve,floor,contour,groundFloorMeshes,upperFloorMeshes,getMode:()=>['siteframe','floorstack'].includes(boardMode)?boardMode:mode,fieldFrame,rawFloor,floor17,datum:MEZZANINE});
$('#connectionView').onclick=()=>{setMode('upper');reset();upperOriginalColumn.visible=true;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#labels').checked=true;labels.forEach(q=>q.visible=q.userData.labelText.includes('侧边连接楼面')||q.userData.labelText.includes('并入主办公区')||q.userData.labelText.includes('出口贴墙')||q.userData.labelText.includes('主电脑位'));camera.position.set(23,15,-13);controls.target.set(16.6,0,-5.3);controls.update();};

$('#wetFocus').onclick=()=>{setMode('ground');reset();$('#labels').checked=true;labels.forEach(q=>q.visible=q.parent===wet||q.userData.labelText==='原入口');$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));camera.position.set(22,5.5,-12);controls.target.set(11.85,1.2,-7.7);controls.update();};

const roomPlan=$('#spacePlan'),planImage=$('#spacePlanImage'),planStage=$('#planStage');
let planAngle=0,planDrag=null;
function fitFlatPlan(){
 const w=planImage.naturalWidth||1120,h=planImage.naturalHeight||1120,a=planAngle*Math.PI/180;
 const rw=Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*h,rh=Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h;
 const scale=Math.max(.01,Math.min((planStage.clientWidth-20)/rw,(planStage.clientHeight-20)/rh));
 planImage.style.width=(w*scale)+'px';planImage.style.height=(h*scale)+'px';
 planImage.style.transform=`translate(-50%,-50%) rotate(${planAngle}deg)`;
 $('#planAngle').value=String(planAngle);$('#planAngleReadout').textContent=planAngle+'°';
 planStage.dataset.angle=String(planAngle);
}
function turnFlatPlan(value){planAngle=((Math.round(value)+180)%360+360)%360-180;fitFlatPlan();}
planImage.onload=fitFlatPlan;new ResizeObserver(fitFlatPlan).observe(planStage);
$('#planLeft').onclick=()=>turnFlatPlan(planAngle-90);$('#planRight').onclick=()=>turnFlatPlan(planAngle+90);$('#planReset').onclick=()=>turnFlatPlan(0);$('#planAngle').oninput=e=>turnFlatPlan(Number(e.target.value));
function flatPointerAngle(e){const r=planStage.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI;}
planStage.addEventListener('pointerdown',e=>{if(e.button!==0)return;planDrag={pointerId:e.pointerId,start:flatPointerAngle(e),angle:planAngle};planStage.setPointerCapture(e.pointerId);});
planStage.addEventListener('pointermove',e=>{if(planDrag&&planDrag.pointerId===e.pointerId)turnFlatPlan(planDrag.angle+flatPointerAngle(e)-planDrag.start);});
function endFlatDrag(){planDrag=null;}planStage.addEventListener('pointerup',endFlatDrag);planStage.addEventListener('pointercancel',endFlatDrag);planStage.addEventListener('lostpointercapture',endFlatDrag);
function showFlatPlan(file,title){
  const versioned='./'+file+'?v=77';$('#spacePlanTitle').textContent=title;planImage.alt=title;planImage.src=versioned;$('#spacePlanOpen').href=versioned;roomPlan.hidden=false;host.classList.add('plan-open');renderer.domElement.style.visibility='hidden';turnFlatPlan(0);
}
$('#softPlanView').onclick=()=>showFlatPlan('1801_一楼左侧_软包通道示意.svg','一楼左侧 · 软包吧台 / 健身平面示意');
$('#electricalGround').onclick=()=>showFlatPlan('1801_一楼插座回路示意.svg','18 楼 · 插座与沿梁照明平面');
$('#electricalUpper').onclick=()=>showFlatPlan('1801_二楼插座回路示意.svg','18 楼夹层 · 插座与照明定位');
$('#planClose').onclick=()=>closeSpacePlan();
function closeSpacePlan(){roomPlan.hidden=true;host.classList.remove('plan-open');renderer.domElement.style.visibility='visible'}
function spaceView(level){
 setMode(level);reset();upperOriginalColumn.visible=level==='upper';
 const file=level==='ground'?'1801_一楼空间尺寸.svg':'1801_二楼空间尺寸.svg';
 showFlatPlan(file,level==='ground'?'一楼 · 空间与通道尺寸':'二楼 · 楼面与出口尺寸');
}
$('#spaceGround').onclick=()=>spaceView('ground');$('#spaceUpper').onclick=()=>spaceView('upper');$('#space3D').onclick=closeSpacePlan;
document.querySelectorAll('[data-mode],#bossFocus,#stairView,#wetFocus,#connectionView,#restFocus,#entryView,#heightView,#top,#reset,#supportView').forEach(b=>b.addEventListener('click',closeSpacePlan));
function updateFurniture(){
 windowLighting.fixtures.visible=mode!=='upper'&&!['siteframe','steel','wet','air','water'].includes(boardMode);
 airLayout.group.visible=!['siteframe','steel','wet','circuit','water','furniture'].includes(boardMode);
 const show=$('#furniture').checked;
 for(const o of furnitureObjects)o.visible=show;
 stairStorage.visible=show;
 // Legacy furniture plans are semantic records, not permanent coloured floor patches.
 for(const p of pickables)p.visible=p===corridor;
 renderer.domElement.dataset.legacyZonePatchesVisible=String(pickables.filter(p=>p!==corridor&&p.visible).length);
 for(const q of labels){if(q.userData.furniture)q.visible=show;else if(/开放办公预留区|平地运动|第一跑下|私用休闲|主电脑位|临挑空 · 茶桌|直播 \/|低柜 ·/.test(q.userData.labelText||''))q.visible=show&&$('#labels').checked}
 supportStudy.update();
  if(boardMode) supportStudy.reserve.visible=false;
 renderer.domElement.dataset.furnitureVisible=String(show);
 renderer.domElement.dataset.furnitureObjectCount=String(furnitureObjects.length);
}
$('#furniture').onchange=updateFurniture;

new ResizeObserver(()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();fitViewport();renderer.setSize(host.clientWidth,host.clientHeight)}).observe(host);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();$('#loading').remove();renderer.domElement.dataset.ready='true';Object.assign(renderer.domElement.dataset,{
 orientation:'CAD-X_to_X;CAD-Y_to_negative-Z',gymArea:'20.145',zone2Area:MEZZANINE.upperArea.toFixed(3),baseUpperArea:MEZZANINE.upperArea.toFixed(3),
 openingArea:MEZZANINE.openingArea.toFixed(3),landing:(lowerLandingX-10.75).toFixed(2),platformArea:MEZZANINE.platformArea.toFixed(3),
 upperLevel:levelHeight.toFixed(2),upperNetHeight:(roofUnderside-levelHeight).toFixed(2),lowerBeamHeight:lowerBeamHeight.toFixed(2),
 risers:String(lowerRisers+upperRisers),lowerRisers:String(lowerRisers),upperRisers:String(upperRisers),candidateColumns:'0',
 structuralVerified:'false',stairShift:'0',wetFloorFinish:wetFloorFinish.toFixed(3),wetRaise:wetLocalFloor.toFixed(3),wetHeadClearance:(MEZZANINE.wetHeadBottom-wetFloorFinish).toFixed(3),wetArea:'6.696',wetLevel:'ground-under-turning-platform',wetClearHeightTarget:'2.20',
 stairWidth:'1.50',layoutVersion:'raised-turning-platform',wetHeightConflict:String(showerOverhead.min<2.20),
 stairHeadroomCheck:(stairMinimum>=2.20&&turnClearance.min>=2&&arrivalClearance.min>=2)?'model-pass':'model-conflict',
 platformBeamClearance:turnClearance.min.toFixed(3),wetEdgeBeamClearance:wetUnderPlatformBeam.toFixed(3),
 wetOverheadClearance:showerOverhead.min.toFixed(3),stairRiser:rise.toFixed(6),stairGoing:going.toFixed(2),
 lowerFlightClearance:flightClearances[0].min.toFixed(3),upperFlightClearance:flightClearances[1].min.toFixed(3),
 upperArrivalClearance:arrivalClearance.min.toFixed(3),stairClearanceChecks:JSON.stringify({lower:flightClearances[0],upper:flightClearances[1],turn:turnClearance,arrival:arrivalClearance,wet:showerOverhead}),
 returnFlightDirection:'+X',steelTop:upperDeckUnderside.toFixed(2)
});
function animate(t){requestAnimationFrame(animate);controls.update();updateFurniture();updateFurnitureAnchoredNotes();updateFurnitureOutline();measurement.update();renderer.render(scene,camera)}animate();

function overallDimensions(){
 closeSpacePlan();setMode('all');upperOriginalColumn.visible=false;
 $('#furniture').checked=false;$('#labels').checked=false;labels.forEach(q=>q.visible=false);
 $('#dimensions').checked=true;$('#frame').checked=true;structure.visible=true;
 camera.position.set(21.94,14.56,-22.56);controls.target.set(9.7,3.2,-4.8);viewportFit=1;fitViewport();controls.update();measurement.update();
}
$('#overallDimensions').onclick=overallDimensions;

$('#toolsToggle').onclick=()=>{const on=$('#viewer').classList.toggle('tools-open');$('#toolsToggle').textContent=on?'收起设置':'更多设置';$('#toolsToggle').setAttribute('aria-expanded',String(on));};

$('#barGymView').onclick=()=>{
 closeSpacePlan();setMode('ground');upperOriginalColumn.visible=false;
 $('#labels').checked=false;labels.forEach(q=>q.visible=false);$('#dimensions').checked=true;$('#allDimensions').checked=false;
 $('#furniture').checked=false;$('#supportReserve').checked=true;supportStudy.update('ground');
 $('#daylight').checked=false;facade.visible=false;
 camera.position.set(15.0625,18,-13.5);controls.target.set(15.0625,0,-4.7);viewportFit=1;fitViewport();
 measurement.focusArea('bar-gym');
};
$('#circuitView').onclick=showCircuitBoard;
document.querySelectorAll('[data-mode],#overallDimensions,#reset').forEach(b=>b.addEventListener('click',()=>measurement.focusArea('')));
function openSharedView(){
 if(boardMode)restoreFullBoard();
 overallDimensions();
 const key=location.hash.slice(1);
 const legacyButtons={connection:'#connectionView',left:'#bossFocus',rest:'#restFocus',wet:'#wetFocus',stairs:'#stairView',supports:'#supportView','bar-gym':'#barGymView','soft-plan':'#softPlanView'};
 if(Object.hasOwn(legacyButtons,key))return $(legacyButtons[key]).click();
 if(key==='ground-space'||key==='upper-space')return spaceView(key==='upper-space'?'upper':'ground');
 if(key==='electrical-ground'||key==='electrical-upper'){showCircuitBoard();return $(key==='electrical-ground'?'#electricalGround':'#electricalUpper').click();}
 if(key==='site-frame')return showSiteFrameBoard();
 if(key==='steel-datum')return showSteelDatum();
 if(key==='stair-clearance')return showStairClearance();
 if(key==='floors-17-18')return showFloorStack();
 if(key==='site-outlet'){showSiteFrameBoard();return $('#siteOutlet').click();}
 if(key==='window-lights'){showCircuitBoard();return focusWindowLights();}
 if(key==='air-layout')return showAirLayout();
 if(key==='wastewater'||key==='wastewater-3d')return showWastewater(key==='wastewater');
 if(key==='guard-return'){
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 boardMode='guard';fieldFrame.visible=false;
 controls.target.set(13.6,4.15,-7.80);camera.position.set(8.1,14.0,-10.25);
 viewportFit=1;fitViewport();
}
 if(key==='entry-panel'){
 showCircuitBoard();controls.target.set(8.85,1.15,-7.85);camera.position.set(12.45,3.1,-3.9);
 viewportFit=1;fitViewport();
}
}
window.addEventListener('hashchange',openSharedView);
openSharedView();
