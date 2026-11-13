import * as THREE from 'three';
import {setupSupportStudy} from './support-side-bath.js?v=5-no-candidate-posts';
import {OrbitControls} from './OrbitControls.js';
import {setupMeasurements} from './measurements-height-only.js?v=15-hover-straight-dimensions';
const $=s=>document.querySelector(s), host=$('#viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#edf3f6');
const camera=new THREE.PerspectiveCamera(43,1,.1,180);camera.position.set(25,20,-24);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setSize(host.clientWidth,host.clientHeight);host.prepend(renderer.domElement);
let viewportFit=1;
function fitViewport(){const next=Math.max(1,1.4/camera.aspect);camera.position.sub(controls.target).multiplyScalar(next/viewportFit).add(controls.target);viewportFit=next;controls.update();}
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(9.7,2.5,-4.8);controls.enableDamping=true;controls.minDistance=4;controls.maxDistance=65;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=.7;
scene.add(new THREE.HemisphereLight(0xffffff,0x98a9b7,1.8));const sun=new THREE.DirectionalLight(0xfff1dc,2);sun.position.set(5,24,-12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.normalBias=.03;scene.add(sun);
const totalHeight=8.40,levelHeight=4.20,slabDepth=.28,lowerBeamHeight=levelHeight-slabDepth;
const ground=new THREE.Group(),upper=new THREE.Group(),stairs=new THREE.Group(),structure=new THREE.Group(),shell=new THREE.Group(),labelGroup=new THREE.Group();const model=new THREE.Group();model.scale.z=-1;scene.add(model);model.add(ground,upper,stairs,structure,shell,labelGroup);upper.position.y=levelHeight;
// Show the actual stair treads so the circulation route can be read directly in the 3D model.
const stairTreads=new THREE.Group();stairs.add(stairTreads);stairTreads.visible=true;
const stairShift=0;stairs.scale.x=-1;stairs.position.x=29.975;const stairStorage=new THREE.Group(),openingRails=new THREE.Group();stairStorage.scale.x=-1;stairStorage.position.x=29.975;openingRails.scale.x=-1;openingRails.position.x=29.975;ground.add(stairStorage);upper.add(openingRails);
const partitions=[],labels=[],pickables=[];const mat=(c,op=1)=>new THREE.MeshStandardMaterial({color:c,roughness:.72,transparent:op<1,opacity:op,depthWrite:op===1});const glass=mat('#89c2d4',.23),steel=mat('#333b42'),wallmat=mat('#edf0ec'),semiWallMat=mat('#c0cbc8',.28),wood=mat('#ccb18a'),white=mat('#fbfaf6'),charcoal=mat('#4c6576');
function box(g,x,y,z,w,h,d,m){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m);a.position.set(x+w/2,y+h/2,z+d/2);a.castShadow=true;a.receiveShadow=true;g.add(a);return a}
function label(g,text,x,y,z,color='#254d65',scale=4.2){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#fffffff0';ctx.beginPath();ctx.roundRect(4,8,760,112,18);ctx.fill();ctx.strokeStyle='#c6d9e4';ctx.lineWidth=3;ctx.stroke();ctx.font='bold 60px Microsoft YaHei,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;let fs=60;while(ctx.measureText(text).width>720&&fs>28){fs-=2;ctx.font='bold '+fs+'px Microsoft YaHei,sans-serif'}ctx.fillText(text,384,65);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,toneMapped:false}));s.position.set(x,y,z);s.scale.set(scale,scale/6,1);s.renderOrder=50;s.userData.labelText=text;g.add(s);labels.push(s);return s}
function zone(g,x,z,w,d,color,name,desc){const a=box(g,x,0,z,w,.004,d,color);a.userData={name,desc};pickables.push(a);return a}
function partition(g,x,z,w,d){const a=box(g,x,0,z,w,2.5,d,glass);partitions.push(a);const b=box(g,x,0,z,w,.1,d,steel);partitions.push(b);return a}
function desk(g,x,z,w=1.35,d=.65){box(g,x,.72,z,w,.055,d,white);for(const dx of [.06,w-.09])box(g,x+dx,0,z+.07,.04,.72,d-.14,steel);box(g,x+w*.4,.78,z+d*.7,.45,.32,.035,charcoal);box(g,x+w*.5,.78,z+d*.7,.04,.04,.12,steel)}
function chair(g,x,z,rot=0){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=rot;g.add(c);box(c,-.23,.43,-.23,.46,.08,.46,charcoal);box(c,-.23,.5,.19,.46,.45,.06,charcoal);box(c,-.035,.08,-.035,.07,.35,.07,steel);box(c,-.25,.05,-.025,.5,.035,.05,steel);box(c,-.025,.05,-.25,.05,.035,.5,steel)}
function plant(g,x,z){box(g,x-.17,0,z-.17,.34,.4,.34,'#eee7da');const b=new THREE.Mesh(new THREE.SphereGeometry(.36,9,8),mat('#5e9279'));b.scale.y=1.6;b.position.set(x,.8,z);g.add(b)}
function rail(g,x,z,w,d){box(g,x,0,z,w,1.08,d,glass);box(g,x,1.08,z,w,.045,d,steel)}
// Ground outline uses the same CAD vertices as the existing 1801 page, including its notches.
const verified=await fetch('./1801_专页核对数据.json').then(r=>r.json());
const contour=verified.geometry.poly.map(a=>[(a[0]+25113)/1000,(a[1]+10830)/1000]);const shape=new THREE.Shape();contour.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const fg=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false});fg.rotateX(-Math.PI/2);const floor=new THREE.Mesh(fg,mat('#d1d0c8'));floor.position.y=-.26;floor.receiveShadow=true;ground.add(floor);

// Proposed finish levels: side rooms 0.000, central passage -0.100; no structural cutting instruction.
const groundFloorMeshes=[floor],upperFloorMeshes=[];
const sidePolys=[[[3.9, 7.675], [5.15, 7.675], [9.15, 7.675], [9.15, 0.0], [0.125, 0.0], [0.125, 0.1], [0.0, 0.1], [0.0, 0.5], [0.0, 1.0], [0.0, 7.675], [0.05, 7.675], [0.25, 7.675], [0.7, 7.675], [3.9, 7.675]], [[10.8, 9.4], [18.425, 9.4], [18.425, 9.3], [18.925, 9.3], [18.925, 9.4], [19.025, 9.4], [19.425, 9.4], [19.425, 0.0], [10.7, 0.0], [10.7, 9.4], [10.8, 9.4]]];
for(const points of sidePolys){const sh=new THREE.Shape();points.forEach((p,i)=>i?sh.lineTo(p[0],-p[1]):sh.moveTo(p[0],-p[1]));sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:false});geo.rotateX(-Math.PI/2);const m=new THREE.Mesh(geo,mat('#d6d5cd'));m.position.y=-.1;m.receiveShadow=true;ground.add(m);groundFloorMeshes.push(m)}
// Extend the owner's upper floor over the former entrance-side stair band.
// Keep the CAD perimeter; proposed L-shaped opening reclaims floor above the low flight.
const upperBoundary=[[18.425, 9.4], [18.425, 9.3], [18.925, 9.3], [18.925, 9.4], [19.425, 9.4], [19.425, 0.0], [10.7, 0.0], [10.7, 7.44], [17.53, 7.44], [17.53, 9.24], [10.7, 9.24], [10.7, 9.4], [10.8, 9.4], [18.425, 9.4]];
const upperShape=new THREE.Shape();upperBoundary.forEach((p,i)=>i?upperShape.lineTo(p[0],-p[1]):upperShape.moveTo(p[0],-p[1]));upperShape.closePath();
const upperGeo=new THREE.ExtrudeGeometry(upperShape,{depth:.28,bevelEnabled:false});upperGeo.rotateX(-Math.PI/2);const upperSlab=new THREE.Mesh(upperGeo,mat('#c7c3b9'));upperSlab.position.y=-.28;upperSlab.receiveShadow=true;upper.add(upperSlab);upperFloorMeshes.push(upperSlab);
zone(ground,.1,.1,8.95,7.45,'#d6d5cd','进门右侧 · 开放办公预留区','独立矩形开放办公侧；当前不布置工位或会议桌，与老板侧分别从中央通道进入。');
const corridor=zone(ground,9.15,0,1.55,10.7,'#cbcac3','中间 · 完成面通道','原中间下沉示意取消；一楼全部统一为同一完成面，保持1.55米宽通道。');
// The former raised sides drop 100mm to meet the original central passage level.
// Restore the base slab after shifting the whole ground package, so every finished floor ends at the same plane.
ground.position.y=-.10;floor.position.y+=.10;
zone(ground,16.7,1.2,2.55,7.9,'#d6d5cd','老板侧 · 平地运动','沿窗运动和设备带的原预留范围约20.15㎡；显示候选柱位时，训练垫移至中部开放区。此范围不是净训练面积。');
zone(ground,10.85,.15,2.65,6.9,'#d6d5cd','老板侧 · 休闲茶吧','开放休闲区域，保留入口至楼梯的接近路线。');
zone(ground,10.65,5.94,6.88,3.30,'#d2d1ca','贴墙U型楼梯','单跑目标1.50m，34级分17＋17级；按总层高8.40m、单层4.20m设置，平台顶2.10m。该高度下平台底约1.80m，现有平台下卫浴需另行调整，不能按净高合格理解。');
const furnitureObjects=[];
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
zone(upper,11.89,5.94,5.64,1.50,'#bccbb7','并入主办公区 · 约8.46㎡','恢复原内侧楼面，仅撤端头补板；总层高改为8.40m、单层4.20m后，楼梯与平台净空需重新深化。');
zone(upper,10.73,5.0,1.16,2.44,'#a4c1b7','保留原侧边楼面','仅端头1.19×1.80m补板撤除，其他楼面恢复。');
label(upper,'出口贴墙 · 到达区1.50×1.50m',18.28,.55,8.45,'#966b30',3.5);
label(upper,'并入主办公区 · 约8.46㎡',15.1,.55,6.65,'#4f7379',3.7);
label(upper,'仅端头补板打开',11.85,.55,7.4,'#276d69',3.4);
const furnitureUpperStart=furnitureStart();
box(upper,11.65,.72,.95,.7,.09,2.6,wood);
for(let i=0;i<3;i++){chair(upper,11.12,1.35+i*.85,-Math.PI/2);chair(upper,12.88,1.35+i*.85,Math.PI/2)}
box(upper,11.7,.815,1.65,.6,.035,.65,'#8b6546');
for(const [x,z,r] of [[11.95,1.9,.1],[11.8,2.05,.045],[12.15,2.05,.045],[12.15,1.7,.045]]){const cup=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.09,20),mat('#e8dccb'));cup.position.set(x,.89,z);upper.add(cup)}
const pc=new THREE.Group();pc.position.set(18.1,0,1.6);pc.rotation.y=-Math.PI/2;upper.add(pc);desk(pc,0,0,2.2,.9);chair(pc,1.1,-.55,Math.PI);
box(upper,16.85,0,1.2,.3,1.1,3.2,steel);box(upper,17.2,0,4.65,.8,.85,.35,wood);
desk(upper,14.1,3.7,2,.65);chair(upper,15.1,3.1,Math.PI);
box(upper,16.3,0,3.15,.05,1.5,.05,steel);box(upper,16.18,1.5,3.05,.3,.2,.2,charcoal);
// Quiet lounge chair: movable furniture, not a partition; kept clear of the stair opening.
const lounge=new THREE.Group();lounge.position.set(17.25,0,4.35);upper.add(lounge);
box(lounge,0,.20,0,1.05,.18,.78,'#557384');box(lounge,.10,.38,.08,.85,.68,.16,'#557384');
for(const [x,z] of [[.08,.08],[.88,.08],[.08,.65],[.88,.65]])box(lounge,x,0,z,.08,.22,.08,steel);
furnitureEnd(furnitureUpperStart);
// One enclosed shower only: ordinary waterproof floor is raised 25mm above the unified first-floor finish.
const wet=new THREE.Group(),wetWalls=new THREE.Group();ground.add(wet);wet.add(wetWalls);
box(wet,10.77,.005,6.09,2.16,.025,3.10,mat('#d0cfc7'));
// The single shower head is the only fitting retained in this zone.
box(wet,12.58,1.72,6.24,.05,.43,.05,steel);box(wet,12.38,2.12,6.16,.25,.05,.20,steel);
const showerGlass=mat('#26383f',.78);
// Keep the original acrylic-glass enclosure and its stair-side glass door; no other fittings return.
box(wetWalls,10.77,.03,6.09,.06,2.25,3.10,showerGlass);box(wetWalls,10.85,.03,6.09,2.00,2.25,.06,showerGlass);box(wetWalls,10.85,.03,9.13,2.00,2.25,.06,showerGlass);
box(wetWalls,12.85,.03,6.09,.06,2.25,1.66,showerGlass);box(wetWalls,12.85,.03,8.75,.06,2.25,.44,showerGlass);const showerDoor=new THREE.Group();wetWalls.add(showerDoor);box(showerDoor,11.95,.03,7.78,.90,2.10,.035,showerGlass);for(const x of [11.95,12.825])box(showerDoor,x,.03,7.77,.025,2.10,.05,steel);for(const y of [.03,2.105])box(showerDoor,11.95,y,7.77,.90,.025,.05,steel);
const wetFloor=zone(ground,10.77,6.09,2.16,3.10,'#d0cfc7','平台下 · 纯淋浴区','外框2.16×3.10m，约6.70㎡。保留亚克力玻璃围合、进门玻璃门及一个花洒；无马桶、台盆、柜体。防水完成面较一楼统一完成面高约25mm。');wetFloor.position.y=.025;
$('#wetWalls').checked=true;wetWalls.visible=true;
$('#wetWalls').onchange=e=>{wetWalls.visible=e.target.checked};

// First flight +X on inner side; return flight -X against the solid wall.
zone(ground,17.43,6.04,1.845,1.50,'#d4c6a4','内侧楼梯起步区','平面预留约1.845×1.50m，茶吧已向室内挪开，保持无家具。');
const lowerFinish=-.10,stairRiseHeight=levelHeight-lowerFinish,rise=stairRiseHeight/34,going=.28,flightRun=4.48,stairW=1.5,midHeight=lowerFinish+stairRiseHeight/2;
for(let i=0;i<16;i++){
 const x1=12.545+i*going,x2=17.025-(i+1)*going,h1=lowerFinish+(i+1)*rise,h2=midHeight+(i+1)*rise;
  box(stairTreads,x1,h1-.1,6.04,going,.1,stairW,steel);box(stairTreads,x2,h2-.1,7.74,going,.1,stairW,steel);
 box(stairStorage,x1+.02,0,6.09,going-.04,Math.max(.03,h1-.15),1.40,'#8e928b');
}
box(stairs,17.025,midHeight-.30,6.04,2.2,.3,3.2,steel);
// Continuous finished wall assumed here; no rail on this wall-side edge.
// Translucent section rendering preserves visibility; actual wall/fire construction is not verified.
box(stairs,12.445,0,9.24,6.88,.55,.06,wallmat); // Existing solid wall shown cut away, not glazing.
for(const z of [6.015,7.565]){line(stairs,[[12.545,lowerFinish+rise+1.05,z],[17.025,midHeight+1.05,z]],'#59646a');for(let i=0;i<16;i+=2)box(stairs,12.545+i*going-.025,lowerFinish+(i+1)*rise,z-.025,.05,1.05,.05,steel)}
for(const z of [7.715]){line(stairs,[[17.025,midHeight+rise+1.05,z],[12.545,levelHeight+1.05,z]],'#59646a');for(let i=0;i<16;i+=2)box(stairs,17.025-i*going-.025,midHeight+(i+1)*rise,z-.025,.05,1.05,.05,steel)}
const midGuard=new THREE.Group();midGuard.position.y=midHeight;stairs.add(midGuard);rail(midGuard,19.25,5.99,.05,3.25);rail(midGuard,17.025,5.99,2.275,.05);
openingRails.scale.x=1;openingRails.position.x=0;
// Guardrail at the stair opening: required to protect the open edge.
rail(openingRails,10.7,7.38,6.89,.06);
rail(openingRails,17.53,7.44,.06,.30);
box(openingRails,17.43,-.15,7.74,.1,.15,1.5,steel);
// Restore the outer perimeter guard; it is not the short inner guard removed above.
rail(upper,10.7,0,.07,7.44);rail(upper,19.355,0,.07,9.4);
// User confirms this perimeter is an existing solid wall, not an open edge.
// Show a cutaway at 1.10m for inspection; this is not the actual wall height.
const existingSolidWall=new THREE.Group();upper.add(existingSolidWall);
for(const [x,w,d] of [[10.7,7.725,.13],[18.425,.5,.03],[18.925,.5,.13]])box(existingSolidWall,x,0,9.27,w,1.10,d,wallmat);
label(existingSolidWall,'原实体墙 · 剖切显示',12.1,1.35,9.33,'#687b7d',3.0);

function stairArrow(a,b,color){const from=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(from);const arrow=new THREE.ArrowHelper(delta.clone().normalize(),from,delta.length(),color,.32,.18);stairs.add(arrow)}
stairArrow([12.6,.32,6.79],[16.85,2.22,6.79],0xd28a24);stairArrow([18.125,2.22,6.79],[18.125,2.22,8.49],0xd28a24);stairArrow([16.85,2.24,8.49],[12.6,4.42,8.49],0x258b9a);
label(stairs,'第一跑内侧 · 宽目标1.50m',15.3,1.5,6.0,'#96621e',4.2);
label(stairs,'第二跑贴墙 · 二楼出口',15.3,5.70,9.0,'#287b8b',4.2);
label(stairs,'平台2.20×3.20m / 顶2.10m',18.45,2.50,7.6,'#755b3e',4.2);
// Proposed framing only; member sizes and supports require engineering.
// All temporary black vertical support posts are omitted from this layout view at the user's direction.
for(const x of [10.82,11.70])box(structure,x-.075,lowerBeamHeight,0,.15,.2,7.28,steel);
for(const x of [17.70,19.29])box(structure,x-.075,lowerBeamHeight,0,.15,.2,9.4,steel);
for(const z of [.13,7.34,9.34])box(structure,10.7,lowerBeamHeight,z-.06,8.725,.2,.12,steel);
box(structure,17.53,lowerBeamHeight,7.44,.15,.2,1.8,steel);
function line(g,points,c='#546978'){const a=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:c}));g.add(a)}
// 3D electrical overlay mirrors the two circuit drawings. Every socket is a selectable
// five-hole panel (two-pin plus three-pin). These positions were removed by the user
// in the live review and are now deliberately absent from the published layout.
const circuitGround=new THREE.Group(),circuitUpper=new THREE.Group(),circuitPickables=[],socketItems=[];ground.add(circuitGround);upper.add(circuitUpper);circuitGround.visible=false;circuitUpper.visible=false;
const circuitRed=mat('#d74638'),circuitBlue='#1683c2',circuitPurple='#7a56a4',socketFace=mat('#f7f4ea'),socketHole=mat('#273b46');
let socketSeq=0,selectedSocket=null;
const permanentlyDeletedSocketIds=new Set(['S04','S05','S06','S07','S11','S12','S13','S14','S15','S16','S17','S18','S19','S20','S21','S22','S23','S24','S25','S26','S27','S28','S29','S30','S34','S35','S36','S38','S39','S40','S41']);
function roundHole(g,x,y){const h=new THREE.Mesh(new THREE.CircleGeometry(.024,12),socketHole);h.position.set(x,y,.031);g.add(h)}
function outlet(g,x,z,side='z',color=circuitRed,circuit='C1',floor='一楼',height=.38){const o=new THREE.Group(),id=`S${String(++socketSeq).padStart(2,'0')}`,rimMaterial=color.clone();o.position.set(x,height,z);if(side==='x')o.rotation.y=Math.PI/2;g.add(o);if(permanentlyDeletedSocketIds.has(id)){g.remove(o);return null}const rim=box(o,-.215,-.145,-.035,.43,.29,.025,rimMaterial),plate=box(o,-.195,-.125,-.02,.39,.25,.05,socketFace);roundHole(o,-.055,.062);roundHole(o,.055,.062);roundHole(o,0,-.008);roundHole(o,-.068,-.074);roundHole(o,.068,-.074);const meta={id,circuit,floor,root:o,rim,plate,baseColor:rimMaterial.color.clone()};o.userData.socket=meta;plate.userData.socket=meta;circuitPickables.push(plate);socketItems.push(meta);return o}
function circuitRoute(g,points,color=circuitBlue){line(g,points.map(([x,z])=>[x,.13,z]),color)}
// 一楼 C1-C4：每条长墙的三点作为居中一组，给两端与桌位布置留出余地；入口右手墙另设两点。
for(const x of [3.00,4.60,6.20,8.40])outlet(circuitGround,x,7.53,'z',circuitRed,'C1','一楼');for(const z of [1.25,3.40,5.55])outlet(circuitGround,8.98,z,'x',circuitRed,'C1','一楼');for(const x of [3.00,4.60,6.20])outlet(circuitGround,x,.12,'z',circuitRed,'C1','一楼');
for(const [x,z,s] of [[11.1,1.0,'z'],[12.7,1.0,'z'],[13.35,4.2,'x']])outlet(circuitGround,x,z,s,circuitRed,'C2','一楼');for(const [x,z,s] of [[17.0,1.2,'z'],[18.85,2.9,'x'],[18.85,5.2,'x'],[18.85,7.5,'x'],[17.0,9.12,'z'],[14.6,9.12,'z']])outlet(circuitGround,x,z,s,circuitRed,'C3','一楼');
for(const z of [6.45,8.45])outlet(circuitGround,12.85,z,'x',mat('#8550aa'),'C4','一楼');
circuitRoute(circuitGround,[[9.92,10.15],[9.92,.55],[8.6,.55],[8.6,6.75],[.85,6.75]]);circuitRoute(circuitGround,[[9.92,.55],[17.2,.55]]);circuitRoute(circuitGround,[[11.3,5.1],[12.35,5.1],[12.35,9.11]],circuitPurple);box(circuitGround,9.63,.10,10.05,.58,.55,.12,'#224b67');
// 二楼 C5-C8：按当前 L 形夹层楼面及洞口边界布点。
for(const x of [11.2,12.8,14.4,16.0,17.6])outlet(circuitUpper,x,9.24,'z',circuitRed,'C5','二楼');outlet(circuitUpper,19.25,8.0,'x',circuitRed,'C5','二楼');for(const z of [1.2,3.0,5.0])outlet(circuitUpper,10.8,z,'x',circuitRed,'C6','二楼');for(const x of [12.8,15.0,17.2])outlet(circuitUpper,x,.12,'z',circuitRed,'C7','二楼');
for(const [x,z,s] of [[11.25,1.3,'z'],[13.7,1.3,'z'],[16.0,1.3,'z']])outlet(circuitUpper,x,z,s,circuitRed,'C7','二楼');for(const [x,z,s] of [[18.9,3.3,'x'],[18.9,5.4,'x'],[18.9,7.0,'x'],[16.2,7.25,'z'],[13.8,7.25,'z']])outlet(circuitUpper,x,z,s,circuitRed,'C8','二楼');
// 入口右手侧外墙：两点沿墙居中、等距布置；不占下沉通道边，与办公区 C1 同回路示意。
for(const z of [2.55,5.15])outlet(circuitGround,.12,z,'x',circuitRed,'C1','一楼');
// 二楼箭头所示两个外墙点：在一楼同一轴线、贴脚线位置各补一个。
for(const x of [12.8,17.2])outlet(circuitGround,x,.12,'z',circuitRed,'C3','一楼');
// 卫浴插座设在洗手干区后墙，离开淋浴喷淋范围；实际须采用带漏保防溅型并按电工深化。
outlet(circuitGround,12.35,9.11,'z',mat('#8550aa'),'C4','一楼',1.10);
circuitRoute(circuitUpper,[[18.85,.52],[18.85,7.1],[17.2,7.1],[17.2,1.6]]);circuitRoute(circuitUpper,[[18.85,7.1],[14.2,7.1],[14.2,1.7]]);box(circuitUpper,18.65,.10,.20,.58,.55,.12,'#224b67');
// Existing 500mm columns remain at the CAD positions; no implied permission to alter them.
for(const x of [8.65,18.425])box(shell,x,0,.5,.5,8.4,.5,'#8c969a');
const upperOriginalColumn=box(upper,18.425,0,.5,.5,levelHeight,.5,'#8c969a');upperOriginalColumn.visible=false;
// The exterior envelope is a square: the z=0 + x=19.425 sides stay as the L-shaped daylight face.
// Merge every collinear run before creating a wall, so a straight wall has no false dark posts or panel seams.
const solidWallSegments=[];for(let i=1;i<contour.length;i++){const a=contour[i-1],b=contour[i],entryGap=Math.abs(a[1]-10.7)<.01&&Math.abs(b[1]-10.7)<.01,daylightFace=(Math.abs(a[1])<.01&&Math.abs(b[1])<.01)||(Math.abs(a[0]-19.425)<.01&&Math.abs(b[0]-19.425)<.01);if(entryGap||daylightFace)continue;const prev=solidWallSegments.at(-1),dx=b[0]-a[0],dz=b[1]-a[1];if(prev){const px=prev.b[0]-prev.a[0],pz=prev.b[1]-prev.a[1],joined=Math.hypot(prev.b[0]-a[0],prev.b[1]-a[1])<.001,collinear=Math.abs(px*dz-pz*dx)<.001;if(joined&&collinear){prev.b=b;continue}}solidWallSegments.push({a:[...a],b:[...b]})}
for(const {a,b} of solidWallSegments){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.03)continue;const w=box(shell,-len/2,0,-.06,len,8.4,.12,semiWallMat);w.position.set((a[0]+b[0])/2,4.2,(a[1]+b[1])/2);w.rotation.y=-Math.atan2(dz,dx);w.userData.hoverDimension={a:[a[0],.08,a[1]],b:[b[0],.08,b[1]],text:len.toFixed(3)+' m'}}
const entryDoorMat=mat('#6c98a0',.36);box(ground,9.15,0,10.66,1.55,2.50,.035,entryDoorMat);for(const x of [9.15,10.70])box(ground,x-.025,0,10.655,.05,2.50,.06,steel);box(ground,9.15,2.45,10.655,1.55,.05,.06,steel);box(ground,10.40,1.10,10.61,.035,.22,.08,wood);
// A translucent dark waistline runs across the exterior side of the glass door.
// Its text uses the outward-facing plane, so it reads correctly when viewed from outside toward the room.
box(ground,9.25,1.34,10.695,1.35,.12,.018,mat('#1c3035',.58));
const doorSignCanvas=document.createElement('canvas');doorSignCanvas.width=900;doorSignCanvas.height=180;const doorSignCtx=doorSignCanvas.getContext('2d');doorSignCtx.clearRect(0,0,900,180);doorSignCtx.font='700 70px Microsoft YaHei,Segoe UI,sans-serif';doorSignCtx.textAlign='center';doorSignCtx.textBaseline='middle';doorSignCtx.fillStyle='#e4f0ed';doorSignCtx.fillText('1801-OPC空间',450,95);const doorSignTexture=new THREE.CanvasTexture(doorSignCanvas);doorSignTexture.colorSpace=THREE.SRGBColorSpace;const doorSign=new THREE.Mesh(new THREE.PlaneGeometry(.86,.085),new THREE.MeshBasicMaterial({map:doorSignTexture,transparent:true,depthTest:true,depthWrite:false,side:THREE.FrontSide}));doorSign.position.set(9.925,1.358,10.716);doorSign.renderOrder=145;ground.add(doorSign);


const furniturePlantsStart=furnitureStart();plant(ground,.5,.5);plant(upper,16.3,5.1);furnitureEnd(furniturePlantsStart);
label(ground,'右侧 · 开放办公预留区',4.5,1.4,2.5);
label(ground,'左侧老板区 · 平地运动',18,1.4,5,'#8b6343');label(ground,'第一跑下 · 储物',14.975,1,6.7,'#566368');label(ground,'私用休闲',11.9,1.4,1.8,'#677243');
label(ground,'原入口',9.925,2.9,10.7,'#176a9c');label(ground,'通道 −0.10m',9.925,.5,5,'#8e6340',3.1);
label(upper,'主电脑位 · 朝向外侧',18,1.6,2.8);label(upper,'临挑空 · 茶桌',11.9,1.5,2.2,'#677243');label(upper,'直播 / 日常办公',15,2.2,4.0,'#77558b');
label(labelGroup,'二楼层高 4.20m',20.5,6.30,5.4,'#466e82',4.2);line(labelGroup,[[20,4.20,5.4],[20,8.4,5.4]],'#708899');
label(labelGroup,'一楼层高 4.20m',20.5,2.10,5.4,'#466e82',4.2);line(labelGroup,[[20,0,5.4],[20,4.20,5.4]],'#708899');
label(stairs,'平台下模型净高约1.80m · 需调整卫浴',17.9,2.85,6.55,'#8a5c36',4.0);line(stairs,[[17.3,2.10,6.79],[17.3,3.92,6.79]],'#8a5c36');
const facade=new THREE.Group();model.add(facade);const windowMat=mat('#5b91ad',.055);
// The two exterior faces are one continuous L-shaped daylight surface, not solid walls.
const daylightSouth=box(facade,0,0,-.05,19.425,8.4,.05,windowMat),daylightRight=box(facade,19.425,0,0,.05,8.4,9.4,windowMat);daylightSouth.userData.hoverDimension={a:[0,.08,0],b:[19.425,.08,0],text:'19.425 m'};daylightRight.userData.hoverDimension={a:[19.425,.08,0],b:[19.425,.08,9.4],text:'9.400 m'};
line(facade,[[0,.65,0],[19.425,.65,0],[19.425,.65,9.4]],'#4f8eac');line(facade,[[0,8.4,0],[19.425,8.4,0],[19.425,8.4,9.4]],'#4f8eac');
label(facade,'原图下侧外窗 · L型采光面',8.0,.55,-.55,'#357c98',5.4);label(facade,'原图右侧外窗 · L型采光面',20.0,2.1,6.7,'#357c98',4.7);
// Exterior apron deliberately uses a cool blue-grey, distinct from the warm light-grey self-leveling interior.
const pad=box(model,-2,-.4,-2,23.5,.2,15,'#bcced4');pad.receiveShadow=true;
const supportStudy=setupSupportStudy({model,ground,box,label,mat,trainingMat,supportHeight:lowerBeamHeight+.2});
let mode='all';function setMode(m){mode=m;supportStudy.update(m);ground.visible=m!=='upper';upper.visible=m!=='ground';stairs.visible=m==='all'||m==='ground';shell.visible=m==='all'||m==='ground';structure.visible=$('#frame').checked&&m==='all';labelGroup.visible=m==='all';upper.position.y=m==='split'?8.20:levelHeight;if(m==='upper')upper.position.y=0;const text={all:'整体 · 两层关系',ground:'一楼 · 左老板私用 / 中下沉通道 / 右办公会议',upper:'二楼 · 电脑 / 茶桌 / 开放预留区',split:'拆层展示 · 二层临时上移4米，非实际高度'};$('#modeLabel').textContent=text[m];document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));updateCircuitLayer();controls.target.set(9.7,m==='split'?4:m==='all'?2.5:0,-4.8);controls.update()}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{setMode(b.dataset.mode);upperOriginalColumn.visible=mode==='upper'||mode==='split';reset()});$('#labels').onchange=e=>labels.forEach(s=>s.visible=s.parent===labelGroup||e.target.checked);$('#frame').onchange=()=>setMode(mode);$('#spin').onchange=e=>controls.autoRotate=e.target.checked;$('#daylight').onchange=e=>facade.visible=e.target.checked&&mode!=='upper';
function selectSocket(meta){if(selectedSocket)selectedSocket.rim.material.color.copy(selectedSocket.baseColor);selectedSocket=meta||null;if(selectedSocket)selectedSocket.rim.material.color.set('#137bb3');$('#socketPicked').textContent=selectedSocket?`${selectedSocket.id} · ${selectedSocket.floor} ${selectedSocket.circuit} · 五孔（两孔＋三孔）`:'未选择插座';$('#removeSocket').disabled=!selectedSocket}
function updateCircuitLayer(){const show=$('#circuitLayer').checked;circuitGround.visible=show&&mode!=='upper';circuitUpper.visible=show&&mode!=='ground';$('#socketTools').hidden=!show;if(!show)selectSocket(null);renderer.domElement.dataset.circuitLayerVisible=String(show)}
$('#circuitLayer').onchange=updateCircuitLayer;
$('#removeSocket').onclick=()=>{if(!selectedSocket)return;selectedSocket.root.visible=false;selectSocket(null)};
let boardMode='',wetChildSnapshot=null;
function markBoard(id,on){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on))}
function restoreFullBoard(){
 if(boardMode==='wet'&&wetChildSnapshot){for(const [child,visible] of wetChildSnapshot)child.visible=visible;wetChildSnapshot=null}
 boardMode='';setMode('all');upperOriginalColumn.visible=false;facade.visible=$('#daylight').checked;structure.visible=$('#frame').checked;supportStudy.update('all');markBoard('#steelBoard',false);markBoard('#wetBoard',false)
}
function showSteelBoard(){
 if(boardMode==='steel'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();boardMode='steel';ground.visible=false;upper.visible=false;stairs.visible=true;shell.visible=false;structure.visible=true;labelGroup.visible=false;facade.visible=false;upperOriginalColumn.visible=false;supportStudy.reserve.visible=false;
 camera.position.set(26,17,-22);controls.target.set(15,2.6,-4.8);controls.update();markBoard('#steelBoard',true)
}
function showWetBoard(){
 if(boardMode==='wet'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();boardMode='wet';wetChildSnapshot=new Map([...ground.children].map(child=>[child,child.visible]));setMode('ground');
 for(const child of ground.children)child.visible=child===wet||groundFloorMeshes.includes(child);upper.visible=false;stairs.visible=false;shell.visible=false;structure.visible=false;labelGroup.visible=false;facade.visible=false;upperOriginalColumn.visible=false;supportStudy.reserve.visible=false;
 camera.position.set(22,5.5,-12);controls.target.set(11.85,1.2,-7.7);controls.update();markBoard('#wetBoard',true)
}
$('#dimensionBoard').onclick=()=>{if(boardMode)restoreFullBoard();const on=!$('#dimensionBoard').classList.contains('active');$('#allDimensions').checked=on;$('#dimensions').checked=on;$('#allDimensions').dispatchEvent(new Event('change'));$('#dimensions').dispatchEvent(new Event('change'));markBoard('#dimensionBoard',on)};
$('#circuitBoard').onclick=()=>{if(boardMode)restoreFullBoard();const on=!$('#circuitLayer').checked;if(on)$('#circuitView').click();else{$('#circuitLayer').checked=false;updateCircuitLayer()}markBoard('#circuitBoard',on)};
$('#steelBoard').onclick=showSteelBoard;$('#wetBoard').onclick=showWetBoard;
function reset(){pad.visible=mode!=='upper';facade.visible=$('#daylight').checked&&mode!=='upper';camera.up.set(0,1,0);camera.position.set(25,20,-24);if(mode==='split')camera.position.set(26,25,-28);controls.target.set(9.7,mode==='split'?4:mode==='upper'||mode==='ground'?0:2.5,-4.8);if(mode==='upper'){camera.position.set(26,15,-18);controls.target.set(15,1,-4.4)}controls.update()}$('#reset').onclick=reset;$('#supportView').onclick=()=>{$('#supportReserve').checked=true;$('#frame').checked=true;setMode('ground');reset();structure.visible=true;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#daylight').checked=false;facade.visible=false;$('#labels').checked=true;labels.forEach(s=>s.visible=supportStudy.labels.includes(s)||s.userData.labelText==='原入口');camera.position.set(26,15,-17);controls.target.set(15,1.2,-4.7);controls.update();$('#modeLabel').textContent='沿楼梯外侧候选柱位＋低柜 · 仅空间预留，未做承载验算';};$('#restFocus').onclick=()=>{setMode('upper');reset();upperOriginalColumn.visible=true;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#labels').checked=true;labels.forEach(q=>q.visible=q.userData.labelText.includes('并入主办公区')||q.userData.labelText.includes('出口贴墙'));camera.position.set(24,15,-15);controls.target.set(15.2,.4,-5.0);controls.update();};$('#stairView').onclick=()=>{setMode('ground');reset();$('#labels').checked=true;labels.forEach(s=>s.visible=s.parent===stairs||s.userData.labelText==='原入口');$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));camera.position.set(16,21,-7.599);controls.target.set(16,0,-7.6);controls.update()};$('#bossFocus').onclick=()=>{$('#labels').checked=false;labels.forEach(s=>s.visible=s.parent===labelGroup);$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#daylight').checked=false;setMode('all');upperOriginalColumn.visible=false;reset();camera.position.set(29,18,-20);controls.target.set(15,3,-4.7);controls.update()};$('#heightView').onclick=()=>{$('#labels').checked=false;labels.forEach(s=>s.visible=s.parent===labelGroup);$('#daylight').checked=false;facade.visible=false;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));camera.position.set(34,6,-4);controls.target.set(14.7,4.2,-4);controls.update()};$('#entryView').onclick=()=>{camera.position.set(9.925,12,-21);controls.target.set(9.925,1.5,-3);controls.update()};$('#top').onclick=()=>{const cx=mode==='upper'?15.05:9.7;camera.position.set(cx,mode==='upper'?18:24,-4.799);controls.target.set(cx,0,-4.8);controls.update()};$('#zoomIn').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(.8).add(controls.target);controls.update()};$('#zoomOut').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(1.25).add(controls.target);controls.update()};function fullView(on){$('#viewer').classList.toggle('expanded',on);document.body.style.overflow=on?'hidden':'';$('#full').textContent=on?'退出全屏':'全屏'}$('#full').onclick=()=>fullView(!$('#viewer').classList.contains('expanded'));window.addEventListener('keydown',e=>{if(e.key==='Escape')fullView(false)});
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start;renderer.domElement.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;if(measurement.isActive())return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const socketHits=ray.intersectObjects(circuitPickables.filter(x=>x.visible&&x.parent.visible),true);if(socketHits[0]?.object.userData.socket){selectSocket(socketHits[0].object.userData.socket);return}const hits=ray.intersectObjects(pickables.filter(x=>x.visible&&x.parent.visible));if(hits[0]){const d=hits[0].object.userData;$('#selected').replaceChildren();const h=document.createElement('b'),p=document.createElement('p');h.textContent=d.name;p.textContent=d.desc;$('#selected').append(h,p)}});
const measurement=setupMeasurements({scene,camera,renderer,controls,model,ground,upper,stairs,structure,shell,facade,wet,supportReserve:supportStudy.reserve,floor,contour,groundFloorMeshes,upperFloorMeshes,getMode:()=>mode});
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
  const versioned='./'+file+'?v=24-cad-orientation';$('#spacePlanTitle').textContent=title;planImage.src=versioned;$('#spacePlanOpen').href=versioned;roomPlan.hidden=false;host.classList.add('plan-open');renderer.domElement.style.visibility='hidden';turnFlatPlan(0);
}
$('#softPlanView').onclick=()=>showFlatPlan('1801_一楼左侧_软包通道示意.svg','一楼左侧 · 软包吧台 / 健身平面示意');
$('#electricalGround').onclick=()=>showFlatPlan('1801_一楼插座回路示意.svg','一楼 · 插座回路示意（踏步隐藏）');
$('#electricalUpper').onclick=()=>showFlatPlan('1801_二楼插座回路示意.svg','二楼 · 插座回路示意（踏步隐藏）');
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
 const show=$('#furniture').checked;
 for(const o of furnitureObjects)o.visible=show;
 stairStorage.visible=show;
 // Legacy furniture plans are semantic records, not permanent coloured floor patches.
 for(const p of pickables)p.visible=p===corridor;
 renderer.domElement.dataset.legacyZonePatchesVisible=String(pickables.filter(p=>p!==corridor&&p.visible).length);
 for(const q of labels)if(/开放办公预留区|平地运动|第一跑下|私用休闲|主电脑位|临挑空 · 茶桌|直播 \/|低柜 ·/.test(q.userData.labelText||''))q.visible=show&&$('#labels').checked;
 supportStudy.update();
  if(boardMode) supportStudy.reserve.visible=false;
 renderer.domElement.dataset.furnitureVisible=String(show);
 renderer.domElement.dataset.furnitureObjectCount=String(furnitureObjects.length);
}
$('#furniture').onchange=updateFurniture;

new ResizeObserver(()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();fitViewport();renderer.setSize(host.clientWidth,host.clientHeight)}).observe(host);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();$('#loading').remove();renderer.domElement.dataset.ready='true';renderer.domElement.dataset.orientation='CAD-X_to_X;CAD-Y_to_negative-Z';renderer.domElement.dataset.gymArea='20.145';renderer.domElement.dataset.zone2Area='69.6710';renderer.domElement.dataset.baseUpperArea='59.261';renderer.domElement.dataset.recoveredArea='10.4100';renderer.domElement.dataset.landing='2.2';renderer.domElement.dataset.upperLevel='4.20';renderer.domElement.dataset.upperNetHeight='4.20';renderer.domElement.dataset.lowerBeamHeight='3.92';renderer.domElement.dataset.risers='34';renderer.domElement.dataset.candidateColumns='4';renderer.domElement.dataset.structuralVerified='false';renderer.domElement.dataset.stairShift='0';renderer.domElement.dataset.wetArea='6.696';renderer.domElement.dataset.wetLevel='ground-under-turning-platform';renderer.domElement.dataset.wetClearHeightTarget='2.25';renderer.domElement.dataset.stairWidth='1.50';renderer.domElement.dataset.layoutVersion='equal-4.20m-floor-heights';renderer.domElement.dataset.wetHeightConflict='true';renderer.domElement.dataset.stairHeadroomConflict='true';renderer.domElement.dataset.modeledMinimumHeadroom='1.80';renderer.domElement.dataset.headroomScope='equal-floor-height-model-before-service-runs';renderer.domElement.dataset.stairRiser='0.123529';renderer.domElement.dataset.stairGoing='0.28';renderer.domElement.dataset.firstFlightDirection='-X';renderer.domElement.dataset.returnFlightDirection='+X';if(location.hash==='#connection')$('#connectionView').click();if(location.hash==='#left')$('#bossFocus').click();if(location.hash==='#rest')$('#restFocus').click();if(location.hash==='#wet')$('#wetFocus').click();if(location.hash==='#stairs')$('#stairView').click();if(location.hash==='#supports')$('#supportView').click();function animate(t){requestAnimationFrame(animate);controls.update();updateFurniture();measurement.update();renderer.render(scene,camera)}animate();

function overallDimensions(){
 closeSpacePlan();setMode('all');upperOriginalColumn.visible=false;
 $('#furniture').checked=false;$('#labels').checked=false;labels.forEach(q=>q.visible=false);
 $('#dimensions').checked=true;$('#frame').checked=true;structure.visible=true;
 camera.position.set(21.94,14.56,-22.56);controls.target.set(9.7,3.2,-4.8);viewportFit=1;fitViewport();controls.update();measurement.update();
}
$('#overallDimensions').onclick=overallDimensions;
if(location.hash==='#ground-space'||location.hash==='#upper-space')spaceView(location.hash==='#upper-space'?'upper':'ground');else overallDimensions();

$('#toolsToggle').onclick=()=>{const on=$('#viewer').classList.toggle('tools-open');$('#toolsToggle').textContent=on?'收起设置':'更多设置';$('#toolsToggle').setAttribute('aria-expanded',String(on));};

$('#barGymView').onclick=()=>{
 closeSpacePlan();setMode('ground');upperOriginalColumn.visible=false;
 $('#labels').checked=false;labels.forEach(q=>q.visible=false);$('#dimensions').checked=true;$('#allDimensions').checked=false;
 $('#furniture').checked=false;$('#supportReserve').checked=true;supportStudy.update('ground');
 $('#daylight').checked=false;facade.visible=false;
 camera.position.set(15.0625,18,-13.5);controls.target.set(15.0625,0,-4.7);viewportFit=1;fitViewport();
 measurement.focusArea('bar-gym');
};
$('#circuitView').onclick=()=>{closeSpacePlan();setMode('all');upperOriginalColumn.visible=false;$('#furniture').checked=false;updateFurniture();$('#labels').checked=false;labels.forEach(q=>q.visible=false);$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#circuitLayer').checked=true;updateCircuitLayer();$('#daylight').checked=true;facade.visible=true;camera.position.set(25,20,-24);controls.target.set(9.7,2.5,-4.8);viewportFit=1;fitViewport();controls.update();$('#modeLabel').textContent='电路图 · 红色为插座点，蓝色为回路示意；踏步隐藏';};
document.querySelectorAll('[data-mode],#overallDimensions,#reset').forEach(b=>b.addEventListener('click',()=>measurement.focusArea('')));
if(location.hash==='#bar-gym')$('#barGymView').click();

if(location.hash==='#soft-plan')$('#softPlanView').click();
if(location.hash==='#electrical-ground')$('#electricalGround').click();
if(location.hash==='#electrical-upper')$('#electricalUpper').click();
