// 3D: Flamms paraboloide (Schwarzschild-rumtidens rumlige indlejring) med en præcesserende bane
(function(){
  const S=scene3d('gr3d',{cam:[0,7,11],target:[0,-1.5,0]});
  const info=document.getElementById('gr3dinfo'), Ls=document.getElementById('grL');
  const rs=1, Rmax=12, sc=0.6;
  const zf=r=>2*Math.sqrt(rs*(r-rs)); // Flamm: z = 2√(rs(r−rs))
  const NR=50,NT=72, geo=new THREE.BufferGeometry(), P=[], idx=[];
  for(let i=0;i<=NR;i++){ const r=rs+(Rmax-rs)*Math.pow(i/NR,1.6); for(let j=0;j<NT;j++){ const a=2*Math.PI*j/NT; P.push(sc*r*Math.cos(a), sc*(zf(r)-zf(Rmax)), sc*r*Math.sin(a)); if(i<NR){ const k=i*NT+j,b=i*NT+(j+1)%NT; idx.push(k,k+NT,b,b,k+NT,b+NT); } } }
  geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); geo.setIndex(idx); geo.computeVertexNormals();
  S.scene.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x4a5878,wireframe:true,transparent:true,opacity:0.35})));
  S.scene.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:0x1a2235,side:THREE.DoubleSide,transparent:true,opacity:0.6})));
  const hole=ball3(sc*rs*0.9,0x000000); hole.position.y=sc*(zf(rs)-zf(Rmax)); S.scene.add(hole);
  const planet=ball3(0.18,C3.gold2,{emissive:0x664400}); S.scene.add(planet);
  let orbit=null, path=[], k=0;
  function integrate(){ // geodætisk banligning u'' + u = M/L² + 3M u², M = rs/2 (G=c=1)
    const M=rs/2, L=+Ls.value; const r0=11; let u=1/r0, du=0, phi=0, h=0.004; path=[];
    const f=(u)=>M/(L*L)-u+3*M*u*u;
    for(let n=0;n<7000;n++){ // RK4 i φ
      const k1u=du,k1v=f(u), k2u=du+h/2*k1v,k2v=f(u+h/2*k1u), k3u=du+h/2*k2v,k3v=f(u+h/2*k2u), k4u=du+h*k3v,k4v=f(u+h*k3u);
      u+=h/6*(k1u+2*k2u+2*k3u+k4u); du+=h/6*(k1v+2*k2v+2*k3v+k4v); phi+=h; const r=1/u;
      if(r<=rs*1.01||r>Rmax){ break; } if(n%3==0) path.push([r,phi]); }
    if(orbit){ S.scene.remove(orbit); orbit.geometry.dispose(); }
    const pts=path.map(([r,p])=>new THREE.Vector3(sc*r*Math.cos(p), sc*(zf(r)-zf(Rmax))+0.05, sc*r*Math.sin(p)));
    orbit=line3(pts,C3.gold,0.85); S.scene.add(orbit); k=0;
    const rmin=Math.min(...path.map(p=>p[0])); const fell=rmin<=rs*1.02;
    info.innerHTML=fell?T3(`L = ${F3(L,2)} r<sub>s</sub>c: impulsmomentet er for lille – planeten styrter ind gennem begivenhedshorisonten.`,`L = ${F3(L,2)} r<sub>s</sub>c: the angular momentum is too small – the planet plunges through the event horizon.`)
      :T3(`L = ${F3(L,2)} r<sub>s</sub>c · perihelium ${F3(rmin,1)} r<sub>s</sub>. Banen lukker sig ikke – den præcesserer (rosetbane).`,`L = ${F3(L,2)} r<sub>s</sub>c · periapsis ${F3(rmin,1)} r<sub>s</sub>. The orbit does not close – it precesses (rosette orbit).`); }
  S.onFrame((t,dt)=>{ if(!path.length) return; k=(k+dt*60*2)%path.length; const [r,p]=path[Math.floor(k)]; planet.position.set(sc*r*Math.cos(p), sc*(zf(r)-zf(Rmax))+0.18, sc*r*Math.sin(p)); });
  Ls.oninput=integrate; integrate();
})();
