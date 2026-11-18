// Proposed terminals. Coordinates use the 18F plan axes, before the scene's Z reflection.
export function makeAirLayout({THREE, box, datum, roofUnderside, existingOutlet}) {
  const group=new THREE.Group(), units=[];
  group.name='proposed-air-equipment';
  const enamel=new THREE.MeshStandardMaterial({color:'#e1e3da',roughness:.65});
  const metal=new THREE.MeshStandardMaterial({color:'#a6b4b3',roughness:.72});
  const trim=new THREE.MeshStandardMaterial({color:'#607675',roughness:.55});
  const recess=new THREE.MeshStandardMaterial({color:'#435756',roughness:.85});

  function unit(id,description,x,y,z) {
    const root=new THREE.Group();
    root.name=id;root.userData={id,description};root.position.set(x,y,z);group.add(root);
    units.push({id,description,x,y,z,root});
    return root;
  }
  function cassette(id,description,x,z,supportY) {
    const y=supportY-.34, root=unit(id,description,x,y,z);
    box(root,-.37,.055,-.37,.74,.23,.74,metal);
    for(const a of [-.31,.31]) for(const b of [-.31,.31]){
      box(root,a-.012,.285,b-.012,.024,.055,.024,trim);
    }
    box(root,-.435,0,-.435,.87,.06,.87,enamel);
    box(root,-.21,-.008,-.21,.42,.008,.42,recess);
    for(let i=0;i<9;i++)box(root,-.202,-.012,-.196+i*.047,.404,.005,.019,metal);
    for(const t of [-.325,.325]){
      box(root,-.26,-.007,t-.024,.52,.007,.048,trim);
      box(root,t-.024,-.007,-.26,.048,.007,.52,trim);
    }
  }
  cassette('AC01','夹层下 · 吸顶机',15.88,3.05,datum.steelTop);
  cassette('AC02','夹层上 · 吸顶机',15.88,4.40,roofUnderside);

  // Casing against the open bay's solid wall. The old outlet is covered by
  // an adapter, so there are two discharge faces in the proposed layout.
  existingOutlet.geometry.computeBoundingBox();
  const mouth=existingOutlet.geometry.boundingBox.clone();
  mouth.translate(existingOutlet.position);
  const wallFace=7.675-.06;
  const y=mouth.min.y-.33, wallDuctFace=wallFace-.34;
  const openWidth=9.15, centers=[openWidth/4,openWidth*3/4];
  const halfGrille=.56, left=centers[0]-halfGrille, right=centers[1]+halfGrille;

  box(group,mouth.min.x,y+.02,mouth.min.z,mouth.max.x-mouth.min.x,mouth.min.y-(y+.02),wallDuctFace-mouth.min.z,metal);
  box(group,left,y,wallDuctFace,right-left,.33,.34,metal).name='proposed-connected-wall-duct';
  for(const [i,x] of centers.entries()){
    const root=unit('V0'+(i+1),'挑空侧 · 沿墙送风口',x,y+.165,wallDuctFace);
    box(root,-halfGrille,-.108,-.022,halfGrille*2,.216,.022,enamel);
    box(root,-.522,-.081,-.029,1.044,.162,.007,recess);
    for(const dy of [-.061,-.021,.019,.059])box(root,-.513,dy,-.036,1.026,.018,.008,trim);
  }
  return {group,units};
}
