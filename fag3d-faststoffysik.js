// 3D: krystalgitre og Miller-planer
(function(){
  const S=scene3d('kr3d',{cam:[4.6,3.4,5.6],target:[1,1,1],autoRotate:0.8});
  const info=document.getElementById('kr3dinfo'); let typ='fcc', hkl=null, N=2;
  const G=new THREE.Group(); S.scene.add(G);
  const BASIS={sc:[[0,0,0]], bcc:[[0,0,0],[.5,.5,.5]], fcc:[[0,0,0],[.5,.5,0],[.5,0,.5],[0,.5,.5]],
    diamant:[[0,0,0],[.5,.5,0],[.5,0,.5],[0,.5,.5],[.25,.25,.25],[.75,.75,.25],[.75,.25,.75],[.25,.75,.75]],
    nacl:[[0,0,0],[.5,.5,0],[.5,0,.5],[0,.5,.5],[.5,0,0],[0,.5,0],[0,0,.5],[.5,.5,.5]]};
  const NAME={sc:T3('Simpelt kubisk (polonium)','Simple cubic (polonium)'),bcc:T3('Rumcentreret kubisk (jern, natrium)','Body-centred cubic (iron, sodium)'),fcc:T3('Fladecentreret kubisk (kobber, guld)','Face-centred cubic (copper, gold)'),diamant:T3('Diamant (kulstof, silicium)','Diamond (carbon, silicon)'),nacl:T3('Stensalt NaCl','Rock salt NaCl')};
  function build(){
    clear3(G); const B=BASIS[typ], pts=[];
    for(let i=0;i<N;i++)for(let j=0;j<N;j++)for(let k=0;k<N;k++) B.forEach((b,bi)=>pts.push([i+b[0],j+b[1],k+b[2],bi]));
    // også atomer på de yderste flader (x=N osv.)
    const all=[]; const key=p=>p.slice(0,3).map(v=>v.toFixed(3)).join(',');
    const seen=new Set(); pts.forEach(p=>{ for(const dx of [0,N])for(const dy of [0,N])for(const dz of [0,N]){ const q=[p[0]+dx,p[1]+dy,p[2]+dz,p[3]]; if(q[0]<=N+1e-6&&q[1]<=N+1e-6&&q[2]<=N+1e-6&&(dx===0||p[0]<1e-6)&&(dy===0||p[1]<1e-6)&&(dz===0||p[2]<1e-6)){const k=key(q); if(!seen.has(k)){seen.add(k); all.push(q);}} } });
    const isNa=p=>typ==='nacl'&&p[3]>=4, isB=p=>typ==='diamant'&&p[3]>=4;
    const r=typ==='nacl'?0.13:typ==='diamant'?0.1:typ==='sc'?0.18:0.14;
    all.forEach(p=>{ const b=ball3(isNa(p)?0.09:r, isNa(p)?C3.vio:isB(p)?C3.ice:C3.gold,{seg:16}); b.position.set(p[0],p[1],p[2]); G.add(b); });
    if(typ==='diamant'){ // bindinger
      const A=all.filter(p=>p[3]<4), Bv=all.filter(p=>p[3]>=4);
      Bv.forEach(b=>A.forEach(a=>{ const d=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]); if(Math.abs(d-0.433)<0.01) G.add(line3([[a[0],a[1],a[2]],[b[0],b[1],b[2]]],C3.dim)); })); }
    // celle-kanter
    for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){ G.add(line3([[i,j,0],[i,j,N]],0x33405e)); G.add(line3([[i,0,j],[i,N,j]],0x33405e)); G.add(line3([[0,i,j],[N,i,j]],0x33405e)); }
    if(hkl){ const [h,k,l]=hkl; // plan h x + k y + l z = 1 i første celle (+ et parallelt)
      for(const c of [1,2]){ const geo=planeGeo(h,k,l,c); if(geo){ const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:C3.red,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false})); G.add(m);} } }
    info.innerHTML=`<b>${NAME[typ]}</b><br>`+T3(`${B.length} atomer pr. celle`,`${B.length} atoms per cell`)+(typ==='fcc'?T3(' · tætteste kuglepakning (74 %)',' · densest sphere packing (74 %)'):typ==='bcc'?' · 68 %':typ==='sc'?' · 52 %':'')+(hkl?`<br>${T3('Plan','Plane')} (${hkl.join('')}) · d = a/√${hkl[0]**2+hkl[1]**2+hkl[2]**2}`:'');
  }
  function planeGeo(h,k,l,c){ // polygon: skæring mellem planet hx+ky+lz=c og kuben [0,N]^3
    const P=[]; const E=[]; for(const a of [0,N])for(const b of [0,N]){ E.push([[0,a,b],[N,a,b]],[[a,0,b],[a,N,b]],[[a,b,0],[a,b,N]]); }
    E.forEach(([p,q])=>{ const fp=h*p[0]+k*p[1]+l*p[2]-c, fq=h*q[0]+k*q[1]+l*q[2]-c; if(fp*fq<0||(fp===0&&fq!==0)){ const t=fp/(fp-fq); P.push(new THREE.Vector3(p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1]),p[2]+t*(q[2]-p[2]))); } });
    if(P.length<3) return null;
    const cen=P.reduce((s,v)=>s.add(v),new THREE.Vector3()).divideScalar(P.length), n=new THREE.Vector3(h,k,l).normalize();
    const u=new THREE.Vector3().subVectors(P[0],cen).normalize(), w=new THREE.Vector3().crossVectors(n,u);
    P.sort((a,b)=>Math.atan2(new THREE.Vector3().subVectors(a,cen).dot(w),new THREE.Vector3().subVectors(a,cen).dot(u))-Math.atan2(new THREE.Vector3().subVectors(b,cen).dot(w),new THREE.Vector3().subVectors(b,cen).dot(u)));
    const pos=[]; for(let i=1;i<P.length-1;i++){ [P[0],P[i],P[i+1]].forEach(v=>pos.push(v.x,v.y,v.z)); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); return g; }
  chips('#krtyp button',b=>{typ=b.dataset.t;build();});
  chips('#krhkl button',b=>{hkl=b.dataset.h==='0'?null:b.dataset.h.split('').map(Number);build();});
  build();
})();
