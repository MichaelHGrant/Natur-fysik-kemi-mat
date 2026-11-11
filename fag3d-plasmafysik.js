// 3D: tokamak med snoede feltlinjer og en partikel, der følger dem
(function(){
  const S=scene3d('tok3d',{cam:[0,2.6,5.6],autoRotate:0.6,printT:6});
  const info=document.getElementById('tok3dinfo'), sq=document.getElementById('tokq');
  const R0=2.0, a=0.75, rs=0.5;
  // plasmakar
  const torus=new THREE.Mesh(new THREE.TorusGeometry(R0,a,24,80),new THREE.MeshStandardMaterial({color:0x2a3346,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false}));
  torus.rotation.x=Math.PI/2; S.scene.add(torus);
  // spoler (toroidalfelt)
  const coils=new THREE.Group(); S.scene.add(coils);
  for(let k=0;k<16;k++){ const c=new THREE.Mesh(new THREE.TorusGeometry(a*1.35,0.05,8,40),new THREE.MeshStandardMaterial({color:0xb87333,metalness:0.6,roughness:0.4}));
    const ph=2*Math.PI*k/16; c.position.set(R0*Math.cos(ph),0,R0*Math.sin(ph)); c.rotation.y=-ph; coils.add(c); }
  // central solenoide
  const sol=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,2.4,24),new THREE.MeshStandardMaterial({color:0x6b4a2a,metalness:0.5,roughness:0.5})); S.scene.add(sol);
  const P=(ph,th,r)=>new THREE.Vector3((R0+r*Math.cos(th))*Math.cos(ph), r*Math.sin(th), (R0+r*Math.cos(th))*Math.sin(ph));
  const fl=new THREE.Group(); S.scene.add(fl);
  let path=[], q=3;
  const ion=ball3(0.07,C3.gold,{emissive:0x553300}); S.scene.add(ion);
  function build(){
    q=+sq.value; clear3(fl); path=[];
    const turns=Math.ceil(q*2), n=turns*240;
    for(let i=0;i<=n;i++){ const ph=2*Math.PI*turns*i/n, th=ph/q; path.push(P(ph,th,rs)); }
    fl.add(line3(path,C3.ice,0.85));
    // en indre flade-linje
    const p2=[]; for(let i=0;i<=n;i++){ const ph=2*Math.PI*turns*i/n, th=ph/(q*0.7); p2.push(P(ph,th,0.25)); } fl.add(line3(p2,C3.vio,0.6));
    document.getElementById('tokqv').textContent=F3(q,2);
    info.innerHTML=T3(`Sikkerhedsfaktor q = <b>${F3(q,2)}</b>: feltlinjen går ${F3(q,2)} gange rundt den lange vej for hver gang den korte vej.`,
      `Safety factor q = <b>${F3(q,2)}</b>: the field line goes ${F3(q,2)} times round the long way for each time round the short way.`)+
      (Math.abs(q-Math.round(q))<0.02?T3('<br><span style="color:#f08a7a">Rationalt q: linjen lukker sig – her er plasmaet sårbart for ustabiliteter.</span>','<br><span style="color:#f08a7a">Rational q: the line closes on itself – here the plasma is vulnerable to instabilities.</span>'):'');
  }
  sq.addEventListener('input',build); build();
  S.onFrame((t)=>{ // ion bevæger sig langs feltlinjen med lille gyration
    const s=(t*0.12)%1, i=Math.floor(s*(path.length-1)), p=path[i];
    const ph=Math.atan2(p.z,p.x), g=0.08; ion.position.set(p.x+g*Math.cos(t*25)*Math.cos(ph), p.y+g*Math.sin(t*25), p.z+g*Math.cos(t*25)*Math.sin(ph)); });
})();
