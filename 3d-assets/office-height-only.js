import * as THREE from 'three';
import {addSiteShell,MEZZANINE} from './site-shell.js?v=157';
import {makeWindowLighting,lightingColors} from './window-lights.js?v=157';
import {makeAirLayout} from './air-layout.js?v=120';
import {makeWastewater} from './wastewater.js?v=157';
import {addSiteServices} from './site-services.js?v=104';
import {buildFloorComparison} from './floor-comparison.js?v=74';
import {setupSupportStudy} from './support-side-bath.js?v=5-no-candidate-posts';
import {OrbitControls} from './OrbitControls.js';
import {setupMeasurements} from './measurements-height-only.js?v=157';
import {setupLook} from './look.js?v=118';
import {setupDimensions} from './dimensions.js?v=85';
import {addProjectDimensions} from './dimension-data.js?v=157';
import {FURNITURE_KIT,defaultFurnitureLayout} from './furniture-kit.js?v=125';
import {setupRoles} from './roles.js?v=153';
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
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(9.7,2.5,-4.8);controls.enableDamping=true;controls.minDistance=4;controls.maxDistance=65;controls.autoRotateSpeed=.7;
scene.add(new THREE.HemisphereLight(0xffffff,0x98a9b7,1.8));const sun=new THREE.DirectionalLight(0xfff1dc,2);sun.position.set(5,24,-12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.normalBias=.03;scene.add(sun);
const totalHeight=MEZZANINE.roomTop, levelHeight=MEZZANINE.floorFinish;
const upperDeckUnderside=MEZZANINE.steelTop, lowerBeamHeight=upperDeckUnderside-MEZZANINE.primaryDepth;
const ground=new THREE.Group(),upper=new THREE.Group(),stairs=new THREE.Group(),structure=new THREE.Group(),shell=new THREE.Group(),fieldFrame=new THREE.Group(),labelGroup=new THREE.Group();const model=new THREE.Group();model.scale.z=-1;scene.add(model);model.add(ground,upper,stairs,structure,shell,fieldFrame,labelGroup);upper.position.y=levelHeight;
// Show the actual stair treads so the circulation route can be read directly in the 3D model.
const stairTreads=new THREE.Group();stairs.add(stairTreads);stairTreads.visible=true;
const stairShift=0;const stairStorage=new THREE.Group(),openingRails=new THREE.Group();stairStorage.scale.x=-1;stairStorage.position.x=29.975;openingRails.scale.x=-1;openingRails.position.x=29.975;ground.add(stairStorage);upper.add(openingRails);
const partitions=[],labels=[],pickables=[];let sceneNotesOn=true; // the aisle and mat notes follow the dimension switch
const mat=(c,op=1)=>new THREE.MeshStandardMaterial({color:c,roughness:.72,transparent:op<1,opacity:op,depthWrite:op===1});const glass=mat('#89c2d4',.23),steel=mat('#333b42'),wallmat=mat('#edf0ec'),semiWallMat=mat('#c0cbc8',.28),wood=mat('#ccb18a'),white=mat('#fbfaf6'),charcoal=mat('#4c6576');
function box(g,x,y,z,w,h,d,m){const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m);a.position.set(x+w/2,y+h/2,z+d/2);a.castShadow=true;a.receiveShadow=true;g.add(a);return a}
const labelFont='700 52px "Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans GB",sans-serif';
function label(g,text,x,y,z,color='#254d65',scale=4.2){const probe=document.createElement('canvas').getContext('2d');probe.font=labelFont;const tw=Math.ceil(probe.measureText(text).width),c=document.createElement('canvas');c.width=tw+64;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#fffffff2';ctx.beginPath();ctx.roundRect(3,3,c.width-6,90,26);ctx.fill();ctx.strokeStyle='#1d2a3338';ctx.lineWidth=2.5;ctx.stroke();ctx.font=labelFont;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,c.width/2,50);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,toneMapped:false,sizeAttenuation:false}));s.position.set(x,y,z);const hgt=.0245*(.86+.14*Math.min(1.4,scale/4.2));s.scale.set(hgt*c.width/c.height,hgt,1);s.userData.labelAspect=c.width/c.height;s.userData.labelPx=22+3*Math.min(1.4,scale/4.2);s.renderOrder=50;s.userData.labelText=text;g.add(s);labels.push(s);return s}
function zone(g,x,z,w,d,color,name,desc){const a=box(g,x,0,z,w,.004,d,color);a.userData={name,desc,hoverIgnore:true};pickables.push(a);return a}
function partition(g,x,z,w,d){const a=box(g,x,0,z,w,2.5,d,glass);partitions.push(a);const b=box(g,x,0,z,w,.1,d,steel);partitions.push(b);return a}
function desk(g,x,z,w=1.35,d=.65){box(g,x,.72,z,w,.055,d,white);for(const dx of [.06,w-.09])box(g,x+dx,0,z+.07,.04,.72,d-.14,steel);box(g,x+w*.4,.78,z+d*.7,.45,.32,.035,charcoal);box(g,x+w*.5,.78,z+d*.7,.04,.04,.12,steel)}
function chair(g,x,z,rot=0){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=rot;g.add(c);box(c,-.23,.43,-.23,.46,.08,.46,charcoal);box(c,-.23,.5,.19,.46,.45,.06,charcoal);box(c,-.035,.08,-.035,.07,.35,.07,steel);box(c,-.25,.05,-.025,.5,.035,.05,steel);box(c,-.025,.05,-.25,.05,.035,.5,steel);return c}
function plant(g,x,z){box(g,x-.17,0,z-.17,.34,.4,.34,'#eee7da');const b=new THREE.Mesh(new THREE.SphereGeometry(.36,9,8),mat('#5e9279'));b.scale.y=1.6;b.position.set(x,.8,z);g.add(b)}
// Glass guard: equal panes of about 1.2 m (one pane if the run is short) between slim steel posts.
// Both ends and every joint get a post, so each pane is held and closed on both sides.
const railPost=.04;
function rail(g,x,z,w,d,firstGlassGap=0){
 const alongX=w>=d,long=alongX?w:d,thick=alongX?d:w,n=Math.max(1,Math.round(long/1.2)),bay=(long-railPost)/n,gt=.014;
 for(let i=0;i<=n;i++){const at=i*bay,post=alongX?box(g,x+at,0,z+(thick-railPost)/2,railPost,1.10,railPost,steel):box(g,x+(thick-railPost)/2,0,z+at,railPost,1.10,railPost,steel);post.name='guard-post'}
 for(let i=0;i<n;i++){const at=i*bay+railPost+.012,len=bay-railPost-.024,pane=alongX?box(g,x+at,.08,z+(thick-gt)/2,len,.96,gt,glass):box(g,x+(thick-gt)/2,.08,z+at,gt,.96,len,glass);pane.name='guard-glass'}
 box(g,x,1.06,z,w,.04,d,steel).name='guard-handrail'
}
// Sloped stair guards use three installable glass panels with 50mm gaps and a slim dark handrail.
// maxTop clips the glass and posts where the guard runs up beside a floor edge that has its own guard.
function slopeGlassRail(g,a,b,maxTop=Infinity){
 const h=1.05,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),n=Math.max(1,Math.round(len/1.2)),bay=len/n,gap=.035,ux=dx/len,uy=dy/len;
 for(let i=0;i<n;i++){const start=i*bay+gap,end=(i+1)*bay-gap,p0=[a[0]+ux*start,a[1]+uy*start+.08,a[2]],p1=[a[0]+ux*end,a[1]+uy*end+.08,a[2]],t0=Math.min(p0[1]+h-.12,maxTop),t1=Math.min(p1[1]+h-.12,maxTop);if(t0-p0[1]<.05&&t1-p1[1]<.05)continue;const positions=[...p0,...p1,p1[0],Math.max(t1,p1[1]),p1[2],p0[0],Math.max(t0,p0[1]),p0[2]];
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();
  const pane=new THREE.Mesh(geo,mat('#89c2d4',.30));pane.material.side=THREE.DoubleSide;pane.castShadow=true;pane.receiveShadow=true;pane.name='guard-glass';g.add(pane)}
 for(let i=0;i<=n;i++){const y0=a[1]+uy*i*bay,ph=Math.min(h,maxTop-y0);if(ph<.05)continue;const post=box(g,a[0]+ux*i*bay-railPost/2,y0,a[2]-railPost/2,railPost,ph,railPost,steel);post.name='guard-post'}
 line(g,[[a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]]],'#333b42').name='guard-handrail';
}
// A handrail with no glass: used where nothing can be fallen into (the 100 mm stair well) or where a
// taller guard beside the stair is already the barrier. Slim posts keep it clear of the stair-well columns.
function postedHandrail(g,a,b,h=.90,standing=true){
 const t0=[a[0],a[1]+h,a[2]],t1=[b[0],b[1]+h,b[2]];
 line(g,[[a[0]-.28,t0[1],a[2]],t0,t1,[b[0]+.28,t1[1],b[2]]],'#333b42').name='guard-handrail';
 const n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/1.3));
 for(let i=0;i<=n;i++){const k=i/n,x=a[0]+(b[0]-a[0])*k,y=a[1]+(b[1]-a[1])*k;
  if(standing)box(g,x-.02,y,a[2]-.02,.04,h,.04,steel).name='guard-post';
  else box(g,x-.015,y+h-.05,a[2],.03,.05,.06,steel).name='guard-post';}
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
// The floor is left open over the landing, the top of the first flight and the second flight: a notch in the outline.
const voidX=MEZZANINE.mainBeam2X,voidZ=MEZZANINE.voidFrontZ;
const upperBoundary=[[18.425,9.4],[18.425,9.3],[18.925,9.3],[18.925,9.4],[19.425,9.4],[19.425,0.0],[10.7,0.0],[10.7,voidZ],[voidX,voidZ],[voidX,MEZZANINE.openingFrontZ],[MEZZANINE.thresholdX,MEZZANINE.openingFrontZ],[MEZZANINE.thresholdX,9.4],[18.425,9.4]];
const upperShape=new THREE.Shape();upperBoundary.forEach((p,i)=>i?upperShape.lineTo(p[0],-p[1]):upperShape.moveTo(p[0],-p[1]));upperShape.closePath();
const stairOpening=MEZZANINE.opening;
// The mesh is the 140 mm poured slab; the steel is modelled separately below it.
const upperGeo=new THREE.ExtrudeGeometry(upperShape,{depth:MEZZANINE.finishThickness,bevelEnabled:false});upperGeo.rotateX(-Math.PI/2);const upperSlab=new THREE.Mesh(upperGeo,mat('#c7c3b9'));upperSlab.position.y=-MEZZANINE.finishThickness;upperSlab.receiveShadow=true;upper.add(upperSlab);upperFloorMeshes.push(upperSlab);
zone(ground,.1,.1,8.95,7.45,'#d6d5cd','进门右侧 · 开放办公预留区','独立矩形开放办公侧；当前不布置工位或会议桌，与老板侧分别从中央通道进入。');
const corridor=zone(ground,9.15,0,1.55,10.7,'#cbcac3','中间 · 完成面通道','原中间下沉示意取消；一楼全部统一为同一完成面，保持1.55米宽通道。');
// The plan datum is zero (public corridor); the continuous finished first floor is 170 mm below it.
ground.position.y=MEZZANINE.lowerFinish;
zone(ground,16.7,1.2,2.55,7.9,'#d6d5cd','老板侧 · 平地运动','沿窗运动和设备带的原预留范围约20.15㎡；显示候选柱位时，训练垫移至中部开放区。此范围不是净训练面积。');
zone(ground,10.65,MEZZANINE.platformZ0-.10,MEZZANINE.lowerStartX+.10-10.65,MEZZANINE.platformZ1-MEZZANINE.platformZ0+.10,'#d2d1ca','贴墙U型楼梯','单跑宽1.20m，共34级，第一跑'+MEZZANINE.lowerRisers+'级、第二跑'+MEZZANINE.upperRisers+'级；两跑等踏高、等踏深，出口贴墙。');
const furnitureObjects=[],furnitureMovables=[],furnitureAnchoredNotes=[];
const furnitureStorageKey='1801-layout-v3';
let furnitureSeq=0,lookRef=null;
// Pieces come from the kit and are free to move, copy, scale (whole or one side), turn by 90° and delete.
function spawnFurniture(item){const kit=FURNITURE_KIT[item.type];if(!kit)return null;const g=kit.build(),floor=item.floor==='upper'?'upper':'ground';
 g.position.set(item.x,0,item.z);g.rotation.y=(item.rot||0)*Math.PI/2;g.scale.set(item.sx||1,item.sy||1,item.sz||1);
 g.userData.furniture=true;g.userData.furnitureMovable={id:item.id||('u'+Date.now().toString(36)+(++furnitureSeq)),name:kit.name,type:item.type,floor};
 (floor==='upper'?upper:ground).add(g);furnitureMovables.push(g);furnitureObjects.push(g);
 if(lookRef)g.traverse(o=>{if(o.isMesh){lookRef.restyle(o.material);lookRef.outline(o)}});return g}
function furnitureState(){return furnitureMovables.map(o=>{const m=o.userData.furnitureMovable;return{id:m.id,type:m.type,floor:m.floor,x:+o.position.x.toFixed(3),z:+o.position.z.toFixed(3),rot:((Math.round(o.rotation.y/(Math.PI/2))%4)+4)%4,sx:+o.scale.x.toFixed(3),sy:+o.scale.y.toFixed(3),sz:+o.scale.z.toFixed(3)}})}
function saveFurnitureLayout(){try{localStorage.setItem(furnitureStorageKey,JSON.stringify(furnitureState()))}catch{}renderer.domElement.dataset.furnitureCount=String(furnitureMovables.length)}
function removeFurniture(o){const i=furnitureMovables.indexOf(o);if(i>=0)furnitureMovables.splice(i,1);const j=furnitureObjects.indexOf(o);if(j>=0)furnitureObjects.splice(j,1);o.removeFromParent()}
function loadFurniture(items){for(const o of [...furnitureMovables])removeFurniture(o);for(const item of items)spawnFurniture(item);renderer.domElement.dataset.furnitureCount=String(furnitureMovables.length)}
function restoreFurnitureLayout(){let saved=null;try{saved=JSON.parse(localStorage.getItem(furnitureStorageKey)||'null')}catch{}loadFurniture(Array.isArray(saved)&&saved.length&&saved.every(i=>FURNITURE_KIT[i.type]&&Number.isFinite(i.x)&&Number.isFinite(i.z))?saved:defaultFurnitureLayout())}
function resetFurnitureLayout(){try{localStorage.removeItem(furnitureStorageKey)}catch{}loadFurniture(defaultFurnitureLayout())}
function updateFurnitureAnchoredNotes(){for(const note of furnitureAnchoredNotes){const a=note.userData.furnitureAnchor;note.position.x=a.x+a.owner.position.x;note.position.z=a.z+a.owner.position.z}}
function furnitureStart(){return new Set([...ground.children,...upper.children])}
function furnitureEnd(previous){for(const o of [...ground.children,...upper.children])if(!previous.has(o)){o.userData.furniture=true;furnitureObjects.push(o)}}
// ---- 18F layout (owner, 2026-11-19): two aisles of the same width in two colours; tea table and bar next
// to the main aisle; the rest of the mezzanine side is a 100 mm raised boxing mat with a hanging bag.
// Finishes (owner brief 2026-11-20): epoxy self-levelling on both floors in two tones only: RAL 7035 light grey
// for the floor, RAL 7038 agate grey (one step darker) for the aisles; walls, existing columns and concrete beams RAL 9016;
// all new steel matt black RAL 9005.
const FINISH={floor18:'#cbd0cc',aisle:'#b4b8b0',floorMezz:'#cbd0cc',wall:'#f1f0ea',mat:'#3c4347'};
const finishMat=c=>{const m=mat(c);m.userData.keepLook=true;return m};
for(const m of groundFloorMeshes)m.material=finishMat(FINISH.floor18);upperSlab.material=finishMat(FINISH.floorMezz);
const aisleW=1.55, stairAisleZ=6.04-aisleW;
corridor.material=finishMat(FINISH.aisle);
const stairAisle=zone(ground,10.70,stairAisleZ,19.275-10.70,aisleW,FINISH.aisle,'楼梯过道 · 宽'+aisleW.toFixed(2)+'m','进门沿主过道前行后左转，沿此过道走到楼梯起步；与主过道同宽。');stairAisle.material.userData.keepLook=true;
const matX=14.75,matZ=.30,matW=4.45,matD=stairAisleZ-.30-matZ;
const trainingMat=box(ground,matX,0,matZ,matW,.10,matD,FINISH.mat);trainingMat.name='boxing-mat';trainingMat.material.userData.keepLook=true;
const bagGroup=new THREE.Group();bagGroup.name='hanging-bag';bagGroup.position.set(matX+matW/2,0,matZ+matD/2);ground.add(bagGroup);
const bagHang=upperDeckUnderside-MEZZANINE.joistDepth-MEZZANINE.lowerFinish, bagMid=.10+.80+.60;
const bag=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,1.20,24),mat('#8a5a44'));bag.material.userData.keepLook=true;bag.position.y=bagMid;bag.castShadow=true;bagGroup.add(bag);
box(bagGroup,-.007,bagMid+.60,-.007,.014,bagHang-bagMid-.60,.014,steel);box(bagGroup,-.10,bagHang-.012,-.10,.20,.012,.20,steel);
furnitureObjects.push(trainingMat,bagGroup);
label(ground,'主过道 '+aisleW.toFixed(2)+' m',9.925,.35,3.0,'#4a555d',3.2).userData.aisle=true;
label(ground,'楼梯过道 '+aisleW.toFixed(2)+' m',15.2,.35,stairAisleZ+aisleW/2,'#4a555d',3.2).userData.aisle=true;
label(ground,'拳击垫 '+matW.toFixed(2)+' × '+matD.toFixed(2)+' m · 垫高 0.10 · 上吊沙袋',matX+matW/2,.55,matZ+.55,'#3d5a60',3.2).userData.furniture=true;
// Upper arrival stays clear of furniture.
const arrivalZone=zone(upper,MEZZANINE.thresholdX+.10,MEZZANINE.upperFlightZ,1.50,MEZZANINE.stairWidth,'#d5c9a4','二楼 · 贴墙出口','第二跑沿实体墙折返上楼；到达区1.50×1.20m，保持无家具，通过入口侧楼面连接办公区。');arrivalZone.visible=false;
label(upper,'贴墙出口 · 上跑到达',MEZZANINE.thresholdX+.85,.55,MEZZANINE.upperFlightZ+.41,'#966b30',3.5);
// Entry strip from the door to the L-shaped wall corner (z = 7.675) is built up 170 mm, level with the
// outside datum. Pipes from the bathroom can run inside this build-up; the step down is at the corner line.
const entryRaise=box(ground,9.15,0,7.675,1.55,-MEZZANINE.lowerFinish,10.70-7.675,FINISH.aisle);entryRaise.name='entry-raised-floor';entryRaise.material.userData.keepLook=true;
label(ground,'入口垫高 '+(-MEZZANINE.lowerFinish).toFixed(2)+' · 与室外齐平',9.925,.55,9.2,'#4a555d',3.2).userData.aisle=true;
restoreFurnitureLayout();
// Ground-group elevations are relative to the finished first-floor surface.
const wet=new THREE.Group(),wetWalls=new THREE.Group();ground.add(wet);wet.add(wetWalls);
const wetFloorFinish=MEZZANINE.wetFloorFinish, wetLocalFloor=wetFloorFinish-MEZZANINE.lowerFinish;
const wetToPlate=MEZZANINE.wetToPlatformSurface;
const {head:headAt,drain:drainAt,basin:basinAt,door:wetDoorAt}=MEZZANINE.wetFixtures;
// The bathroom sits under the landing and is as wide as the two flights together.
// The door opening starts 100 mm past the stair well, under the second flight.
const PZ=MEZZANINE.platformZ0, PD=MEZZANINE.platformZ1-PZ, WZ=PZ+.05, WD=PD-.10, WZ1=WZ+WD, doorZ=MEZZANINE.upperFlightZ+.10;
box(wet,10.77,.005,WZ,2.16,wetLocalFloor-.005,WD,mat('#d0cfc7')).name='shower-finished-floor';
const headBottom=MEZZANINE.wetHeadBottom-MEZZANINE.lowerFinish;
// The cold supply rises inside the aisle-side glass at x = 10.90 (see the plumbing plan) and reaches the head.
const showerRiser=box(wet,10.86,1.05,headAt.z-.0225,.045,headBottom+.07-1.05,.045,steel);
showerRiser.name='shower-wall-riser';
const showerArm=box(wet,10.86,headBottom+.04,headAt.z-.0225,headAt.x-10.86,.03,.045,steel);
showerArm.name='shower-arm';
const showerHead=box(wet,headAt.x-.095,headBottom,headAt.z-.095,.19,.04,.19,steel);
showerHead.name='shower-head';
const showerGlass=mat('#26383f',.78),showerDoorGlass=mat('#365159',.68);
const glassHeight=wetToPlate-.015, doorFrameHeight=glassHeight;
box(wetWalls,10.77,wetLocalFloor,WZ,.06,glassHeight,WD,showerGlass);
for(const z of [WZ,WZ1-.06])box(wetWalls,10.83,wetLocalFloor,z,2.02,glassHeight,.06,showerGlass);
// The door is under the second flight, clear of the 100 mm stair well.
for(const [z,depth] of [[WZ,doorZ-WZ],[doorZ+1.0,WZ1-doorZ-1.0]])box(wetWalls,12.85,wetLocalFloor,z,.06,glassHeight,depth,showerGlass);
// The closed door fills the opening in the stair-side wall at x=12.88.
const showerDoor=new THREE.Group();showerDoor.name='shower-closed-door';wetWalls.add(showerDoor);
box(showerDoor,wetDoorAt.x-.02,wetLocalFloor+.025,wetDoorAt.z-.475,.035,doorFrameHeight-.05,.95,showerDoorGlass);
for(const z of [doorZ,doorZ+.975])box(showerDoor,12.85,wetLocalFloor,z,.055,doorFrameHeight,.025,steel);
box(showerDoor,12.85,wetLocalFloor+doorFrameHeight-.025,doorZ+.025,.055,.025,.95,steel);
box(showerDoor,12.816,wetLocalFloor+.80,doorZ+.85,.11,.42,.035,steel);
// Facing inward along −X, lower plan Z is on the left and higher Z is on the right.
box(wet,basinAt.x-basinAt.width/2,wetLocalFloor+.74,basinAt.z-basinAt.depth/2,basinAt.width,.10,basinAt.depth,white).name='shower-basin';
box(wet,basinAt.x-.035,wetLocalFloor,basinAt.z-.035,.07,.74,.07,steel).name='shower-basin-waste';
box(wet,10.88,wetLocalFloor+.84,basinAt.z-.025,.05,.15,.05,steel);
box(wet,10.93,wetLocalFloor+.965,basinAt.z-.018,.12,.025,.036,steel);
box(wet,basinAt.x-.015,wetLocalFloor+.84,basinAt.z-.015,.030,.001,.030,steel);
const grate=box(wet,drainAt.x-drainAt.width/2,wetLocalFloor,drainAt.z-drainAt.depth/2,drainAt.width,.001,drainAt.depth,steel);
grate.name='shower-floor-drain';
for(let i=0;i<5;i++)box(wet,drainAt.x-.041,wetLocalFloor+.001,drainAt.z-.039+i*.018,.082,.0008,.006,'#989d9e');
const wetFloor=zone(ground,10.77,WZ,2.16,WD,'#d0cfc7','平台下 · 淋浴区','外框2.16×'+WD.toFixed(2)+'m，含一个花洒、洗手池与封闭玻璃门。');wetFloor.position.y=wetLocalFloor-.005;
$('#wetWalls').checked=true;wetWalls.visible=true;
$('#wetWalls').onchange=e=>{wetWalls.visible=e.target.checked};

const {lowerFinish,riser:rise,going,lowerRisers,upperRisers,lowerLandingX,lowerStartX,
 upperStartX,thresholdX,midLanding:midHeight}=MEZZANINE;
const stairW=MEZZANINE.stairWidth, lowerZ=MEZZANINE.lowerFlightZ, upperZ=MEZZANINE.upperFlightZ, approachDepth=19.275-lowerStartX;
const showerDimension=new THREE.Group();
showerDimension.name='shower-dimension-at-platform-edge';
model.add(showerDimension);showerDimension.visible=false;
// The landing now runs to the back wall, so this dimension stands at its front edge.
const dimX=11.28,dimZ=PZ-.19,dimBottom=MEZZANINE.wetFloorFinish,dimTop=midHeight;
line(showerDimension,[[dimX,dimBottom,dimZ],[dimX,dimTop,dimZ]],'#b44f20');
for(const y of [dimBottom,dimTop])line(showerDimension,[[dimX-.11,y,dimZ],[dimX+.11,y,dimZ],[dimX+.11,y,PZ+.18]],'#b44f20');
const showerDimTag=label(showerDimension,'至平台面 '+(dimTop-dimBottom).toFixed(3)+' m · 未扣钢板及支撑',11.28,(dimTop+dimBottom)/2,dimZ+.03,'#944519',2.22);
zone(ground,lowerStartX,lowerZ,approachDepth,stairW,'#d4c6a4','内侧楼梯起步区','进深约'+approachDepth.toFixed(2)+'m，保留一楼进出通路。');
const flights=[
 {id:'lower',start:lowerStartX,end:lowerLandingX,direction:-1,z:lowerZ,base:lowerFinish,count:lowerRisers},
 {id:'upper',start:upperStartX,end:thresholdX,direction:1,z:upperZ,base:midHeight,count:upperRisers}
];
for(const f of flights){
 for(let i=0;i<f.count-1;i++){
  const nose=f.start+f.direction*i*going, plane=f.base+(i+1)*rise;
  const tread=box(stairTreads,Math.min(nose,nose+f.direction*going),plane-.10,f.z,going,.10,stairW,steel);
  tread.name='stair-'+f.id+'-tread-'+String(i+1).padStart(2,'0');
 }
 for(const z of [f.z+.11,f.z+stairW-.11]){
  const topAtStart=f.base-.10,topAtEnd=f.base+(f.count-1)*rise-.10;
  const verticalDepth=.25/Math.cos(Math.atan(rise/going));   // 250 x 100 rectangular-tube stringer
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
  steelProfile(stairs,'stair-'+f.id+'-stringer',profile,z-.05,.10);
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
// A surface indicates the platform position only. Plate thickness and support sections await design.
const platformMaterial=steel.clone();platformMaterial.side=THREE.DoubleSide;
const landingPlate=new THREE.Mesh(new THREE.PlaneGeometry(2.20,PD),platformMaterial);
landingPlate.rotation.x=-Math.PI/2;landingPlate.position.set((10.75+lowerLandingX)/2,midHeight,PZ+PD/2);
landingPlate.name='stair-turning-platform';stairs.add(landingPlate);
const platformObstacles=[landingPlate];
// Stair guards. The 100 mm well between the flights is filled by the two stair-well columns, so nothing
// may be built inside it: each flight keeps its guard on its own treads, clear of the column faces.
// Only the side facing the void can be fallen from, so that side gets the glass balustrade; the well side,
// where the flights are 100 mm apart, gets a handrail on slim posts.
const pitchUp=x=>midHeight+rise+(x-upperStartX)/going*rise, wellLowZ=lowerZ+stairW-.06, wellUpZ=upperZ+.04;
slopeGlassRail(stairs,[lowerStartX,lowerFinish+rise,lowerZ-.025],[lowerLandingX,midHeight,lowerZ-.025]);
postedHandrail(stairs,[lowerStartX,lowerFinish+rise,wellLowZ],[lowerLandingX,midHeight,wellLowZ]);
// Second flight: below the mezzanine edge it faces the open void and carries its own balustrade; beside the
// floor the edge guard on the mezzanine is the barrier, so the stair only needs a handrail.
slopeGlassRail(stairs,[upperStartX,pitchUp(upperStartX),wellUpZ],[voidX,pitchUp(voidX),wellUpZ]);
postedHandrail(stairs,[voidX,pitchUp(voidX),wellUpZ],[thresholdX,levelHeight,wellUpZ]);
// Back-wall side of the second flight: the flight now stands against the wall, so the handrail is fixed to
// the wall on brackets, 60 mm clear of the wall face.
const wallRailZ=MEZZANINE.backWallZ-.06;
postedHandrail(stairs,[upperStartX,pitchUp(upperStartX),wallRailZ],[thresholdX,levelHeight,wallRailZ],.90,false);
const [[openLeft,openFront],[openRight],[,openBack]]=stairOpening;
const turnWalkX=10.75;
const midGuard=new THREE.Group();midGuard.position.y=midHeight;stairs.add(midGuard);
rail(midGuard,turnWalkX-.05,PZ-.05,.05,PD+.05);
rail(midGuard,turnWalkX,PZ-.05,lowerLandingX-turnWalkX,.05);
openingRails.scale.x=1;openingRails.position.x=0;
// Guard round the open area: along the aisle side, down the main-beam edge and along the second flight.
// The arrival end stays open.
rail(openingRails,10.70,voidZ-.06,voidX-10.70,.06);
rail(openingRails,voidX-.06,voidZ-.06,.06,openFront-voidZ+.06);
rail(openingRails,voidX-.06,openFront-.06,openRight-voidX+.06,.06);

// The interior-edge guard stops where the open area starts.
rail(upper,10.7,0,.07,voidZ);
// No short cutaway wall band is shown here: it is not present in the field condition.

function stairArrow(a,b,color){const from=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(from);const arrow=new THREE.ArrowHelper(delta.clone().normalize(),from,delta.length(),color,.32,.18);stairs.add(arrow)}
stairArrow([lowerStartX-.05,lowerFinish+rise+.22,lowerZ+stairW/2],[lowerLandingX+.08,midHeight+.18,lowerZ+stairW/2],0xd28a24);
stairArrow([11.85,midHeight+.18,lowerZ+stairW/2],[11.85,midHeight+.18,upperZ+stairW/2],0xd28a24);
stairArrow([upperStartX+.04,midHeight+rise+.18,upperZ+stairW/2],[thresholdX-.05,levelHeight+.18,upperZ+stairW/2],0x258b9a);
label(stairs,'第一跑 '+lowerRisers+'级 · 宽1.20m',15.3,1.5,lowerZ,'#96621e',4.2);
label(stairs,'第二跑 '+upperRisers+'级 · 贴墙出口',15.8,levelHeight+.65,upperZ+.96,'#287b8b',4.2);
label(stairs,'转身平台顶 +'+midHeight.toFixed(3)+'m',11.75,midHeight+.45,PZ+.86,'#755b3e',3.5);
// Stop the steel at the inside faces of the two existing window beams. The top
// contact plane is shared by every steel member and the underside of the finish.
const frameBeam=mat('#27313a'),joistMat=mat('#5b6770'),columnMat=mat('#1f2830'),plateMat=mat('#8a949b');
// ---- Mezzanine steel, drawn the way it is normally built (preliminary sizes, to be verified by the engineer).
// Hot-rolled H beams as main beams and trimmers, flush-top square-tube joists at 600 mm for a light board deck,
// channel ledgers bolted to the existing concrete ledge and wall. On the glazed side the main beams are fixed
// to the existing concrete beam; on the other side they sit on columns and wall posts. All tops share one plane (+4.160) under the 40 mm floor build-up.
const windowX=MEZZANINE.beltInnerX, windowZ=MEZZANINE.beltInnerZ;
const beamH=MEZZANINE.primaryDepth, beamB=.15, steelTopY=upperDeckUnderside;
// Rolled sections are drawn with their real web / flange thickness.
// The 250 mm steel zone: the keys keep their old names, the sizes are HN250x125 and HM244x175.
const SECTIONS={HN300:{h:.250,b:.125,tw:.006,tf:.009},HM294:{h:.244,b:.175,tw:.007,tf:.011},HN200:{h:.200,b:.100,tw:.0055,tf:.008},HW125:{h:.125,b:.125,tw:.0065,tf:.009}};
function hShape({h,b,tw,tf}){const s=new THREE.Shape(),w=b/2,t=tw/2;
 [[-w,0],[w,0],[w,tf],[t,tf],[t,h-tf],[w,h-tf],[w,h],[-w,h],[-w,h-tf],[-t,h-tf],[-t,tf],[-w,tf]].forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();return s}
// One mesh per member so the headroom check can ray-test it. Members run along x or along z.
// (x1,z1)-(x2,z2) is the plan rectangle the member occupies; its width must equal the section width.
function hBeam(name,x1,z1,x2,z2,section=SECTIONS.HN300){
 const alongX=(x2-x1)>(z2-z1),len=alongX?x2-x1:z2-z1;
 const geo=new THREE.ExtrudeGeometry(hShape(section),{depth:len,bevelEnabled:false});
 if(alongX)geo.rotateY(Math.PI/2);
 const m=new THREE.Mesh(geo,frameBeam);m.name=name;m.castShadow=m.receiveShadow=true;
 m.position.set(alongX?x1:(x1+x2)/2,steelTopY-section.h,alongX?(z1+z2)/2:z1);structure.add(m);return m}
function member(name,x1,z1,x2,z2,depth,material=frameBeam){const m=box(structure,x1,steelTopY-depth,z1,x2-x1,depth,z2-z1,material);m.name=name;return m}
// Square or rectangular hollow column with a base plate; sx along x, sz along z.
function column(name,x,z,sx,top,sz=sx,bottom=lowerFinish){const c=box(structure,x,bottom,z,sx,top-bottom,sz,columnMat);c.name=name;
 box(structure,x-.05,bottom,z-.05,sx+.10,.02,sz+.10,plateMat).name=name+'-base-plate';
 return c}
const ledger=.09, ledgerH=.20, innerX=windowX-ledger, innerZ=windowZ+ledger, gap=.01;
const mb2X=MEZZANINE.mainBeam2X, mb3X=16.25, gapZ=MEZZANINE.flightGapZ, colS=.15, joistH=MEZZANINE.joistDepth, joistB=.06;
const HN=SECTIONS.HN300, HM=SECTIONS.HM294, shallow=SECTIONS.HW125, shallowH=shallow.h, soffitHN=steelTopY-HN.h, soffitHM=steelTopY-HM.h;
// Framing after the owner's sketch (2026-11-20): eight beams run from the glazed side to the back, about
// 1.09 m apart, and one cross beam runs along the stair-aisle side. On the glazed side each beam end is pinned
// to the side of the existing concrete beam through a post-installed anchor plate (no columns there); at the
// other end the beams sit on columns and wall posts. The 140 mm slab is poured on decking that spans between
// the beams, so there are no secondary joists and the slab itself ties the frame together.
const colFrontZ=innerZ, frontEnd=colFrontZ+colS, beamXs=MEZZANINE.beamXs, crossZ=voidZ-HN.b, wallZ=9.40-.12;
member('ledger-long-face',10.70+beamB,windowZ,18.425,innerZ,ledgerH);
member('ledger-short-face',innerX,1.00,windowX,9.40-.10,ledgerH);
// Where each beam stops: 1-3 at the cross beam (open area behind it), 4-6 at the trimmer beside the second
// flight, 7-8 at the back wall.
const beamEndZ=[crossZ-gap,crossZ-gap,crossZ-gap,openFront-HN.b-gap,openFront-HN.b-gap,openFront-HN.b-gap,wallZ,wallZ];
beamXs.forEach((x,i)=>{hBeam('long-beam-'+(i+1),x,windowZ,x+HN.b,beamEndZ[i]);
 box(structure,x-.05,steelTopY-HN.h-.06,windowZ-.014,HN.b+.10,HN.h+.10,.014,plateMat).name='beam-anchor-plate-'+(i+1);});
// The one cross beam: edge of the open area as far as beam 4, then a tie under the slab to the last beam.
hBeam('cross-beam',10.70,crossZ,beamXs[7]+HN.b,voidZ);
// Trimmer beside the second flight: from the stair-well column under beam 4, over the column under beam 7,
// on to the existing concrete beam at the short side, where it is anchored like the beams on the glazed side.
hBeam('opening-front',beamXs[3],openFront-HN.b,innerX,openFront);
box(structure,windowX-.014,steelTopY-HN.h-.06,openFront-HN.b-.05,.014,HN.h+.10,HN.b+.10,plateMat).name='trimmer-anchor-plate';
// Beam 8 lies against the short-side concrete beam and is fixed to it along its length, so it needs no column.
for(const z of [3.2,5.6])box(structure,windowX-.014,steelTopY-HN.h-.06,z,.014,HN.h+.10,.22,plateMat).name='beam-8-side-anchor';
// Beams 7 and 8 run on to the back wall and are only restrained there by a wall bracket.
for(const x of [beamXs[6],beamXs[7]])box(structure,x-.04,steelTopY-HN.h-.04,9.40-.12,HN.b+.08,HN.h+.08,.012,plateMat).name='beam-wall-bracket';
// Only three columns (all pinned): the corner of the open area and two in the 100 mm stair well, under
// beams 4 and 7. Everything else bears on the existing concrete beams.
column('column-edge',10.70,crossZ-.025,colS,soffitHN);
column('column-stair-well',beamXs[3]-.04,gapZ,.20,soffitHN,.10);
column('column-arrival-well',beamXs[6]-.04,gapZ,.20,soffitHN,.10);
// Landing: 100 x 50 joists at 525 mm under chequer plate, edge beams on the columns; total depth kept to 120 mm.
// Nothing hangs from the mezzanine any more: the landing stands on its own posts.
const platT=.12,platY=midHeight-platT;
for(const x of [10.80,11.33,11.87,12.40]){const f=box(stairs,x,platY+.014,PZ+.10,.05,.10,PD-.20,frameBeam);f.name='landing-joist';}
const PZ1=PZ+PD;
for(const [x1,z1,x2,z2] of [[10.75,PZ,lowerLandingX,PZ+.10],[10.75,PZ1-.10,lowerLandingX,PZ1],[lowerLandingX-.10,PZ+.10,lowerLandingX,PZ1-.10]]){
 const f=box(stairs,x1,platY,z1,x2-x1,platT-.006,z2-z1,frameBeam);f.name='landing-edge-beam';}
// Three posts: one at the stair-side front corner and two against the back wall; the fourth corner hangs on
// the aisle-side column. The 2.5 m edge beam carries both flights without a middle post.
for(const [x,z,top] of [[lowerLandingX-.12,PZ+.02,platY],[10.77,PZ1-.12,platY],[lowerLandingX-.12,PZ1-.12,platY]]){
 const post=box(stairs,x,lowerFinish,z,.10,top-lowerFinish,.10,columnMat);post.name=top>platY+.5?'landing-post-to-trimmer':'landing-post';
 box(stairs,x-.04,lowerFinish,z-.04,.18,.012,.18,plateMat).name='landing-post-base';}
box(stairs,10.85,platY,PZ,.10,platT-.006,.10,plateMat).name='landing-bracket-on-column';
function line(g,points,c='#546978'){const a=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:c}));g.add(a);return a}
// 3D electrical overlay mirrors the two circuit drawings. Every socket is a selectable
// five-hole panel (two-pin plus three-pin). These positions were removed by the user
// in the live review and are now deliberately absent from the published layout.
const circuitGround=new THREE.Group(),circuitUpper=new THREE.Group(),circuitPickables=[],socketItems=[];ground.add(circuitGround);upper.add(circuitUpper);circuitGround.visible=false;circuitUpper.visible=false;
const circuitBlue='#1683c2',circuitAmber='#c98926',circuitTeal='#187a80',circuitPurple='#7a56a4',c1Mat=mat('#1975a3'),c2Mat=mat('#c98926'),c3Mat=mat('#187a80'),c4Mat=mat('#7a56a4'),socketFace=mat('#f7f4ea'),socketHole=mat('#273b46');
let socketSeq=0,selectedSocket=null;
const permanentlyDeletedSocketIds=new Set(['S04','S05','S06','S07','S11','S12','S13','S14','S15','S16','S17','S18','S19','S20','S21','S22','S23','S24','S25','S26','S27','S28','S29','S30','S34','S35','S36','S38','S39','S40','S41']);
// Sockets are numbered in one continuous run: S01-S10 on the lower floor, S11-S14 on the mezzanine. The shower room has no socket.
const socketNumber={'S08':'S04','S09':'S05','S10':'S06','S42':'S07','S43':'S08','S44':'S09','S45':'S10','S31':'S11','S32':'S12','S33':'S13','S37':'S14'};
function roundHole(g,x,y){const h=new THREE.Mesh(new THREE.CircleGeometry(.024,12),socketHole);h.position.set(x,y,.031);g.add(h)}
function outlet(g,x,z,side='z',color=c1Mat,circuit='C1',floor='一楼',height=.38){const o=new THREE.Group(),rawId=`S${String(++socketSeq).padStart(2,'0')}`,rimMaterial=mat('#1565c0');rimMaterial.userData.keepLook=true;o.position.set(x,height,z);/* side = the direction the plate faces */o.rotation.y=({x:Math.PI/2,'-x':-Math.PI/2,z:0,'-z':Math.PI})[side]??0;g.add(o);if(permanentlyDeletedSocketIds.has(rawId)){g.remove(o);return null}const id=socketNumber[rawId]||rawId;// Standard square five-hole plate, drawn larger than life so it reads in the model: a two-pin outlet on top, a three-pin outlet below.
const rim=box(o,-.16,-.16,-.035,.32,.32,.025,rimMaterial),plate=box(o,-.14,-.14,-.02,.28,.28,.05,socketFace);const slot=(x,y,w,h,turn=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.004),socketHole);m.position.set(x,y,.032);m.rotation.z=turn;o.add(m)};slot(-.04,.07,.017,.052);slot(.04,.07,.017,.052);slot(0,-.02,.017,.048);slot(-.052,-.082,.017,.052,-.52);slot(.052,-.082,.017,.052,.52);const meta={id,circuit,floor,root:o,rim,plate,baseColor:rimMaterial.color.clone()};o.userData.socket=meta;plate.userData.socket=meta;circuitPickables.push(plate);socketItems.push(meta);return o}
// Floor box: the same five-hole plate laid flat in the floor, used where there is glass instead of a wall.
function floorOutlet(g,x,z,color,circuit,floor){const o=outlet(g,x,z,'z',color,circuit,floor,.03);if(o)o.rotation.x=-Math.PI/2;return o}
function wire(g,points,color=circuitBlue){return line(g,points,color)}
// Routing is shown at the finished-floor / skirting level, then rises only the short distance into each outlet.
// It is a layout reference only; final conduit type and protection are for the licensed electrician to confirm.
function tray(g,points,color,y=.10){wire(g,points.map(([x,z])=>[x,y,z]),color)}
const pendingDrops=[],circuitDropLines=[];
function drop(g,x,z,color,from=.10,to=.38){pendingDrops.push({g,x,z,color,from,to})}
function drawSocketDrops(){for(const lead of pendingDrops){const socket=socketItems.find(item=>item.root.parent===lead.g&&Math.abs(item.root.position.x-lead.x)<.002&&Math.abs(item.root.position.z-lead.z)<.002);if(socket){const segment=wire(lead.g,[[lead.x,lead.from,lead.z],[lead.x,lead.to,lead.z]],lead.color);circuitDropLines.push({segment,root:socket.root})}}}
// 一楼 C1-C4：每条长墙的三点作为居中一组，给两端与桌位布置留出余地；入口右手墙另设两点。
for(const x of [1.40,4.00,6.60,8.40])outlet(circuitGround,x,7.58,'-z',c1Mat,'C1','一楼');for(const z of [1.25,3.40,5.55])outlet(circuitGround,8.98,z,'x',c1Mat,'C1','一楼');for(const [x,z,side] of [[8.62,.75,'-x'],[8.90,1.03,'z'],[9.18,.75,'x']])outlet(circuitGround,x,z,side,c1Mat,'C1','一楼');
for(const [x,z,s] of [[11.1,1.0,'z'],[12.7,1.0,'z'],[13.35,4.2,'x']])outlet(circuitGround,x,z,s,c2Mat,'C2','一楼');for(const [x,z,s] of [[17.0,1.2,'z'],[18.85,2.9,'x'],[18.85,5.2,'x'],[18.85,7.5,'x'],[17.0,9.12,'z'],[14.6,9.12,'z']])outlet(circuitGround,x,z,s,c3Mat,'C3','一楼');
for(const z of [6.45,8.45])outlet(circuitGround,12.85,z,'x',c4Mat,'C4','一楼');
// 入口总电箱按红圈改至内侧墙位：箱体保持原规格，主干先贴近完成地面左转，再沿地脚线分配。
const trayY=.10,highTrayY=3.55,entryPanelX=8.25,entryWallFace=7.675-.06;
const entryPanel=box(circuitGround,entryPanelX-.29,1.15,entryWallFace-.12,.58,.72,.12,'#224b67');
entryPanel.name='entrance-wall-distribution-board';
box(circuitGround,entryPanelX-.265,1.175,entryWallFace-.127,.53,.67,.007,'#335b72');
box(circuitGround,entryPanelX+.18,1.46,entryWallFace-.14,.025,.09,.013,'#adbcc1');
const feedZ=entryWallFace-.06;
wire(circuitGround,[[entryPanelX,1.15,feedZ],[entryPanelX,trayY,feedZ],[.20,trayY,feedZ]],circuitBlue);
wire(circuitGround,[[.20,trayY,feedZ],[.20,trayY,1.10],[.20,highTrayY,1.10],[8.60,highTrayY,1.10],[8.60,.38,1.03]],circuitBlue);
// C1 · 开放办公普通插座回路（蓝）。
for(const x of [1.40,4.00,6.60])drop(circuitGround,x,7.53,circuitBlue);
for(const z of [3.15,5.40])drop(circuitGround,.12,z,circuitBlue);
// C2 · 吧台/设备预留回路（琥珀）。
// C3 · 右侧开放区回路（青绿）。
// High-level trunk: board, round the wall corner, over the entrance door head, then down the aisle side of the
// landing (outside its guard, never over the landing or the second flight, which now stand against the back
// wall) and under the mezzanine. The turn at z 6.70 stays clear of the corner column of the open area.
const trunkTurnZ=6.70, upRiseX=18.20, upRiseZ=9.30;
const trunk=[[8.25,1.87,7.60],[8.25,highTrayY,7.60],[9.24,highTrayY,7.60],[9.24,highTrayY,10.60],[10.62,highTrayY,10.60],[10.62,highTrayY,trunkTurnZ]];
wire(circuitGround,[...trunk,[10.85,highTrayY,trunkTurnZ],[10.85,highTrayY,1.20],[18.30,highTrayY,1.20],[18.30,.38,1.03]],circuitTeal);

// 二楼 C5-C8：按当前 L 形夹层楼面及洞口边界布点，独立竖向干线从一楼配电箱上引。
for(const x of [11.2,12.8,14.4,16.0,17.6])outlet(circuitUpper,x,9.34,'z',c1Mat,'C5','二楼');outlet(circuitUpper,19.25,8.0,'x',c1Mat,'C5','二楼');for(const z of [1.2,3.0,5.0])outlet(circuitUpper,10.8,z,'x',c2Mat,'C6','二楼');for(const [x,z,side] of [[18.395,.75,'-x'],[18.675,1.03,'z'],[17.90,9.31,'-z']])outlet(circuitUpper,x,z,side,c2Mat,'C7','二楼');
for(const [x,z,s] of [[11.25,1.3,'z'],[13.7,1.3,'z'],[16.0,1.3,'z']])outlet(circuitUpper,x,z,s,c2Mat,'C7','二楼');for(const [x,z,s] of [[19.2,7.2,'-x'],[18.9,5.4,'x'],[18.9,7.0,'x'],[16.2,7.25,'z'],[13.8,7.25,'z']])outlet(circuitUpper,x,z,s,c3Mat,'C8','二楼');
// These four points retain their established positions and IDs after the user removed the other legacy points.
for(const z of [3.15,5.40])outlet(circuitGround,.12,z,'x',c1Mat,'C1','一楼');for(const [x,z,side] of [[18.395,.75,'-x'],[18.675,1.03,'z']])outlet(circuitGround,x,z,side,c3Mat,'C3','一楼');

// 上楼竖向干线：随高位主线槽到后墙东端 (18.20, 9.30)，在第 7、8 根梁之间穿夹层楼板上引；二楼继续贴地脚线分回路。
// 楼梯贴墙后，后墙 x 10.62~17.15 一段被平台和第二跑占住，线路不再沿这段后墙走。
wire(circuitGround,[[10.85,highTrayY+.06,1.20],[upRiseX,highTrayY+.06,1.20],[upRiseX,highTrayY+.06,upRiseZ],[upRiseX,levelHeight,upRiseZ]],circuitBlue);const upperTrayY=.10;wire(circuitUpper,[[upRiseX,0,upRiseZ],[upRiseX,upperTrayY,upRiseZ]]);
// C5 · 二楼周边普通插座回路（蓝）。
for(const x of [11.20,12.80,14.40,16.00,17.60])drop(circuitUpper,x,9.34,circuitBlue,upperTrayY);drop(circuitUpper,19.25,8.00,circuitBlue,upperTrayY);
// C6/C7 · 茶台及日常办公回路（琥珀）。
// S13 sits 300 mm west of the riser, clear of the slab sleeve; its lead runs back along the skirting.
tray(circuitUpper,[[upRiseX,upRiseZ],[17.90,upRiseZ]],circuitAmber,upperTrayY);drop(circuitUpper,17.90,9.31,circuitAmber,upperTrayY);
tray(circuitUpper,[[upRiseX,upRiseZ],[19.15,upRiseZ],[19.15,1.03],[18.93,1.03]],circuitAmber,upperTrayY);for(const z of [1.20,3.00,5.00])drop(circuitUpper,10.80,z,circuitAmber,upperTrayY);for(const x of [12.80,15.00,17.20])drop(circuitUpper,x,.12,circuitAmber,upperTrayY);for(const x of [11.25,13.70,16.00])drop(circuitUpper,x,1.30,circuitAmber,upperTrayY);
// C8 · 二楼右侧设备/扩展回路（青绿）。
tray(circuitUpper,[[upRiseX,upRiseZ],[upRiseX,9.22],[19.07,9.22],[19.07,7.20]],circuitTeal,upperTrayY);drop(circuitUpper,19.20,7.20,circuitTeal,upperTrayY);for(const x of [16.20,13.80])drop(circuitUpper,x,7.25,circuitTeal,upperTrayY);
// Draw only leads whose socket panel remains in the current layout.  A deleted panel never leaves a floating vertical line behind.
drawSocketDrops();
// Existing 500mm columns remain at the CAD positions; no implied permission to alter them.
for(const x of [8.65,18.425])box(shell,x,0,.5,.5,8.4,.5,finishMat(FINISH.wall));
const upperOriginalColumn=box(upper,18.425,0,.5,.5,totalHeight-levelHeight,.5,'#8c969a');upperOriginalColumn.visible=false;
// The exterior envelope is a square: the z=0 + x=19.425 sides stay as the L-shaped daylight face.
// Merge every collinear run before creating a wall, so a straight wall has no false dark posts or panel seams.
const solidWallSegments=[];for(let i=1;i<contour.length;i++){const a=contour[i-1],b=contour[i],entryGap=Math.abs(a[1]-10.7)<.01&&Math.abs(b[1]-10.7)<.01,daylightFace=(Math.abs(a[1])<.01&&Math.abs(b[1])<.01)||(Math.abs(a[0]-19.425)<.01&&Math.abs(b[0]-19.425)<.01);if(entryGap||daylightFace)continue;const prev=solidWallSegments.at(-1),dx=b[0]-a[0],dz=b[1]-a[1];if(prev){const px=prev.b[0]-prev.a[0],pz=prev.b[1]-prev.a[1],joined=Math.hypot(prev.b[0]-a[0],prev.b[1]-a[1])<.001,collinear=Math.abs(px*dz-pz*dx)<.001;if(joined&&collinear){prev.b=b;continue}}solidWallSegments.push({a:[...a],b:[...b]})}
const cutawayWalls=[];
for(const {a,b} of solidWallSegments){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.03)continue;const w=box(shell,-len/2,0,-.06,len,8.4,.12,semiWallMat);cutawayWalls.push(w);w.position.set((a[0]+b[0])/2,4.2,(a[1]+b[1])/2);w.rotation.y=-Math.atan2(dz,dx);w.userData.hoverDimension={a:[a[0],.08,a[1]],b:[b[0],.08,b[1]],text:len.toFixed(3)+' m'}}
const entryDoorMat=mat('#6c98a0',.36);box(ground,9.15,0,10.66,1.55,2.50,.035,entryDoorMat);for(const x of [9.15,10.70])box(ground,x-.025,0,10.655,.05,2.50,.06,steel);box(ground,9.15,2.45,10.655,1.55,.05,.06,steel);box(ground,10.40,1.10,10.61,.035,.22,.08,wood);
// The dark translucent waistline spans the full glass width, edge to edge.
// The label keeps the canvas's natural aspect ratio and mirrors horizontally for the exterior view.
box(ground,9.15,1.28,10.695,1.55,.24,.018,mat('#1c3035',.62));
const doorSignCanvas=document.createElement('canvas');doorSignCanvas.width=1600;doorSignCanvas.height=250;const doorSignCtx=doorSignCanvas.getContext('2d');doorSignCtx.clearRect(0,0,1600,250);doorSignCtx.font='700 136px Microsoft YaHei,Segoe UI,sans-serif';doorSignCtx.textAlign='center';doorSignCtx.textBaseline='middle';doorSignCtx.fillStyle='#eef7f4';doorSignCtx.fillText('1801-OPC空间',800,132);const doorSignTexture=new THREE.CanvasTexture(doorSignCanvas);doorSignTexture.colorSpace=THREE.SRGBColorSpace;doorSignTexture.wrapS=THREE.RepeatWrapping;doorSignTexture.repeat.x=-1;doorSignTexture.offset.x=1;doorSignTexture.needsUpdate=true;const doorSign=new THREE.Mesh(new THREE.PlaneGeometry(1.40,.22),new THREE.MeshBasicMaterial({map:doorSignTexture,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));doorSign.position.set(9.925,1.400,10.716);doorSign.renderOrder=145;ground.add(doorSign);


label(ground,'右侧 · 开放办公预留区',4.5,1.4,2.5);
label(ground,'左侧老板区 · 平地运动',18,1.4,5,'#8b6343');label(ground,'第一跑下 · 储物',14.975,1,6.7,'#566368');label(ground,'私用休闲',11.9,1.4,1.8,'#677243');
label(ground,'原入口',9.925,2.9,10.7,'#176a9c');label(ground,'一楼完成面 −'+(-lowerFinish).toFixed(3)+'m',9.925,.5,5,'#8e6340',3.1);
label(upper,'主电脑位 · 朝向外侧',18,1.6,2.8);label(upper,'临挑空 · 茶桌',11.9,1.5,2.2,'#677243');label(upper,'直播 / 日常办公',15,2.2,4.0,'#77558b');
label(labelGroup,'夹层楼面 +'+levelHeight.toFixed(2)+'m',20.5,levelHeight+.18,5.4,'#466e82',4.2);
line(labelGroup,[[20,0,5.4],[20,levelHeight,5.4]],'#708899');
label(labelGroup,'屋顶结构标高 +'+totalHeight.toFixed(2)+'m',20.5,totalHeight+.18,5.4,'#466e82',4.2);
line(labelGroup,[[20,levelHeight,5.4],[20,totalHeight,5.4]],'#708899');
label(stairs,'淋浴地面至平台面 '+wetToPlate.toFixed(3)+'m',11.75,midHeight+.75,6.55,'#8a5c36',3.2);
line(stairs,[[11.8,wetFloorFinish,6.19],[11.8,midHeight,6.19]],'#8a5c36');
const facade=new THREE.Group();model.add(facade);const windowMat=mat('#5b91ad',.055);
// Align the existing frame and the proposed fit-out to the same CAD plan coordinates.
const siteShell = addSiteShell({ THREE, group: fieldFrame, box, shape, top: totalHeight });
// Shared geometry, shown on its own with the steel when comparing the joint.
const steelDatumReference=siteShell.belt.clone();
steelDatumReference.name='steel-reference-existing-window-beam';
steelDatumReference.visible=false;
model.add(steelDatumReference);
const roofUnderside = siteShell.ceiling.position.y;
const windowLighting=makeWindowLighting({THREE,box,belt:siteShell.belt,beltTop:MEZZANINE.floorFinish,
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
// Lamps are numbered in one run, L01-L18, the same as on the drawings.
const lampNumber={L04:'L07',L05:'L08',L06:'L09',L07:'L10',L08:'L11',L09:'L12',W01:'L04',W02:'L05',W03:'L06',W04:'L13',W05:'L14',U04:'L16',U05:'L17',U06:'L18'};
const lampTags=windowLighting.lights.map(lamp=>label(windowLighting.circuitGroups[lamp.circuit],lampNumber[lamp.id]||lamp.id,lamp.x,lamp.y+.30,lamp.z,'#a35f00',1.08));
const siteServices=addSiteServices({ THREE, group: fieldFrame, box, top: roofUnderside });
const airLayout=makeAirLayout({THREE,box,datum:MEZZANINE,roofUnderside,existingOutlet:siteServices.outlet});
fieldFrame.add(airLayout.group);
const airLabels=new THREE.Group();airLayout.group.add(airLabels);airLabels.visible=false;
const airTags=airLayout.units.map(({id,description,x,y,z})=>label(airLabels,id+' '+description,x,y-.40,z,'#235f62',2.65));
const originalSlabFinish=upperSlab.material;
const airSlabFinish=originalSlabFinish.clone();
airSlabFinish.transparent=true;airSlabFinish.opacity=.17;airSlabFinish.depthWrite=false;
$('#steelViewLevels').textContent='模型标高：钢结构顶 +'+MEZZANINE.steelTop.toFixed(2)+' 米，夹层完成面 +'+levelHeight.toFixed(2)+' 米（与既有梁面齐平）。连接节点待深化。';

// Probe the geometry in its assembled position, before any cutaway/exploded viewing transforms.
// Test both sides of every obstruction boundary, every nosing and the continuous pitch line.
const clearanceMeshes=[upperSlab,...structure.children,...siteShell.roofBeams,siteShell.belt,siteShell.ceiling];
// Lamps and their conduits count too: with the stair against the back wall, the wall lamps and any wall
// conduit are directly over the treads.
for(const group of [siteServices.ceilingPipes,siteServices.hvac,siteServices.fire,windowLighting.fixtures,windowLighting.circuit]){
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
const turnClearance=checkClearance([horizontal(turnWalkX,lowerLandingX,PZ,PZ1,midHeight)],clearanceMeshes);
const arrivalClearance=checkClearance([horizontal(thresholdX,thresholdX+1.50,upperZ,MEZZANINE.backWallZ,levelHeight)],clearanceMeshes);
const wetBounds=[horizontal(10.77,12.93,WZ,WZ1,wetFloorFinish)];
const showerOverhead=checkClearance(wetBounds,[...platformObstacles,...clearanceMeshes,showerHead,showerArm]);
const stairMinimum=Math.min(...flightClearances.map(v=>v.min));
$('#showerBeamClearance').textContent='淋浴完成面至平台走面 '+wetToPlate.toFixed(3)+' m，扣假定平台结构 0.12 m 后 '+(wetToPlate-.12).toFixed(3)+' m（板厚待结构确定），至花洒底 '+
 (MEZZANINE.wetHeadBottom-wetFloorFinish).toFixed(3)+' m。第一跑净空 '+flightClearances[0].min.toFixed(2)+' m，第二跑 '+
 (Math.abs(thresholdX-openRight)<.005?'末级与洞口边对齐':'末级与洞口边缘相差 '+Math.round((thresholdX-openRight)*100)+' cm')+'，中转平台 '+turnClearance.min.toFixed(2)+' m。模型尺寸，现场梁底和管线需复测。';


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
// One flat base at the building datum (±0.000). The 18F interior is a recess cut into it,
// so the 170 mm drop reads as a step down at the walls and at the entrance.
const padShape=new THREE.Shape();[[-2,-2],[21.5,-2],[21.5,13],[-2,13]].forEach((p,i)=>i?padShape.lineTo(p[0],-p[1]):padShape.moveTo(p[0],-p[1]));padShape.closePath();
const padHole=new THREE.Path();contour.forEach((p,i)=>i?padHole.lineTo(p[0],-p[1]):padHole.moveTo(p[0],-p[1]));padHole.closePath();padShape.holes.push(padHole);
const padGeo=new THREE.ExtrudeGeometry(padShape,{depth:.42,bevelEnabled:false});padGeo.rotateX(-Math.PI/2);
const pad=new THREE.Mesh(padGeo,mat('#d9d6cd'));pad.position.y=-.42;pad.name='datum-base';pad.receiveShadow=true;model.add(pad);
const levelStudy=new THREE.Group();
model.add(levelStudy);
levelStudy.visible=false;
const storeyGap=verified.height.floor18_level_m-verified.height.floor17_level_m;
const wastewater=makeWastewater({THREE,box,datum:MEZZANINE,storeyGap,wet,wetWalls});
model.add(wastewater.group);wastewater.group.visible=false;
const wasteTags=[
 label(wastewater.group,'18 楼 · 卫浴垫高 '+Math.round(MEZZANINE.wetRaise*1000)+' mm',12.8,MEZZANINE.wetFloorFinish+.24,6.4,'#216a6c',2.45),
 label(wastewater.group,'备选：穿板至 17 楼顶 · 待核',wastewater.joinX,wastewater.endY-.40,wastewater.joinZ,'#617079',2.6),
 label(wastewater.group,'排水主路线：埋在垫高层内 · 直通入户门接公共管井（位置待核）',10.0,.35,9.6,'#157367',2.85),
 label(wastewater.group,'17 楼地面投影',11.8,wastewater.floor17+.16,8.3,'#617079',2.25)
];
const floor17=buildFloorComparison({THREE,box,openOutline:sidePolys[0],storeyHeight:storeyGap,columnXs:[8.90],upperSlabUnderside:storeyGap+lowerFinish-.16});
// 17F keeps its own datum (-4.200). The 18F recess is taken out of the 17F ceiling zone.
floor17.position.y=-storeyGap;
levelStudy.add(floor17);
const floorNotes=[
 label(levelStudy,'18楼  +72.190 m',2.60,lowerFinish+.26,8.29,'#26475c',3.55),
 label(levelStudy,'17楼  +67.990 m',2.60,floor17.position.y+.26,8.29,'#26475c',3.55),
 label(levelStudy,'18 楼户内楼板下挖 '+(-lowerFinish).toFixed(2)+' m，压低 17 楼这一跨的顶',4.6,lowerFinish-.45,3.6,'#7a4a1c',3.2)
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
 setGuards(true);$('#glassInfo').hidden=true;markBoard('#glassBoard',false);
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
 if(boardMode==='furniture'){$('#furniture').checked=true;updateFurniture()}
 if(boardMode==='circuit'){$('#circuitLayer').checked=false;updateCircuitLayer();wet.visible=true;wetFloor.visible=true;stairs.visible=true;stairStorage.visible=true;openingRails.visible=true}
 if(boardMode==='siteframe'){
  existingOnly.visible=false;
  useInteriorFinish(false);
  camera.fov=43;camera.updateProjectionMatrix();
  $('#siteLegend').hidden=true;

 }
 boardMode='';clearFurnitureSelection();setMode('all');upperOriginalColumn.visible=false;facade.visible=$('#daylight').checked;fieldFrame.visible=true;structure.visible=$('#frame').checked;supportStudy.update('all');markBoard('#circuitBoard',false);markBoard('#steelBoard',false);markBoard('#wetBoard',false);markBoard('#furnitureBoard',false);markBoard('#siteFrameBoard',false)
 if(siteReturnView){
  camera.position.copy(siteReturnView.eye);controls.target.copy(siteReturnView.target);
  viewportFit=siteReturnView.fit;siteReturnView=null;controls.update();
 }
}
// Glass and handrails are a separate trade from the steel. The steel view leaves them out; the glass view shows
// them with the bathroom glazing and leaves the steel frame out.
const guardParts=[];model.traverse(o=>{if(o.name&&o.name.startsWith('guard-'))guardParts.push(o)});
function setGuards(on){for(const o of guardParts)o.visible=on}
function showGlassBoard(){
 if(boardMode==='glass'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 boardMode='glass';closeSpacePlan();setMode('all');upperOriginalColumn.visible=false;
 structure.visible=false;shell.visible=false;fieldFrame.visible=false;facade.visible=false;labelGroup.visible=false;supportStudy.reserve.visible=false;
 setGuards(true);wet.visible=true;wetWalls.visible=true;
 const slope=n=>Math.hypot((n-1)*going,(n-1)*rise),m=v=>v.toFixed(2);
 const edge=voidZ,around=(voidX-10.70)+(openFront-voidZ)+(thresholdX-voidX),landing=PD+.05+(lowerLandingX-10.75);
 const wetH=midHeight-.12-wetFloorFinish,wetArea=2*(2.16+WD)*wetH;
 $('#glassInfoText').textContent='夹层临空边护栏 '+m(edge)+' m；楼梯留空一圈护栏 '+m(around)+' m；中转平台护栏 '+m(landing)+' m；第一跑 '+m(slope(lowerRisers))+' m：临空一侧玻璃护栏，梯井一侧只做扶手；第二跑 '+m(slope(upperRisers))+' m：下段 '+m(slope((voidX-upperStartX)/going))+' m 玻璃护栏，上段与靠墙一侧只做扶手。两跑之间 100 mm 梯井内不得安装任何护栏构件。护栏高 1.10 m，玻璃分格约 1.2 m，每个转角和端头设立柱。淋浴间四面玻璃隔断，外框 2.16 × '+m(WD)+' m（与楼梯总宽对齐），高约 '+m(wetH)+' m，含门约 '+wetArea.toFixed(1)+' ㎡。尺寸为方案值，下料前现场复尺。';
 $('#glassInfo').hidden=false;markBoard('#glassBoard',true);
 camera.position.set(5.5,10.5,-15.5);controls.target.set(13.6,2.6,-6.9);viewportFit=1;fitViewport();
}
function showSteelBoard(){
 if(boardMode==='steel'){restoreFullBoard();return}
 if(boardMode)restoreFullBoard();
 siteReturnView={eye:camera.position.clone(),target:controls.target.clone(),fit:viewportFit};
 boardMode='steel';ground.visible=false;upper.visible=false;stairs.visible=true;shell.visible=false;fieldFrame.visible=false;structure.visible=true;labelGroup.visible=false;facade.visible=false;upperOriginalColumn.visible=false;supportStudy.reserve.visible=false;
 setGuards(false);$('#steelDatumTools').hidden=false;markBoard('#steelBoard',true);
 showSteelOverview();
}
function showSteelOverview(){
 structure.visible=true;ground.visible=false;upper.visible=false;setStairInspection(false);
 steelDatumReference.visible=false;
 camera.position.set(26,17,-22);controls.target.set(15,2.6,-4.8);viewportFit=1;fitViewport();
}
function showSteelDatum(){
 if(boardMode!=='steel')showSteelBoard();
 structure.visible=true;ground.visible=false;upper.visible=false;setStairInspection(false);
 steelDatumReference.visible=true;
 controls.target.set(14.6,upperDeckUnderside,-1.65);
 camera.position.set(11.0,6.15,-6.80);viewportFit=1;fitViewport();
}
$('#steelOverall').onclick=showSteelOverview;
$('#steelDatumView').onclick=showSteelDatum;
function setStairInspection(active){
 showerDimension.visible=active;showerDimTag.visible=active;
 $('#stairFlightsInfo').hidden=!active;
 $('#steelViewTitle').textContent=active?'淋浴间与两跑楼梯':'夹层楼面与既有梁面齐平';
 $('#steelViewLevels').hidden=active;
}
function showStairClearance(){
 if(boardMode!=='steel')showSteelBoard();
 structure.visible=true;steelDatumReference.visible=false;ground.visible=true;upper.visible=true;
 const info=$('#stairFlightsInfo');
 info.textContent='下跑 '+MEZZANINE.lowerRisers+' 级，上跑 '+MEZZANINE.upperRisers+' 级。每级高 '+(MEZZANINE.riser*1000).toFixed(1)+' 毫米，深 '+Math.round(MEZZANINE.going*1000)+' 毫米。平台上方最低 '+turnClearance.min.toFixed(2)+' 米；浴室至平台面 '+wetToPlate.toFixed(3)+' 米，钢板和支撑待核。';
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
$('#openWaterSheet').onclick=()=>showFlatPlan('图纸/P-01_给排水平面图.svg','给排水平面图');
$('#steelBoard').onclick=showSteelBoard;$('#glassBoard').onclick=showGlassBoard;$('#wetBoard').onclick=showWetBoard;$('#furnitureBoard').onclick=showFurnitureBoard;$('#siteFrameBoard').onclick=showSiteFrameBoard;
function reset(){pad.visible=mode!=='upper';facade.visible=$('#daylight').checked&&mode!=='upper';camera.up.set(0,1,0);camera.position.set(28.5,21,-27.5);if(mode==='split')camera.position.set(26,25,-28);controls.target.set(9.7,mode==='split'?4:mode==='upper'||mode==='ground'?0:2.5,-4.8);if(mode==='upper'){camera.position.set(26,15,-18);controls.target.set(15,1,-4.4)}controls.update()}$('#reset').onclick=reset;$('#supportView').onclick=()=>{$('#supportReserve').checked=true;$('#frame').checked=true;setMode('ground');reset();structure.visible=true;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#daylight').checked=false;facade.visible=false;$('#labels').checked=true;labels.forEach(s=>s.visible=supportStudy.labels.includes(s)||s.userData.labelText==='原入口');camera.position.set(26,15,-17);controls.target.set(15,1.2,-4.7);controls.update();$('#modeLabel').textContent='沿楼梯外侧候选柱位＋低柜 · 仅空间预留，未做承载验算';};$('#restFocus').onclick=()=>{setMode('upper');reset();upperOriginalColumn.visible=true;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#labels').checked=true;labels.forEach(q=>q.visible=q.userData.labelText.includes('并入主办公区')||q.userData.labelText.includes('出口贴墙'));camera.position.set(24,15,-15);controls.target.set(15.2,.4,-5.0);controls.update();};$('#stairView').onclick=()=>{setMode('ground');reset();$('#labels').checked=true;labels.forEach(s=>s.visible=s.parent===stairs||s.userData.labelText==='原入口');$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));camera.position.set(16,21,-7.599);controls.target.set(16,0,-7.6);controls.update()};$('#bossFocus').onclick=()=>{$('#labels').checked=false;labels.forEach(s=>s.visible=s.parent===labelGroup);$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));$('#daylight').checked=false;setMode('all');upperOriginalColumn.visible=false;reset();camera.position.set(29,18,-20);controls.target.set(15,3,-4.7);controls.update()};$('#heightView').onclick=()=>{$('#labels').checked=false;labels.forEach(s=>s.visible=s.parent===labelGroup);$('#daylight').checked=false;facade.visible=false;$('#dimensions').checked=false;$('#dimensions').dispatchEvent(new Event('change'));camera.position.set(34,6,-4);controls.target.set(14.7,4.2,-4);controls.update()};$('#entryView').onclick=()=>{camera.position.set(9.925,12,-21);controls.target.set(9.925,1.5,-3);controls.update()};$('#top').onclick=()=>{const cx=mode==='upper'?15.05:9.7;camera.position.set(cx,mode==='upper'?18:24,-4.799);controls.target.set(cx,0,-4.8);controls.update()};$('#zoomIn').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(.8).add(controls.target);controls.update()};$('#zoomOut').onclick=()=>{camera.position.sub(controls.target).multiplyScalar(1.25).add(controls.target);controls.update()};function fullView(on){$('#viewer').classList.toggle('expanded',on);document.body.style.overflow=on?'hidden':'';$('#full').textContent=on?'退出全屏':'全屏'}$('#full').onclick=()=>fullView(!$('#viewer').classList.contains('expanded'));window.addEventListener('keydown',e=>{if(e.key==='Escape')fullView(false)});
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start;
const furnitureOutline=new THREE.BoxHelper(new THREE.Object3D(),0x1b8eb7);furnitureOutline.visible=false;scene.add(furnitureOutline);
const furniturePlane=new THREE.Plane(new THREE.Vector3(0,1,0),-levelHeight);
let selectedFurniture=null,furnitureDrag=null;
function pointerRay(event){const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera)}
function furnitureOwner(object){let current=object;while(current&&current!==upper&&current!==ground){if(current.userData?.furnitureMovable)return current;current=current.parent}return null}
function furnitureAt(event){if(boardMode!=='furniture')return null;pointerRay(event);return furnitureOwner(ray.intersectObjects(furnitureMovables.filter(o=>o.visible),true)[0]?.object)}
function updateFurnitureEditor(){const editor=$('#furnitureEditor');const on=boardMode==='furniture';editor.hidden=!on;renderer.domElement.style.cursor=on?'grab':'';const m=selectedFurniture?.userData.furnitureMovable,sc=selectedFurniture?.scale,kit=m&&FURNITURE_KIT[m.type];$('#furniturePicked').textContent=selectedFurniture?'已选：'+m.name+'（'+(m.floor==='upper'?'二楼':'一楼')+'）· 约 '+(kit.size[0]*sc.x).toFixed(2)+' × '+(kit.size[1]*sc.z).toFixed(2)+' m':'点选一件家具；或用下面按钮添加';for(const id of ['furnitureCopy','furnitureDelete'])if($('#'+id))$('#'+id).disabled=!selectedFurniture;furnitureOutline.visible=!!selectedFurniture&&on}
function selectFurniture(object){selectedFurniture=object||null;updateFurnitureEditor()}
function clearFurnitureSelection(){selectedFurniture=null;furnitureDrag=null;furnitureOutline.visible=false;controls.enabled=true;updateFurnitureEditor()}
function updateFurnitureOutline(){if(selectedFurniture&&boardMode==='furniture'){furnitureOutline.setFromObject(selectedFurniture);furnitureOutline.visible=true}else furnitureOutline.visible=false}
function nudgeFurniture(dx,dz){if(!selectedFurniture)return;selectedFurniture.position.x+=dx;selectedFurniture.position.z+=dz;saveFurnitureLayout();updateFurnitureAnchoredNotes()}
function scaleFurniture(step){if(!selectedFurniture)return;const k=1+step,s=selectedFurniture.scale;if(s.x*k<.3||s.x*k>6||s.z*k<.3||s.z*k>6)return;s.multiplyScalar(k);saveFurnitureLayout();updateFurnitureEditor()}
// One-sided scale: width is along the piece's own x, depth along its own z, whatever way it is turned.
function stretchFurniture(axis,step){if(!selectedFurniture)return;const s=selectedFurniture.scale;s[axis]=THREE.MathUtils.clamp(s[axis]*(1+step),.3,6);saveFurnitureLayout();updateFurnitureEditor()}
function rotateFurniture(step){if(!selectedFurniture)return;selectedFurniture.rotation.y=(Math.round(selectedFurniture.rotation.y/(Math.PI/2))+Math.sign(step))*Math.PI/2;saveFurnitureLayout()}
function addFurniture(type){const floor=$('#furnitureFloor')?.value==='upper'?'upper':'ground';const x=THREE.MathUtils.clamp(controls.target.x,floor==='upper'?11.3:.8,18.8),z=THREE.MathUtils.clamp(-controls.target.z,.8,floor==='upper'?6.8:5.6);const o=spawnFurniture({type,floor,x,z,rot:0,sx:1,sy:1,sz:1});saveFurnitureLayout();selectFurniture(o)}
function copyFurniture(){if(!selectedFurniture)return;const m=selectedFurniture.userData.furnitureMovable,p=selectedFurniture.position,sc=selectedFurniture.scale;const o=spawnFurniture({type:m.type,floor:m.floor,x:p.x+.45,z:p.z+.45,rot:Math.round(selectedFurniture.rotation.y/(Math.PI/2)),sx:sc.x,sy:sc.y,sz:sc.z});saveFurnitureLayout();selectFurniture(o)}
function deleteFurniture(){if(!selectedFurniture)return;removeFurniture(selectedFurniture);clearFurnitureSelection();saveFurnitureLayout()}
$('#furnitureUp').onclick=()=>nudgeFurniture(0,-.15);$('#furnitureDown').onclick=()=>nudgeFurniture(0,.15);$('#furnitureLeft').onclick=()=>nudgeFurniture(-.15,0);$('#furnitureRight').onclick=()=>nudgeFurniture(.15,0);$('#furnitureSmaller').onclick=()=>scaleFurniture(-.08);$('#furnitureLarger').onclick=()=>scaleFurniture(.08);$('#furnitureTurnLeft').onclick=()=>rotateFurniture(1);$('#furnitureTurnRight').onclick=()=>rotateFurniture(-1);document.querySelectorAll('[data-add-furniture]').forEach(b=>b.onclick=()=>addFurniture(b.dataset.addFurniture));$('#furnitureCopy').onclick=copyFurniture;$('#furnitureDelete').onclick=deleteFurniture;$('#furnitureWider').onclick=()=>stretchFurniture('x',.1);$('#furnitureNarrower').onclick=()=>stretchFurniture('x',-.1);$('#furnitureDeeper').onclick=()=>stretchFurniture('z',.1);$('#furnitureShallower').onclick=()=>stretchFurniture('z',-.1);$('#furnitureReset').onclick=()=>{resetFurnitureLayout();updateFurnitureAnchoredNotes();clearFurnitureSelection()};
$('#furnitureDeselect').onclick=clearFurnitureSelection;
renderer.domElement.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];if(e.button!==0||boardMode!=='furniture'||measurement.isActive())return;const object=furnitureAt(e);if(!object)return;selectFurniture(object);furniturePlane.constant=-(object.parent===upper?upper.position.y:ground.position.y);const world=new THREE.Vector3();if(!ray.ray.intersectPlane(furniturePlane,world))return;const local=upper.worldToLocal(world.clone());furnitureDrag={pointerId:e.pointerId,object,start:local,origin:object.position.clone()};controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';e.preventDefault()});
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
  const versioned='./'+file+'?v=158';$('#spacePlanTitle').textContent=title;planImage.alt=title;planImage.src=versioned;$('#spacePlanOpen').href=versioned;roomPlan.hidden=false;host.classList.add('plan-open');renderer.domElement.style.visibility='hidden';turnFlatPlan(0);
}
$('#softPlanView').onclick=()=>showFlatPlan('图纸/F-01_地面与墙面做法图.svg','地面与墙面做法图');
$('#electricalGround').onclick=()=>showFlatPlan('图纸/E-01_一层照明平面图.svg','一层照明平面图');
$('#electricalUpper').onclick=()=>showFlatPlan('图纸/E-03_夹层照明平面图.svg','夹层照明平面图');
$('#planClose').onclick=()=>closeSpacePlan();
function closeSpacePlan(){roomPlan.hidden=true;host.classList.remove('plan-open');renderer.domElement.style.visibility='visible'}
function spaceView(level){
 setMode(level);reset();upperOriginalColumn.visible=level==='upper';
 const file='图纸/F-01_地面与墙面做法图.svg';
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
 for(const p of pickables)p.visible=p===corridor||p===stairAisle;
 renderer.domElement.dataset.legacyZonePatchesVisible=String(pickables.filter(p=>p!==corridor&&p.visible).length);
 for(const q of labels){if(q.userData.aisle)q.visible=sceneNotesOn&&(!boardMode||boardMode==='furniture');else if(q.userData.furniture)q.visible=sceneNotesOn&&show;else if(/开放办公预留区|平地运动|第一跑下|私用休闲|主电脑位|临挑空 · 茶桌|直播 \/|低柜 ·/.test(q.userData.labelText||''))q.visible=show&&$('#labels').checked}
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
 structuralVerified:'false',stairShift:'0',wetFloorFinish:wetFloorFinish.toFixed(3),wetRaise:wetLocalFloor.toFixed(3),wetHeadClearance:(MEZZANINE.wetHeadBottom-wetFloorFinish).toFixed(3),wetArea:(2.16*WD).toFixed(3),wetLevel:'ground-under-turning-platform',wetClearHeightTarget:'2.00',
 stairWidth:'1.20',layoutVersion:'classic-rectangular-landing',wetHeightConflict:'unverified',
 stairHeadroomCheck:(stairMinimum>MEZZANINE.headroomLimit&&turnClearance.min>MEZZANINE.headroomLimit&&arrivalClearance.min>=2)?'model-pass':'model-conflict',
 platformBeamClearance:turnClearance.min.toFixed(3),wetToPlatformSurface:wetToPlate.toFixed(3),
 wetOverheadClearance:showerOverhead.min.toFixed(3),stairRiser:rise.toFixed(6),stairGoing:going.toFixed(2),
 lowerFlightClearance:flightClearances[0].min.toFixed(3),upperFlightClearance:flightClearances[1].min.toFixed(3),
 upperArrivalClearance:arrivalClearance.min.toFixed(3),stairClearanceChecks:JSON.stringify({lower:flightClearances[0],upper:flightClearances[1],turn:turnClearance,arrival:arrivalClearance,wet:showerOverhead}),
 returnFlightDirection:'+X',steelTop:upperDeckUnderside.toFixed(2)
});
// Remove the presentation base and ground finish from a view taken below 18F.
const groundSurfaces=[pad,rawFloor,...groundFloorMeshes,...pickables.filter(p=>p.parent===ground)];
let cutGround=false;
function updateUnderside(){
 const below=camera.position.y<lowerFinish&&boardMode!=='floorstack';
 if(below===cutGround)return;
 cutGround=below;
 for(const mesh of groundSurfaces){
  if(below)mesh.layers.disable(0);
  else mesh.layers.enable(0);
 }
}
// Switch plates and the added lights, read from the same data file as the electrical sheets (E-01..E-05).
const electrical=await fetch('./1801_电气数据.json?v=157').then(r=>r.ok?r.json():null).catch(()=>null);
if(electrical){
 // One colour per kind so they read apart at a glance: lights amber, switches red, sockets blue.
 const switchPlate=mat('#c62828');switchPlate.userData.keepLook=true;
 const addedLens=new THREE.MeshStandardMaterial({color:'#ffb31a',emissive:'#ff9d00',emissiveIntensity:.9,roughness:.6});addedLens.userData.keepLook=true;
 for(const sw of electrical.switches||[]){
  const g=sw.floor==='二楼'?circuitUpper:circuitGround,n=sw.wallNormal||[1,0],onX=Math.abs(n[0])>0,w=.086*sw.gangCount+.02,t=.014;
  // The drawings give the wall face; the model draws each wall 120 mm thick centred on the outline, so a
  // switch on an outline wall is brought out to the model's wall face (otherwise it is buried in the wall).
  const onOutline=solidWallSegments.some(({a,b})=>{const dx=b[0]-a[0],dz=b[1]-a[1],L=dx*dx+dz*dz;if(!L)return false;const k=Math.max(0,Math.min(1,((sw.x-a[0])*dx+(sw.z-a[1])*dz)/L));return Math.hypot(a[0]+k*dx-sw.x,a[1]+k*dz-sw.z)<.02});
  const sx=sw.x+(onOutline?n[0]*.06:0),sz=sw.z+(onOutline?n[1]*.06:0);
  // Height is from the floor the user stands on: the entrance strip is raised to the outside datum.
  const onEntryRaise=sw.floor!=='二楼'&&sw.x>=9.15-.01&&sw.x<=10.70+.01&&sw.z>=7.675&&sw.z<=10.70;
  const standY=onEntryRaise?-MEZZANINE.lowerFinish:0,y=standY+sw.heightAboveFloorM-.045;
  const plate=onX?box(g,sx+(n[0]>0?0:-t),y,sz-w/2,t,.09,w,switchPlate):box(g,sx-w/2,y,sz+(n[1]>0?0:-t),w,.09,t,switchPlate);plate.name='switch-'+sw.id;
  const text=sw.id+' · '+sw.gangCount+' 联：'+sw.gangs.map(x=>x.controls.length?x.controls.length+' 盏'+(x.control==='双控'?'（上下双控）':''):'预留').join(' / ');
  lampTags.push(label(g,text,sx+n[0]*.3,standY+sw.heightAboveFloorM+.3,sz+n[1]*.3,'#b3261e',3.0));
 }
 for(const lt of (electrical.lights||[]).filter(l=>l.status!=='existing')){
  const alongZ=/朝[-+]x/.test(lt.mountFace||'');
  const lamp=alongZ?box(windowLighting.fixtures,lt.x-.03,lt.elevationM-.03,lt.z-.35,.06,.06,.70,addedLens):box(windowLighting.fixtures,lt.x-.35,lt.elevationM-.03,lt.z-.03,.70,.06,.06,addedLens);lamp.name='added-light-'+lt.id;
  lampTags.push(label(windowLighting.circuit,lt.id+' · 楼梯灯',lt.x-(alongZ?.3:0),lt.elevationM+.3,lt.z-(alongZ?0:.2),'#a35f00',2.6));
 }
 renderer.domElement.dataset.switchPlates=String((electrical.switches||[]).length);
}
// Presentation layer and permanent dimensions (CAD first; see dimension-data.js).
const look=setupLook({scene,renderer,camera,controls,model,wallColor:FINISH.wall,walls:cutawayWalls,roof:siteShell.ceiling,roofBeams:siteShell.roofBeams});
lookRef=look;
// Existing concrete (window beam with its ledge, roof beams) is painted with the walls.
for(const m of [siteShell.belt,...siteShell.roofBeams,siteShell.endWall]){m.material.color.set(FINISH.wall);m.material.userData.keepLook=true}
const dimensionLayer=setupDimensions({camera,host,model});
addProjectDimensions(dimensionLayer,{ground,upper,stairs,structure,fieldFrame,floor17,M:MEZZANINE});
const dimToggle=$('#dimToggle'),dimDetail=$('#dimDetail');
if(dimToggle)dimToggle.onclick=()=>{const on=!dimensionLayer.isEnabled();dimensionLayer.setEnabled(on);dimToggle.textContent=on?'尺寸：开':'尺寸：关';dimToggle.setAttribute('aria-pressed',String(on));dimToggle.classList.toggle('active',on);sceneNotesOn=on;updateFurniture()};
if(dimDetail)dimDetail.onclick=()=>{const all=dimensionLayer.getDetail()<3;dimensionLayer.setDetail(all?3:0);dimDetail.textContent=all?'细部尺寸：全显':'细部尺寸：走近显示';dimDetail.setAttribute('aria-pressed',String(all));dimDetail.classList.toggle('active',all)};
renderer.domElement.dataset.lookEdges=String(look.edgeCount());renderer.domElement.dataset.dimensionCount=String(dimensionLayer.count());
// On-screen pan pad: move the whole drawing inside the canvas, or bring it back to the centre.
const panPad=document.createElement('div');panPad.id='panPad';
panPad.innerHTML='<button data-pan="up" aria-label="上移">▲</button><button data-pan="left" aria-label="左移">◀</button><button data-pan="home" aria-label="回到中心">回中</button><button data-pan="right" aria-label="右移">▶</button><button data-pan="down" aria-label="下移">▼</button>';
const panCss=document.createElement('style');panCss.textContent='#panPad{position:absolute;left:10px;top:64px;z-index:5;display:grid;grid-template-columns:repeat(3,40px);grid-template-rows:repeat(3,40px);gap:3px}#panPad button{font:600 14px "Microsoft YaHei","PingFang SC",sans-serif;border:1px solid #1d2a3333;border-radius:9px;background:#fffffff0;color:#1d2a33;cursor:pointer;padding:0;touch-action:manipulation}#panPad button:active{background:#1d2a33;color:#fff}#panPad [data-pan=up]{grid-area:1/2}#panPad [data-pan=left]{grid-area:2/1}#panPad [data-pan=home]{grid-area:2/2;font-size:12px}#panPad [data-pan=right]{grid-area:2/3}#panPad [data-pan=down]{grid-area:3/2}';
document.head.append(panCss);host.append(panPad);
function panView(dx,dy){const dist=camera.position.distanceTo(controls.target),step=dist*.09,right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),move=right.multiplyScalar(dx*step).add(up.multiplyScalar(dy*step));camera.position.add(move);controls.target.add(move);controls.update()}
// Arrows move the drawing itself, so the camera goes the opposite way.
const panMoves={up:[0,-1],down:[0,1],left:[1,0],right:[-1,0]};
panPad.addEventListener('click',e=>{const k=e.target.dataset?.pan;if(!k)return;if(k==='home'){reset();return}panView(...panMoves[k])});
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;const k={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[e.key];if(k){panView(...panMoves[k]);e.preventDefault()}});
controls.enablePan=true;controls.screenSpacePanning=true;
// Optional fixed viewpoint from the address bar (?cam=x,y,z&tgt=x,y,z in model metres), for sharing an exact view.
{const q=new URLSearchParams(location.search),num=k=>(q.get(k)||'').split(',').map(Number);const c=num('cam'),g=num('tgt');
 if(c.length===3&&g.length===3&&[...c,...g].every(Number.isFinite))setTimeout(()=>{camera.position.set(c[0],c[1],-c[2]);controls.target.set(g[0],g[1],-g[2]);controls.update()},400);}
// Sprite labels keep a fixed pixel height on any screen shape.
let labelSizeKey='';function updateLabelSizes(){const h=host.clientHeight,key=h+'|'+camera.fov;if(key===labelSizeKey)return;labelSizeKey=key;const unit=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,h);for(const s of labels){const k=s.userData.labelPx*unit;s.scale.set(k*s.userData.labelAspect,k,1)}}
function animate(t){requestAnimationFrame(animate);updateLabelSizes();controls.update();updateFurniture();updateFurnitureAnchoredNotes();updateFurnitureOutline();updateUnderside();measurement.update();look.update(t);dimensionLayer.update();renderer.render(scene,camera)}animate();
setupRoles({host:$('#viewer'),showPlan:showFlatPlan,closePlan:closeSpacePlan});

function overallDimensions(){
 closeSpacePlan();setMode('all');upperOriginalColumn.visible=false;
 $('#furniture').checked=true;$('#labels').checked=false;labels.forEach(q=>q.visible=false);
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
 if(key==='underside'){
  controls.target.set(10,3,-4.8);camera.position.set(16,-13,-16);
  viewportFit=1;fitViewport();return;
 }
 const legacyButtons={connection:'#connectionView',left:'#bossFocus',rest:'#restFocus',wet:'#wetFocus',stairs:'#stairView',supports:'#supportView','bar-gym':'#barGymView','soft-plan':'#softPlanView'};
 if(Object.hasOwn(legacyButtons,key))return $(legacyButtons[key]).click();
 if(key==='ground-space'||key==='upper-space')return spaceView(key==='upper-space'?'upper':'ground');
 if(key==='electrical-ground'||key==='electrical-upper'){showCircuitBoard();return $(key==='electrical-ground'?'#electricalGround':'#electricalUpper').click();}
 if(key==='site-frame')return showSiteFrameBoard();
 if(key==='steel-datum')return showSteelDatum();
 if(key==='classic-stair'){
  showStairClearance();
  ground.visible=false;upper.visible=false;structure.visible=false;showerDimension.visible=false;
  controls.target.set(14.3,2.0,-7.6);camera.position.set(20,8.1,.7);viewportFit=1;fitViewport();return;
 }
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
