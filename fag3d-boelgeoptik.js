// 3D: bølgekar – interferens fra en, to eller flere punktkilder
(function(){
  const S=scene3d('rip3d',{cam:[0,8.5,6.5],target:[0,0,0.3],printT:3.3});
  const info=document.getElementById('rip3dinfo'), sd=onRange('ripd',upd), sl=onRange('ripl',upd);
  let N=2;
  chips('#ripn button',b=>{N=+b.dataset.n;upd();});
  const n=150, L=10;
  const geo=new THREE.PlaneGeometry(L,L,n,n); geo.rotateX(-Math.PI/2);
  const col=new Float32Array((n+1)*(n+1)*3); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})); S.scene.add(mesh);
  const srcG=new THREE.Group(); S.scene.add(srcG);
  let src=[], k=2*Math.PI/0.8;
  function upd(){ const d=+sd.value, lam=+sl.value; k=2*Math.PI/lam; document.getElementById('ripdv').textContent=F3(d,1); document.getElementById('riplv').textContent=F3(lam,2);
    src=[]; for(let i=0;i<N;i++){ const x=N===1?0:-d/2+d*i/(N-1)*1; src.push([N>2?(i-(N-1)/2)*d/2:x,-L/2+0.3]); }
    if(N===2) src=[[-d/2,-L/2+0.3],[d/2,-L/2+0.3]];
    clear3(srcG); src.forEach(s=>{const b=ball3(0.09,C3.red,{emissive:0x551111}); b.position.set(s[0],0.25,s[1]); srcG.add(b);});
    const dd=N===2?d:d/2, th=Math.asin(Math.min(1,lam/dd))*180/Math.PI;
    info.innerHTML=T3(`${N} kilde${N>1?'r':''} · λ = ${F3(lam,2)} · d = ${F3(dd,2)}`,`${N} source${N>1?'s':''} · λ = ${F3(lam,2)} · d = ${F3(dd,2)}`)+(N>1?`<br>${T3('1. orden','1st order')}: sin θ = λ/d → θ = <b>${dd>lam?F3(th,1)+'°':'–'}</b>`:''); }
  upd();
  const pos=geo.attributes.position, c1=new THREE.Color(0x0a1a40), c2=new THREE.Color(0x2f6fb0), c3=new THREE.Color(0xe8f4ff), tmp=new THREE.Color();
  S.onFrame(t=>{ const w=2*Math.PI*0.8;
    for(let i=0;i<pos.count;i++){ const x=pos.getX(i), z=pos.getZ(i); let h=0;
      for(const s of src){ const r=Math.hypot(x-s[0],z-s[1])+0.05; h+=Math.cos(k*r-w*t)/Math.sqrt(r); }
      h/=Math.sqrt(N); h=Math.max(-2.5,Math.min(2.5,h)); pos.setY(i,h*0.16); const v=Math.max(-1,Math.min(1,h*0.9));
      if(v<0) tmp.copy(c2).lerp(c1,-v); else tmp.copy(c2).lerp(c3,v); col[3*i]=tmp.r; col[3*i+1]=tmp.g; col[3*i+2]=tmp.b; }
    pos.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals(); });
})();
