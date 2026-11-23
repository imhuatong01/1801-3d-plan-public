import * as THREE from 'three';

// Spatial reservations only. No member sizing, capacity or original-floor support is verified.
export function setupSupportStudy({model,ground,box,label,mat,trainingMat,supportHeight=5.12}) {
  const reserve=new THREE.Group(),furnishings=new THREE.Group();
  model.add(reserve);ground.add(furnishings);
  const candidateLabels=[];
  // The four yellow candidate-post markers and their orange reference graphics were removed at the user's request.
  // The old candidate cabinet and the small exercise mat of this study were removed too (2026-11-23): the
  // cabinet stood in the stair aisle. The boxing mat is the only mat now, shown with the furniture.
  const checkbox=document.querySelector('#supportReserve');let mode='all';
  function update(nextMode=mode){
    mode=nextMode;
    const enabled=checkbox.checked;
    reserve.visible=enabled&&(mode==='all'||mode==='ground'||mode==='split');
    furnishings.visible=false;
    trainingMat.visible=document.querySelector('#furniture').checked;
  }
  checkbox.onchange=()=>update();update();
  return {update,labels:candidateLabels,reserve};
}
