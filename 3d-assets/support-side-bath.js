import * as THREE from 'three';

// Spatial reservations only. No member sizing, capacity or original-floor support is verified.
export function setupSupportStudy({model,ground,box,label,mat,trainingMat,supportHeight=5.12}) {
  const reserve=new THREE.Group(),furnishings=new THREE.Group();
  model.add(reserve);ground.add(furnishings);
  const candidateLabels=[];
  const z=5.69;
  // The four yellow candidate-post markers and their orange reference graphics were removed at the user's request.
  // Single furniture band along the outer edge of the inner first flight; candidate locations only, not verified supports.
  const cabinetMat=mat('#a79980');
  for(const [x,w] of [[16.5,.5]]){
    box(furnishings,x,0,z-.225,w,1.05,.45,cabinetMat);
    box(furnishings,x,1.05,z-.245,w,.04,.49,mat('#cfb38b'));
    for(let dx=.45;dx<w;dx+=.55)box(furnishings,x+dx,.08,z+.228,.012,.89,.008,mat('#787a72'));
  }
  // Move only the exercise mat away from candidate C3; no equipment is attached to a candidate post.
  box(furnishings,16.5,.005,.2,1.8,.012,2.4,mat('#657c7d'));
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
