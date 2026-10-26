import * as THREE from 'three';
export function setupMeasurements(ctx){
 const {scene,camera,renderer,controls,model,ground,upper,stairs,structure,shell,wet,supportReserve,floor,contour,groundFloorMeshes,upperFloorMeshes,getMode}=ctx;
 const $=s=>document.querySelector(s),canvas=renderer.domElement;
 const dims=new THREE.Group(),upperDims=new THREE.Group(),stairDims=new THREE.Group();ground.add(dims);upper.add(upperDims);stairs.add(stairDims);
 function text(g,str,p,color='#9c542d',size=3.4){const c=document.createElement('canvas');c.width=1024;c.height=128;const a=c.getContext('2d');a.fillStyle='#ffffffef';a.fillRect(0,0,1024,128);a.fillStyle=color;a.font='bold 48px Microsoft YaHei';a.textAlign='center';a.textBaseline='middle';a.fillText(str,512,64,1000);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,toneMapped:false}));s.position.copy(p);s.scale.set(size,size/8,1);s.renderOrder=110;g.add(s);return s}
 function segment(g,a,b,color){const o=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color,depthTest:false}));o.renderOrder=100;g.add(o)}
 function dim(g,a,b,str,c='#287397'){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);segment(g,av,bv,c);const dir=bv.clone().sub(av).normalize();const tick=new THREE.Vector3(-dir.z,0,dir.x).multiplyScalar(.14);for(const p of [av,bv])segment(g,p.clone().sub(tick),p.clone().add(tick),c);text(g,str,av.clone().add(bv).multiplyScalar(.5).add(new THREE.Vector3(0,.22,0)),c,4.5)}
 // Dimension-only overlay: local model coordinates, no furniture zone names.
 const quietLabels=[],quietLines=[];let scopeOverride=null,hoverRegion='',hoverCorner=false,focusRegion='';
 const hoverRay=new THREE.Raycaster(),hoverMouse=new THREE.Vector2();let pointerIn=false,lastHover=0;
 function regionFor(g,p,str=''){
  if(scopeOverride)return scopeOverride;
  if(g===frameDims)return 'frame';if(g===cornerDims)return 'corner';if(g===stairDims){if(str.startsWith('4.480'))return p[1]>3?'flight2':'flight1';if(str.startsWith('2.200'))return 'landing';if(str==='1.845 m')return 'approach';return 'stairs';}if(g===upperDims){if(str.startsWith('6.830'))return 'opening';if(str.startsWith('1.500'))return 'arrival';if(str==='1.895 m')return 'upper-side';return 'upper';}
  if(str.includes('2.160'))return 'bath';
  if(p[0]>=9.15&&p[0]<=10.7&&p[2]>=0)return 'corridor';
  return p[0]<9.15?'office':'owner';
 }
 function ancestry(o,target){for(let a=o;a;a=a.parent)if(a===target)return true;return false}
 function findHover(){
  if(!pointerIn){hoverRegion='';hoverCorner=false;return;}
  hoverRay.setFromCamera(hoverMouse,camera);const meshes=[];
  for(const g of [ground,upper,stairs,structure,shell,supportReserve])g.traverse(o=>{if(o.isMesh&&!o.userData.areaOverlay&&visible(o)&&(!o.material.transparent||o.material.opacity>.3))meshes.push(o)});
  const h=hoverRay.intersectObjects(meshes,false)[0];hoverRegion='';hoverCorner=false;if(!h)return;
  const v=model.worldToLocal(h.point.clone());
  if(ancestry(h.object,supportReserve))hoverRegion='bar-gym';else if(ancestry(h.object,wet))hoverRegion='bath';else if(ancestry(h.object,structure))hoverRegion='frame';else if(ancestry(h.object,stairs))hoverRegion=v.x<=12.95?'landing':v.z<7.64?'flight1':'flight2';else if(ancestry(h.object,upper)){const u=upper.worldToLocal(h.point.clone());hoverRegion=u.z>=9.24?'upper-edge':u.z>=7.74&&u.x>=17.53&&u.x<=19.03?'arrival':u.z>=7.44&&u.x>=17.53?'upper-side':'upper';}else if(ancestry(h.object,shell))hoverRegion='corner';
  else hoverRegion=v.x<9.15?'office':v.x<=10.7?'corridor':v.z<=6.04?'bar-gym':v.x>=17.43&&v.x<=19.275&&v.z<=7.54?'approach':'owner';
  hoverCorner=(v.x<.55&&v.z<.55)||(v.x>18.1&&v.z>9.0)||(v.x>18.0&&v.z<1.15)||(v.z>7.675&&v.x>8.8&&v.x<11.2);
 }
 canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();hoverMouse.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);pointerIn=true;focusRegion='';lastHover=0;});
 canvas.addEventListener('pointerleave',()=>{pointerIn=false;hoverRegion='';hoverCorner=false;});
 canvas.addEventListener('pointercancel',()=>{pointerIn=false;hoverRegion='';});
 function regionVisible(o){return $('#allDimensions').checked||o.userData.region===(focusRegion||hoverRegion)||(o.userData.region==='stairs'&&['flight1','flight2','landing','approach'].includes(focusRegion||hoverRegion))||(o.userData.region==='corner'&&hoverCorner);}

 const frameDims=new THREE.Group(),cornerDims=new THREE.Group();model.add(frameDims);ground.add(cornerDims);
 // Stair measurements use model coordinates, independent of the mirrored stair group.
 stairs.remove(stairDims);ground.add(stairDims);
 function quietText(g,str,p,size=2.0){
  const c=document.createElement('canvas');c.width=768;c.height=128;const a=c.getContext('2d');
  a.font='500 78px Segoe UI, Arial, Microsoft YaHei';a.textAlign='center';a.textBaseline='middle';
  a.strokeStyle='rgba(255,255,255,.78)';a.lineWidth=3;a.strokeText(str,384,64,750);a.fillStyle='#204858';a.fillText(str,384,64,750);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const q=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,opacity:1,depthTest:false,depthWrite:false,toneMapped:false}));
  q.position.set(...p);q.scale.set(size,size/6,1);const leader=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...p),new THREE.Vector3(...p)]),new THREE.LineBasicMaterial({color:'#527987',transparent:true,opacity:.3,depthTest:false,depthWrite:false}));leader.renderOrder=100;g.add(leader);q.userData.leader=leader;q.renderOrder=115;q.userData.region=regionFor(g,p,str);q.userData.anchor=new THREE.Vector3(...p);q.userData.baseSize=size;q.userData.pixelWidth=str.length>12?185:115;quietLabels.push(q);g.add(q);return q;
 }
 function quietLine(g,a,b){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]),new THREE.LineBasicMaterial({color:'#477d8c',transparent:true,opacity:.42,depthTest:false,depthWrite:false}));l.renderOrder=100;l.userData.region=regionFor(g,a.map((v,i)=>(v+b[i])/2));quietLines.push(l);g.add(l)}
 function qdim(g,a,b,str,size=1.65,offset=[0,.13,0]){
  const oldScope=scopeOverride;scopeOverride=regionFor(g,a.map((v,i)=>(v+b[i])/2),str);
  quietLine(g,a,b);const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av).normalize();
  const t=new THREE.Vector3(-d.z,0,d.x).multiplyScalar(.09);
  for(const v of [av,bv])quietLine(g,v.clone().sub(t).toArray(),v.clone().add(t).toArray());
  quietText(g,str,av.add(bv).multiplyScalar(.5).add(new THREE.Vector3(...offset)).toArray(),size);scopeOverride=oldScope;
 }
 function outline(g,x,z,w,d,y){for(const [a,b] of [[[x,y,z],[x+w,y,z]],[[x+w,y,z],[x+w,y,z+d]],[[x+w,y,z+d],[x,y,z+d]],[[x,y,z+d],[x,y,z]]])quietLine(g,a,b)}
 // Whole blocks and continuous passage. Numbers are model dimensions in metres.
 qdim(dims,[0,.07,-.75],[19.425,.07,-.75],'19.425 m',2.3);
 qdim(dims,[0,.07,8.10],[9.15,.07,8.10],'9.150 m',2.0);
 qdim(dims,[-.6,.07,0],[-.6,.07,7.675],'7.675 m',2.0);
 qdim(dims,[10.7,.07,10.05],[19.425,.07,10.05],'8.725 m',2.0);
 qdim(dims,[20.1,.07,0],[20.1,.07,9.4],'9.400 m',2.0);
 outline(dims,0,0,9.15,7.675,.04);
 quietText(dims,'9.150 × 7.675 m',[4.575,.13,3.3],3.3);
 quietText(dims,'70.21 ㎡',[4.575,.13,4.35],1.9);
 quietText(dims,'8.725 × 9.400 m',[15.15,.16,1.9],3.3);
 quietText(dims,'81.97 ㎡',[15.15,.16,2.9],1.9);
 qdim(dims,[9.15,.06,10.9],[10.7,.06,10.9],'1.550 m',1.9,[0,.18,.3]);
 qdim(dims,[9.925,.08,0],[9.925,.08,10.7],'10.700 m',2.0);
 qdim(dims,[21,0,4.8],[21,4.92,4.8],'4.92 m',2.0);
 qdim(upperDims,[20.3,0,4.8],[20.3,3.0,4.8],'3.00 m',2.0);
 // Proposed bar + gym: full rectangle before the stair, including candidate posts.
 scopeOverride='bar-gym';
 outline(dims,10.7,0,8.725,6.04,.09);
 qdim(dims,[10.7,.09,6.04],[19.425,.09,6.04],'8.725 m',2.0);
 qdim(dims,[19.425,.09,0],[19.425,.09,6.04],'6.040 m',2.0);
 quietText(dims,'8.725 × 6.040 m',[15.0625,.18,2.5],3.4);
 quietText(dims,'52.70 ㎡',[15.0625,.18,3.5],2.5);
 scopeOverride=null;
 const areaOverlays=[];
 const areaInfo={
  office:{title:'一楼整块办公空间',metric:'9.150 × 7.675 m · 约70.21㎡',note:'按原轮廓扣除小凹口；含柱与内部通行空间。',color:'#82b6cf'},
  'bar-gym':{title:'吧台兼健身预留',metric:'8.725 × 6.040 m · 约52.70㎡',note:'含柱和备用柱位；不含楼梯、卫浴及旁侧上楼通路，未扣吧台与器械。',color:'#79bcb0'},
  corridor:{title:'中央通道',metric:'1.550 × 10.700 m · 约16.59㎡',note:'包含入口短段；方案完成面比两侧低0.10m。',color:'#8caabd'},
  bath:{title:'平台下卫浴',metric:'2.160 × 3.100 m · 外框约6.70㎡',note:'墙内2.000 × 2.940m、约5.88㎡，未扣洁具；外框已包含在平台投影中。',color:'#9bbfa8'},
  flight1:{title:'第一跑楼梯',metric:'4.480 × 1.500 m · 投影约6.72㎡',note:'沿坡面长度约5.23m；这里只显示水平投影面积，含在整部楼梯21.38㎡内。',color:'#dfbe81'},
  flight2:{title:'第二跑楼梯',metric:'4.480 × 1.500 m · 投影约6.72㎡',note:'沿坡面长度约5.23m；这里只显示水平投影面积，含在整部楼梯21.38㎡内。',color:'#dfbe81'},
  landing:{title:'中转平台',metric:'2.200 × 3.200 m · 约7.04㎡',note:'平台顶标高2.70m；包含在楼梯总投影内，与下方卫浴上下重叠。',color:'#d5ba86'},
  approach:{title:'一楼上楼接近区',metric:'1.845 × 1.500 m · 约2.77㎡',note:'保持通行；不计入52.70㎡的吧台健身矩形。',color:'#b8b08b'},
  upper:{title:'二楼主要完整矩形',metric:'8.725 × 7.440 m · 约64.91㎡',note:'二楼整层模型楼面合计69.67㎡；此矩形包含在其中，含柱及内部通道。',color:'#c4b197'},
  'upper-side':{title:'二楼侧边楼面',metric:'1.895 × 1.800 m · 约3.41㎡',note:'已包含2.25㎡上楼到达区；属于二楼总楼面，面积不能重复相加。',color:'#a6bfc3'},
  arrival:{title:'二楼上楼到达区',metric:'1.500 × 1.500 m · 约2.25㎡',note:'包含在二楼侧边楼面中，应保持畅通。',color:'#d6bc80'},
  'upper-edge':{title:'二楼后侧窄边',metric:'宽0.160 m · 按轮廓约1.35㎡',note:'这是楼板边带，不按可布置区或正常通道使用。',color:'#b6adb8'},
  owner:{title:'一楼私用侧整体',metric:'外框8.725 × 9.400 m · 约81.97㎡',note:'包含吧台健身区、楼梯、平台下卫浴及侧边通路，是整侧合计，不能与子区域相加。',color:'#b6c7b6'},
  frame:{title:'钢架示意',metric:'尺寸显示为柱轴距',note:'轴距不等于柱间净宽；结构位置及尺寸为方案示意，未验算。',color:'#91afb8'},
  corner:{title:'轮廓与柱位细节',metric:'小凹口、入口短段与柱截面',note:'对应数字直接沿边线显示；不单独作为房间面积。',color:'#91afb8'}
 };
 // A single quiet tint for every measured block; the rectangle defines the area.
 const areaHighlightColor='#79bcb0';for(const item of Object.values(areaInfo))item.color=areaHighlightColor;
 function areaPoly(key,g,points,y){
  const sh=new THREE.Shape();points.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));sh.closePath();
  const geo=new THREE.ShapeGeometry(sh);geo.rotateX(Math.PI/2);
  const material=new THREE.MeshBasicMaterial({color:areaInfo[key].color,transparent:true,opacity:.23,depthWrite:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,material);mesh.position.y=y;mesh.userData.areaOverlay=true;g.add(mesh);
  const border=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],y+.015,p[1]))),new THREE.LineBasicMaterial({color:areaInfo[key].color,transparent:true,opacity:.85}));g.add(border);
  areaOverlays.push({key,mesh,border});
 }
 function areaRect(key,g,x,z,w,d,y){areaPoly(key,g,[[x,z],[x+w,z],[x+w,z+d],[x,z+d]],y)}
 areaPoly('office',ground,[[.125,0],[9.15,0],[9.15,7.675],[0,7.675],[0,.1],[.125,.1]],.035);
 areaRect('bar-gym',ground,10.7,0,8.725,6.04,.035);
 areaRect('corridor',ground,9.15,0,1.55,10.7,-.075);
 areaRect('bath',ground,10.77,6.09,2.16,3.1,.075);
 areaRect('landing',ground,10.75,6.04,2.2,3.2,2.725);
 areaRect('approach',ground,17.43,6.04,1.845,1.5,.035);
 areaRect('upper',upper,10.7,0,8.725,7.44,.035);
 areaRect('upper-side',upper,17.53,7.44,1.895,1.8,.035);
 areaRect('arrival',upper,17.53,7.74,1.5,1.5,.04);
 areaPoly('upper-edge',upper,[[10.7,9.24],[19.425,9.24],[19.425,9.4],[18.925,9.4],[18.925,9.3],[18.425,9.3],[18.425,9.4],[10.7,9.4]],.035);
 areaPoly('owner',ground,[[10.7,0],[19.425,0],[19.425,9.4],[18.925,9.4],[18.925,9.3],[18.425,9.3],[18.425,9.4],[10.7,9.4]],.025);
 function flightOverlay(key,z,y1,y2){
  const ps=[[12.95,y1,z],[17.43,y2,z],[17.43,y2,z+1.5],[12.95,y1,z+1.5]],geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>ps[i]),3));geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:areaInfo[key].color,transparent:true,opacity:.23,depthWrite:false,side:THREE.DoubleSide}));mesh.userData.areaOverlay=true;ground.add(mesh);
  const border=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ps.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:areaInfo[key].color,transparent:true,opacity:.85}));ground.add(border);areaOverlays.push({key,mesh,border});
 }
 flightOverlay('flight1',6.04,2.72,.18);flightOverlay('flight2',7.74,2.88,5.42);
 const gymInfo=$('#barGymInfo');let lastAreaKey=null;
 function updateArea(key,enabled){
  const item=areaInfo[key],canShow=enabled&&!!item;
  for(const o of areaOverlays){const show=canShow&&o.key===key&&visible(o.mesh.parent);o.mesh.visible=o.border.visible=show;}
  gymInfo.hidden=!canShow;
  if(canShow&&key!==lastAreaKey){
   const title=document.createElement('b'),metric=document.createElement('div'),note=document.createElement('small');
   title.style.fontWeight='500';title.style.fontSize='17px';title.textContent=item.title;
   metric.textContent=item.metric;note.textContent=item.note;gymInfo.replaceChildren(title,metric,note);gymInfo.style.borderColor=item.color;
  }
  lastAreaKey=canShow?key:null;canvas.dataset.hoverArea=canShow?key:'';canvas.dataset.areaHighlightColor=areaHighlightColor;
 }
 // Entry returns and actual small outline notches, separate detail switch.
 qdim(cornerDims,[8.88,.07,7.675],[8.88,.07,10.7],'3.025 m',1.8);
 qdim(cornerDims,[10.98,.07,9.4],[10.98,.07,10.7],'1.300 m',1.8,[0,.35,0]);
 quietLine(cornerDims,[18.675,.1,9.3],[18.9,.1,10.8]);quietText(cornerDims,'0.500 × 0.100 m',[18.9,.25,11.15],2.5);
 quietLine(cornerDims,[.06,.1,.06],[-.6,.1,-1.45]);quietText(cornerDims,'0.125 × 0.100 m',[-.6,.25,-1.65],2.5);
 quietText(cornerDims,'0.500 × 0.500 m',[18.65,.65,.75],2.5);
 // Stair footprint, both flights, landing, bathroom and arrival.
 qdim(stairDims,[10.75,.09,5.75],[17.43,.09,5.75],'6.680 m',2.0);
 qdim(stairDims,[10.47,.1,6.04],[10.47,.1,9.24],'3.200 m',1.9);
 quietText(stairDims,'4.480 × 1.500 m',[15.5,1.6,6.25],3.0);
 quietText(stairDims,'4.480 × 1.500 m',[15.5,4.5,8.9],3.0);
 outline(stairDims,10.75,6.04,2.2,3.2,2.72);
 quietText(stairDims,'2.200 × 3.200 m',[11.85,3.05,7.6],3.0);
 quietText(dims,'2.160 × 3.100 m',[11.85,1.35,8.8],2.8);
 qdim(stairDims,[17.43,.05,6.55],[19.275,.05,6.55],'1.845 m',1.8);
 // Complete upper floor rectangle, opening and side strip; no half-meeting-zone annotation.
 qdim(upperDims,[10.7,.08,-.4],[19.425,.08,-.4],'8.725 m',2.0);
 qdim(upperDims,[19.75,.08,0],[19.75,.08,7.44],'7.440 m',2.0);
 quietText(upperDims,'8.725 × 7.440 m',[15.1,.17,2.55],3.3);
 quietText(upperDims,'64.91 ㎡',[15.1,.17,3.65],1.9);
 quietText(upperDims,'6.830 × 1.800 m',[13.9,.35,8.5],2.8);
 quietText(upperDims,'1.500 × 1.500 m',[18.28,.35,8.7],2.6);
 qdim(upperDims,[17.53,.08,7.2],[19.425,.08,7.2],'1.895 m',1.9);
 scopeOverride='corridor';quietText(dims,'16.59 ㎡',[9.925,.1,4.1],1.9);scopeOverride=null;
 scopeOverride='bath';quietText(dims,'6.70 ㎡',[11.85,1.05,8.8],1.9);scopeOverride=null;
 scopeOverride='landing';quietText(stairDims,'7.04 ㎡',[11.85,3.05,8.3],1.9);scopeOverride=null;
 scopeOverride='flight1';quietText(stairDims,'6.72 ㎡',[15.5,1.6,6.85],1.9);scopeOverride=null;
 scopeOverride='flight2';quietText(stairDims,'6.72 ㎡',[15.5,4.5,8.3],1.9);scopeOverride=null;
 scopeOverride='approach';quietText(dims,'1.845 × 1.500 m',[18.35,.2,6.85],2.8);quietText(dims,'2.77 ㎡',[18.35,.2,7.35],1.9);scopeOverride=null;
 scopeOverride='arrival';quietText(upperDims,'2.25 ㎡',[18.28,.35,8.1],1.9);scopeOverride=null;
 scopeOverride='upper-side';quietText(upperDims,'1.895 × 1.800 m',[18.48,.35,7.65],2.7);quietText(upperDims,'3.41 ㎡',[18.48,.35,8.3],1.9);scopeOverride=null;
 scopeOverride='upper-edge';quietText(upperDims,'0.160 m · 1.35 ㎡',[14.7,.4,9.32],2.8);scopeOverride=null;
 // Proposed steel frame: centre-to-centre, not clear distance or verified structural spans.
 const xs=[10.82,11.70,17.70,19.29];
 for(let i=0;i<3;i++)qdim(frameDims,[xs[i],4.80,-.7],[xs[i+1],4.80,-.7],(xs[i+1]-xs[i]).toFixed(2)+' m',1.5);
 qdim(frameDims,[20.45,4.80,.13],[20.45,4.80,7.34],'7.21 m',1.7);
 qdim(frameDims,[20.45,4.80,7.34],[20.45,4.80,9.34],'2.00 m',1.7);
 function update(){
  model.updateMatrixWorld(true);
  const now=performance.now();if(now-lastHover>50){findHover();lastHover=now;}
  const enabled=$('#dimensions').checked;for(const l of quietLines)l.visible=enabled&&regionVisible(l);
  canvas.dataset.hoverDimensionRegion=focusRegion||hoverRegion;
  updateArea(focusRegion||hoverRegion,enabled);

  const occupied=[],ww=canvas.clientWidth,hh=canvas.clientHeight;
  for(const q of quietLabels){
   q.position.copy(q.userData.anchor);q.userData.leader.visible=false;let shown=$('#dimensions').checked&&regionVisible(q);
   for(let par=q.parent;par;par=par.parent)if(!par.visible)shown=false;
   q.visible=shown;if(!shown)continue;
   const wp=q.parent.localToWorld(q.userData.anchor.clone()),ndc=wp.clone().project(camera);
   const units=2*wp.distanceTo(camera.position)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,hh);
   const w=Math.max(q.userData.baseSize,q.userData.pixelWidth*units);q.scale.set(w,w/6,1);
   const sw=w/units,sh=sw/6,ox=(ndc.x+1)*ww/2,oy=(1-ndc.y)*hh/2;
   if(ndc.z>1||ndc.z< -1)continue;
   let best=null;
   for(let r=0;r<=240&&!best;r+=24){for(let k=0;k<(r?16:1);k++){
    const theta=k*Math.PI/8,x=Math.max(sw/2+5,Math.min(ww-sw/2-5,ox+Math.cos(theta)*r)),y=Math.max(sh/2+5,Math.min(hh-sh/2-45,oy+Math.sin(theta)*r));
    const rect={x:x-sw/2,y:y-sh/2,w:sw,h:sh};
    if(!occupied.some(o=>rect.x<o.x+o.w+4&&rect.x+rect.w+4>o.x&&rect.y<o.y+o.h+3&&rect.y+rect.h+3>o.y)){best={x,y,rect};break;}
   }}
   if(best){occupied.push(best.rect);const moved=new THREE.Vector3(best.x/ww*2-1,1-best.y/hh*2,ndc.z).unproject(camera);q.position.copy(q.parent.worldToLocal(moved));if(Math.hypot(best.x-ox,best.y-oy)>16){const line=q.userData.leader;line.visible=true;const at=line.geometry.attributes.position;at.setXYZ(1,q.position.x,q.position.y,q.position.z);at.needsUpdate=true;line.geometry.computeBoundingSphere();}}
  }
  canvas.dataset.barGymArea='52.699';canvas.dataset.barGymBounds='10.700,0.000,19.425,6.040';
  canvas.dataset.visibleDimensionLabels=String(quietLabels.filter(q=>q.visible&&visible(q)).length);
  const on=$('#dimensions').checked;
  dims.visible=upperDims.visible=stairDims.visible=on;
  cornerDims.visible=on&&$('#cornerDimensions').checked;
  frameDims.visible=on&&$('#frameDimensions').checked&&$('#frame').checked&&getMode()==='all';
 }
 $('#allDimensions').onchange=update;$('#dimensions').onchange=update;$('#cornerDimensions').onchange=update;$('#frameDimensions').onchange=update;update();
 const measured=new THREE.Group();scene.add(measured);const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let active=false,first=null,records=[],down;
 const stat=s=>{$('#measureStatus').textContent=s;$('#measureReadout').textContent=active?s:''};
 function dispose(g){g.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose()}});g.removeFromParent()}
 function clear(){for(const c of [...measured.children])dispose(c);first=null;records=[];stat(active?'点选起点，再点终点。':'测量已清空。')}
 function toggle(){active=!active;$('#measureToggle').textContent=active?'结束测量':'开始测量';$('#measureToggle').classList.toggle('active',active);$('#measureToggle').setAttribute('aria-pressed',String(active));canvas.style.cursor=active?'crosshair':'';controls.autoRotate=false;$('#spin').checked=false;stat(active?'点选起点，再点终点；拖动仍可旋转。':'已结束测量，结果保留。')}
 $('#measureToggle').onclick=toggle;$('#measureClear').onclick=clear;
 $('#measureUndo').onclick=()=>{if(first){dispose(first.group);first=null}else{const g=records.pop();if(g)dispose(g)}stat('已撤销；点选新的起点。')};
 $('#measureType').onchange=clear;document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',clear));
 function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}
 function within(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>z)!==(b[1]>z))&&(x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]))inside=!inside}return inside}
 function snap(p,candidates,event){if(!$('#measureSnap').checked)return p;const r=canvas.getBoundingClientRect();let best=13,result=p;for(const v of candidates){const q=v.clone().project(camera);if(q.z< -1||q.z>1)continue;const distance=Math.hypot((q.x+1)*r.width/2+r.left-event.clientX,(1-q.y)*r.height/2+r.top-event.clientY);if(distance<best){best=distance;result=v}}return result.clone()}
 function point(event){const r=canvas.getBoundingClientRect();mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);
  if($('#measureType').value==='floor'){
   const meshes=getMode()==='upper'?upperFloorMeshes:groundFloorMeshes;
   const h=ray.intersectObjects(meshes,false)[0];if(!h)return;
   const candidates=[];for(const obj of meshes){const at=obj.geometry.getAttribute('position');let max=-Infinity;const verts=[];for(let i=0;i<at.count;i++){const v=new THREE.Vector3().fromBufferAttribute(at,i).applyMatrix4(obj.matrixWorld);verts.push(v);max=Math.max(max,v.y)}for(const v of verts)if(Math.abs(v.y-max)<.001)candidates.push(v)}
   return snap(h.point,candidates,event);
  }
  const meshes=[];for(const group of [ground,upper,stairs,structure,shell])group.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.name&&o.material.opacity===1)meshes.push(o)});
  const h=ray.intersectObjects(meshes,false)[0];if(!h)return;const attr=h.object.geometry.getAttribute('position');const points=[];for(let i=0;i<attr.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(attr,i).applyMatrix4(h.object.matrixWorld));return snap(h.point,points,event);
 }
 function marker(g,p){const m=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshBasicMaterial({color:'#e06420',depthTest:false}));m.position.copy(p);m.renderOrder=120;g.add(m)}
 canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 canvas.addEventListener('pointerup',e=>{if(!active||e.button!==0||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;if(getMode()==='split'){stat('拆层状态有展示位移，请切换整体或单层后测量。');return}
  if($('#measureType').value==='floor'&&getMode()==='all'){stat('平面测量请先选“只看一楼”或“只看二楼”，避免遮挡。');return}
  const p=point(e);if(!p){stat('请点选模型范围内的位置；靠近端点可自动吸附。');return}
  if(!first){const g=new THREE.Group();measured.add(g);marker(g,p);first={p,group:g};stat('起点已选，点选终点。');return}
  const a=first.p,d=p.distanceTo(a);if(d<.001){stat('两点太近，请重新选择终点。');return}const g=first.group;marker(g,p);segment(g,a,p,'#df671e');const horizontal=Math.hypot(p.x-a.x,p.z-a.z),vertical=Math.abs(p.y-a.y);const message=`距离 ${d.toFixed(3)} m · 水平 ${horizontal.toFixed(3)} m · 高差 ${vertical.toFixed(3)} m`;text(g,`${d.toFixed(3)} m`,a.clone().add(p).multiplyScalar(.5).add(new THREE.Vector3(0,.25,0)),'#a74c20');g.userData={distance:d,horizontal,vertical};records.push(g);first=null;stat(message);canvas.dataset.lastMeasurement=JSON.stringify(g.userData);
 });
 return {isActive:()=>active,update,focusArea:(key)=>{focusRegion=key;update();}};
}
