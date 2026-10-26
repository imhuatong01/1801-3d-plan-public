import * as THREE from 'three';

// Spatial reservations only. No member sizing, capacity or original-floor support is verified.
export function setupSupportStudy({model,ground,box,label,mat,trainingMat}) {
  const reserve=new THREE.Group(),furnishings=new THREE.Group();
  model.add(reserve);ground.add(furnishings);
  const candidateLabels=[];
  const z=5.69, xs=[13.55,14.65,15.75,16.75];
  function dashed(points,color=0xbc781c){
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineDashedMaterial({color,dashSize:.12,gapSize:.08}));
    line.computeLineDistances();reserve.add(line);return line;
  }
  xs.forEach((x,i)=>{
    // 180mm translucent shape only identifies the location. Not a proposed steel section.
    box(reserve,x-.09,0,z-.09,.18,5.12,.18,mat('#d79128',.48));
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.18,5.12,.18)),new THREE.LineBasicMaterial({color:'#a76616'}));
    outline.position.set(x,2.56,z);reserve.add(outline);
    const left=Math.max(10.7,Math.min(18.925,x-.25));
    dashed([[left,.025,z-.25],[left+.5,.025,z-.25],[left+.5,.025,z+.25],[left,.025,z+.25],[left,.025,z-.25]]);
    candidateLabels.push(label(reserve,`C${i+1} · 候选柱位`,x,5.34,z,'#a66b20',i===0||i===3?1.65:2.1));
  });
  dashed([[13.55,5.17,z],[16.75,5.17,z]]);
  // Single furniture band along the outer edge of the inner first flight; candidate locations only, not verified supports.
  const cabinetMat=mat('#a79980');
  for(const [x,w] of [[16.5,.5]]){
    box(furnishings,x,0,z-.225,w,1.05,.45,cabinetMat);
    box(furnishings,x,1.05,z-.245,w,.04,.49,mat('#cfb38b'));
    for(let dx=.45;dx<w;dx+=.55)box(furnishings,x+dx,.08,z+.228,.012,.89,.008,mat('#787a72'));
  }
  // Move only the exercise mat away from candidate C3; no equipment is attached to a candidate post.
  box(furnishings,16.5,.005,.2,1.8,.012,2.4,mat('#657c7d'));
  candidateLabels.push(label(reserve,'沿楼梯外侧低柜 · 不承重',16.75,1.35,5.20,'#84663b',3.6));
  const checkbox=document.querySelector('#supportReserve');let mode='all';
  function update(nextMode=mode){
    mode=nextMode;
    const enabled=checkbox.checked;
    reserve.visible=enabled&&(mode==='all'||mode==='ground'||mode==='split');
    furnishings.visible=enabled&&document.querySelector('#furniture').checked;
    trainingMat.visible=!enabled&&document.querySelector('#furniture').checked;
  }
  checkbox.onchange=()=>update();update();
  return {update,labels:candidateLabels,reserve};
}
