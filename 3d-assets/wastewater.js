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
  const top=datum.wetFloorFinish,joinX=10.90,joinZ=7.95;
  const green=new THREE.MeshBasicMaterial({color:'#057769'});
  const pipe=(a,b)=>{
    const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),v=q.clone().sub(p);
    const segment=new THREE.Mesh(new THREE.CylinderGeometry(.027,.027,v.length(),12),green);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());segment.position.copy(p).lerp(q,.5);group.add(segment);
  };
  const connect=pts=>{for(let i=1;i<pts.length;i++)pipe(pts[i-1],pts[i]);};
  // Main route: buried in the raised floor, straight to the entrance door. The basin joins it on a swept junction.
  connect([[drain.x,top,drain.z],[drain.x,top-.055,drain.z],[10.50,top-.062,7.95],[9.925,top-.096,10.70]]);
  connect([[basin.x,top+.73,basin.z],[basin.x,top-.05,basin.z],[10.62,top-.056,basin.z],[10.28,top-.076,9.00]]);
  const endY=datum.lowerFinish-.64;
  // Alternative only: drop through the slab to the 17F ceiling zone.
  connect([[joinX,top-.058,joinZ],[joinX,endY,joinZ]]);
  group.add(new THREE.ArrowHelper(new THREE.Vector3(0,-1,0),new THREE.Vector3(joinX,endY+.38,joinZ),.36,0x057769,.15,.13));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.09,.013,8,36),green);
  ring.rotation.x=Math.PI/2;ring.position.set(joinX,endY,joinZ);group.add(ring);
  box(group,10.52,datum.lowerFinish-.16,datum.platformZ0-.18,2.65,.16,datum.platformZ1-datum.platformZ0+.36,faded);
  const floor17=-storeyGap;
  box(group,10.52,floor17-.04,datum.platformZ0-.18,2.65,.04,datum.platformZ1-datum.platformZ0+.36,faded);
  return {group,endY,joinX,joinZ,floor17};
}
