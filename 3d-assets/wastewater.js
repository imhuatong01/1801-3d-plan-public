// Conceptual route only. The outlet in the 17F ceiling space has not been surveyed.
export function makeWastewater({THREE,box,datum,storeyGap,wet,wetWalls}) {
  const group=new THREE.Group();group.name='sanitary-waste-18F-to-17F';
  const room=wet.clone(true);room.position.y=datum.lowerFinish;
  const glazing=room.children[wet.children.indexOf(wetWalls)];
  const faded=new THREE.MeshStandardMaterial({color:'#8fa6a3',transparent:true,opacity:.12,depthWrite:false});
  glazing.traverse(o=>{if(o.isMesh)o.material=faded;});
  // Let the collector remain visible through the raised waterproof floor.
  for(const mesh of room.children)if(mesh.isMesh&&mesh.geometry.parameters?.width>2)mesh.material=faded;
  group.add(room);
  const {drain,basin}=datum.wetFixtures;
  const top=datum.wetFloorFinish,joinX=10.98,joinZ=7.78;
  const green=new THREE.MeshBasicMaterial({color:'#057769'});
  const pipe=(a,b)=>{
    const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);
    const segment=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,v.length(),12),green);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());segment.position.copy(p).lerp(q,.5);group.add(segment);
  };
  const mergeX=11.144;
  const merge=[mergeX,top-.073,joinZ],drop=[joinX,top-.075,joinZ];
  const connect=pts=>{for(let i=1;i<pts.length;i++)pipe(pts[i-1],pts[i]);};
  // Both branches approach the common collector on 45-degree junctions in plan.
  const showerTurn=11.57,basinTurn=11.372;
  connect([[drain.x,top,drain.z],[drain.x,top-.039,drain.z],
    [showerTurn,top-.05,drain.z],[showerTurn,top-.062,joinZ-(showerTurn-mergeX)],merge]);
  connect([[basin.x,top+.73,basin.z],[basin.x,top-.044,basin.z],
    [basinTurn,top-.049,basin.z],[basinTurn,top-.065,joinZ+(basinTurn-mergeX)],merge]);
  const endY=datum.lowerFinish-.64;
  connect([merge,drop,[joinX,endY,joinZ]]);
  group.add(new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(joinX,endY+.38,joinZ),.36,0x057769,.15,.13));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.09,.013,8,36),green);
  ring.rotation.x=Math.PI/2;ring.position.set(joinX,endY,joinZ);group.add(ring);
  box(group,10.52,datum.lowerFinish-.16,5.86,2.65,.16,3.56,faded);
  const floor17=datum.lowerFinish-storeyGap;
  box(group,10.52,floor17-.04,5.86,2.65,.04,3.56,faded);
  return {group,endY,joinX,joinZ,floor17};
}
