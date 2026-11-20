// Proposed terminals. Coordinates use the 18F plan axes, before the scene's Z reflection.
//
// 分区方案（2026-11-19 重排）。灰白色 = 现场既有；彩色 = 新增，一个分区一种颜色。
//   分区 1 · 开放办公区（x 0~9.15）  青绿  既有预留风口箱 + 一条新支管（V01），带风阀（VD1）
//   分区 2 · 夹层上                  琥珀  AC02 吸顶机，独立线控器
//   分区 3 · 夹层下                  蓝紫  AC01 吸顶机，独立线控器
// 空调（AC01、AC02）和既有风管、风口保持原高度，没有下移。新增支管底面与既有风管底面齐平（5.95），
// 比既有送风箱底面（5.50）还高，不额外占用开放区净空。
// 所有从照片估出来的尺寸，待现场核尺。
export function makeAirLayout({THREE, box, datum, roofUnderside, existingOutlet}) {
  const group=new THREE.Group(), units=[];
  group.name='proposed-air-equipment';
  const zones={
    1:{name:'分区 1',duct:'#2fa39b',trim:'#17615c',face:'#bfe9e4'},
    2:{name:'分区 2',duct:'#e3a23b',trim:'#8d5d12',face:'#f6dfaa'},
    3:{name:'分区 3',duct:'#5b82d8',trim:'#26427f',face:'#c5d4f5'}
  };
  const mats={};
  for(const [k,z] of Object.entries(zones)){
    mats[k]={
      duct:new THREE.MeshStandardMaterial({color:z.duct,roughness:.6}),
      trim:new THREE.MeshStandardMaterial({color:z.trim,roughness:.55}),
      face:new THREE.MeshStandardMaterial({color:z.face,roughness:.6}),
      recess:new THREE.MeshStandardMaterial({color:'#2d3d3f',roughness:.85})
    };
  }

  function unit(id,description,x,y,z) {
    const root=new THREE.Group();
    root.name=id;root.userData={id,description};root.position.set(x,y,z);group.add(root);
    units.push({id,description,x,y,z,root});
    return root;
  }
  function cassette(id,description,zone,x,z,supportY) {
    const m=mats[zone], y=supportY-.34, root=unit(id,description,x,y,z);
    box(root,-.37,.055,-.37,.74,.23,.74,m.duct);
    for(const a of [-.31,.31]) for(const b of [-.31,.31]){
      box(root,a-.012,.285,b-.012,.024,.055,.024,m.trim);
    }
    box(root,-.435,0,-.435,.87,.06,.87,m.face);
    box(root,-.21,-.008,-.21,.42,.008,.42,m.recess);
    for(let i=0;i<9;i++)box(root,-.202,-.012,-.196+i*.047,.404,.005,.019,m.trim);
    for(const t of [-.325,.325]){
      box(root,-.26,-.007,t-.024,.52,.007,.048,m.trim);
      box(root,t-.024,-.007,-.26,.048,.007,.52,m.trim);
    }
    return root;
  }
  // 分区 3 夹层下、分区 2 夹层上：位置和高度与上一版一致，没有改动。
  cassette('AC01','分区 3 · 夹层下 · 吸顶机 · 可单独开(独立线控器)',3,15.88,3.05,datum.steelTop);
  cassette('AC02','分区 2 · 夹层上 · 吸顶机 · 可单独开(独立线控器)',2,15.88,4.40,roofUnderside);

  // ---- 分区 1：开放办公区 -------------------------------------------------------------------
  // 既有数据由 site-services.js 通过 existingOutlet.userData.duct 提供；缺省值是 2026-11-19 校正后的照片估计。
  existingOutlet.geometry.computeBoundingBox();
  const mouth=existingOutlet.geometry.boundingBox.clone();
  mouth.translate(existingOutlet.position);
  const d=Object.assign({ductBottom:5.95,ductHeight:.55,boxBottom:5.50,boxTop:6.25,boxLeft:4.35,boxNear:5.45,
    boxFar:7.50,innerEdge:5.40,runEndX:6.25,wallZ:7.57},existingOutlet.userData.duct||{});
  const m1=mats[1];
  const bottom=d.ductBottom;              // 新支管底面 = 既有风管底面（不下移）
  const bh=.28, bw=.50;                   // 支管截面 500 × 280，照片估计，待深化

  function exitFlange(x,y,z,w,h,dd,mat){const f=box(group,x,y,z,w,h,dd,mat);f.name='proposed-zone1-flange';return f;}
  function diffuser(id,description,cx,cz,len,wid){
    const root=unit(id,description,cx,bottom,cz);
    box(root,-len/2,-.012,-wid/2,len,.012,wid,m1.trim).name=id+'-frame';
    box(root,-len/2+.04,-.016,-wid/2+.04,len-.08,.004,wid-.08,m1.recess);
    for(let i=0;i<5;i++)box(root,-len/2+.05,-.022,-wid/2+.07+i*(wid-.14)/4,len-.10,.008,.022,m1.face);
    return root;
  }
  function damper(id,description,cx,cz){
    // 标签锚点放在支管上方 0.45 m，避免和下方风口标签叠在一起。
    const lift=.45, root=unit(id,description,cx,bottom+bh/2+lift,cz);
    box(root,-.15,-bh/2-.03-lift,-bw/2-.03,.30,bh+.06,bw+.06,m1.trim).name=id+'-body';
    box(root,-.02,bh/2+.03-lift,-.03,.04,.12,.06,m1.face);     // 执行器
    return root;
  }

  // 支管 B1：从既有送风箱 x- 侧面开口，沿 -x 走到后半区。贴着风管底面高度，位于送风箱和后墙脚设备之间的空档。
  const b1z=6.05-bw/2, b1x2=1.75;
  const b1=box(group,b1x2,bottom,b1z,d.boxLeft-b1x2,bh,bw,m1.duct);
  b1.name='proposed-zone1-branch-B1';
  exitFlange(d.boxLeft-.05,bottom-.03,b1z-.03,.05,bh+.06,bw+.06,m1.trim);
  diffuser('V01','分区 1 · 可单独开 · 后半区风口 · 接既有预留风口箱',2.45,6.05,.9,.40);
  damper('VD1','分区 1 · 风阀 VD1(B1)',3.85,6.05);

  // 区域标签：跟着 office-height-only.js 里的 airLabels 一起显示/隐藏。
  const banners=new THREE.Group();banners.name='proposed-air-zone-banners';group.add(banners);
  const baseUpdate=banners.updateMatrixWorld;
  banners.updateMatrixWorld=function(force){
    const tags=group.children.find(c=>c!==banners&&c.isGroup&&c.children.length&&c.children.every(k=>k.isSprite));
    this.visible=!!(tags&&tags.visible);
    baseUpdate.call(this,force);
  };
  const font='700 52px "Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans GB",sans-serif';
  function banner(text,color,x,y,z){
    const probe=document.createElement('canvas').getContext('2d');probe.font=font;
    const tw=Math.ceil(probe.measureText(text).width),c=document.createElement('canvas');
    c.width=tw+64;c.height=96;
    const ctx=c.getContext('2d');ctx.fillStyle='#fffffff2';ctx.beginPath();ctx.roundRect(3,3,c.width-6,90,26);ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=6;ctx.stroke();
    ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,c.width/2,50);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,toneMapped:false,sizeAttenuation:false}));
    s.position.set(x,y,z);s.renderOrder=51;s.name='zone-banner';
    const aspect=c.width/c.height;
    s.onBeforeRender=(renderer,scene,camera)=>{
      const k=27*2*Math.tan(camera.fov*Math.PI/360)/Math.max(1,renderer.domElement.clientHeight);
      if(Math.abs(s.scale.y-k)>1e-6){s.scale.set(k*aspect,k,1);s.updateMatrixWorld(true);}
    };
    s.scale.set(.03*aspect,.03,1);
    banners.add(s);
    return s;
  }
  banner('分区 1 · 开放办公区 · 可单独开',zones[1].trim,4.6,3.1,2.4);
  banner('分区 2 · 夹层上 · 可单独开',zones[2].trim,14.2,5.7,1.5);
  banner('分区 3 · 夹层下 · 可单独开',zones[3].trim,14.2,2.3,1.5);

  return {group,units};
}
