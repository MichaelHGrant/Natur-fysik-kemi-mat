// 3D: svingningsmoder for en cirkulær membran (tromme): u = J_m(k r) cos(mθ) cos(ωt)
(function(){
  const S=scene3d('drum3d',{cam:[0,3.2,4.2],target:[0,-0.2,0]});
  const info=document.getElementById('drum3dinfo');
  const Z={'01':2.4048,'02':5.5201,'03':8.6537,'11':3.8317,'12':7.0156,'21':5.1356,'22':8.4172,'31':6.3802};
  function J(m,x){ // Besselfunktion via integral (Bessel 1824), 60 punkter
    let s=0; const n=60; for(let i=0;i<n;i++){ const t=Math.PI*(i+0.5)/n; s+=Math.cos(m*t-x*Math.sin(t)); } return s/n; }
  const NR=40, NT=96, R=1.6; const geo=new THREE.BufferGeometry();
  const P=new Float32Array((NR+1)*NT*3), Cc=new Float32Array((NR+1)*NT*3), base=new Float32Array((NR+1)*NT); const idx=[];
  for(let i=0;i<=NR;i++) for(let j=0;j<NT;j++){ const k=i*NT+j, r=R*i/NR, th=2*Math.PI*j/NT; P[3*k]=r*Math.cos(th); P[3*k+2]=r*Math.sin(th);
    if(i<NR){ const a=k,b=i*NT+(j+1)%NT,c=(i+1)*NT+j,d=(i+1)*NT+(j+1)%NT; idx.push(a,c,b,b,c,d); } }
  geo.setIndex(idx); geo.setAttribute('position',new THREE.BufferAttribute(P,3)); geo.setAttribute('color',new THREE.BufferAttribute(Cc,3));
  const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})); S.scene.add(mesh);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R,0.04,8,96),new THREE.MeshStandardMaterial({color:0x8a6a3a,metalness:0.5,roughness:0.5})); rim.rotation.x=Math.PI/2; S.scene.add(rim);
  let mode='01', m=0, w=1;
  function set(md){ mode=md; m=+md[0]; const k=Z[md]/R; let mx=0;
    for(let i=0;i<=NR;i++){ const jr=J(m,k*R*i/NR); for(let j=0;j<NT;j++){ const v=jr*Math.cos(m*2*Math.PI*j/NT); base[i*NT+j]=v; mx=Math.max(mx,Math.abs(v)); } }
    for(let q=0;q<base.length;q++) base[q]/=mx; w=Z[md]/Z['01'];
    info.innerHTML=T3(`Mode (${m},${md[1]}): ${m} diametrale og ${+md[1]-1} cirkulære knudelinjer · f/f<sub>01</sub> = ${F3(w,3)}`,`Mode (${m},${md[1]}): ${m} nodal diameters and ${+md[1]-1} nodal circles · f/f<sub>01</sub> = ${F3(w,3)}`); }
  const col=new THREE.Color();
  function frame(t){ const c=Math.cos(2.5*w*t); for(let q=0;q<base.length;q++){ const u=0.45*base[q]*c; P[3*q+1]=u;
      const s=base[q]*c; col.setRGB(0.5+0.5*Math.max(0,s), 0.45+0.15*(1-Math.abs(s)), 0.5+0.5*Math.max(0,-s)); if(Math.abs(base[q])<0.04) col.setRGB(0.95,0.85,0.5); Cc[3*q]=col.r;Cc[3*q+1]=col.g;Cc[3*q+2]=col.b; }
    geo.attributes.position.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals(); }
  S.onFrame(t=>frame(t));
  (window.__printPrep=window.__printPrep||[]).push(()=>frame(0));
  chips('#drumsel button',b=>set(b.dataset.m)); set('01');
})();
