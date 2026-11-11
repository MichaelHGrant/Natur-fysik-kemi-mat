// 3D: Abrikosov-hvirvelgitter i en type II-superleder; tæthed ∝ B, a ≈ 1,075 √(Φ0/B)
(function(){
  const S=scene3d('vort3d',{cam:[6,6.5,8],target:[0,0,0]});
  const info=document.getElementById('vort3dinfo'), bs=document.getElementById('vortB');
  const L=3, Hh=0.8;
  const slab=new THREE.Mesh(new THREE.BoxGeometry(2*L,2*Hh,2*L),new THREE.MeshStandardMaterial({color:0x3a4a70,transparent:true,opacity:0.22,roughness:0.3,metalness:0.4,depthWrite:false}));
  S.scene.add(slab); const ed=new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry),new THREE.LineBasicMaterial({color:0x6b7896})); S.scene.add(ed);
  const G=new THREE.Group(); S.scene.add(G); let cores=[];
  const cyl=new THREE.CylinderGeometry(1,1,2*Hh+1.6,14,1,true);
  function build(){ clear3(G); cores=[]; const b=+bs.value; if(b>=1){ info.innerHTML=T3('B ≥ B<sub>c2</sub>: hvirvlernes kerner overlapper – metallet er blevet normalt.','B ≥ B<sub>c2</sub>: the vortex cores overlap – the metal has become normal.'); slab.material.color.set(0x7a5a40); return; }
    slab.material.color.set(0x3a4a70);
    const a=0.62/Math.sqrt(Math.max(b,0.02)), xi=0.06, lam=Math.min(0.9,a*0.8);
    const n=Math.ceil(L/a)+1; let N=0;
    for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){ const x=a*(i+j/2), z=a*j*Math.sqrt(3)/2; if(Math.abs(x)>L-0.05||Math.abs(z)>L-0.05) continue; N++;
      const core=new THREE.Mesh(cyl,new THREE.MeshStandardMaterial({color:0x9fd0ff,emissive:0x1a3a5a})); core.scale.set(xi,1,xi); core.position.set(x,0,z); G.add(core);
      const halo=new THREE.Mesh(cyl,new THREE.MeshBasicMaterial({color:0xd8b46a,transparent:true,opacity:0.06,depthWrite:false})); halo.scale.set(lam*0.6,0.98,lam*0.6); halo.position.set(x,0,z); G.add(halo); cores.push(core); }
    info.innerHTML=T3(`B/B<sub>c2</sub> = ${F3(b,2)} · ${N} hvirvler, hver med ét flukskvant Φ<sub>0</sub> = h/2e i et trekantgitter`,`B/B<sub>c2</sub> = ${F3(b,2)} · ${N} vortices, each carrying one flux quantum Φ<sub>0</sub> = h/2e in a triangular lattice`); }
  S.onFrame(t=>cores.forEach((c,i)=>c.rotation.y=t*3));
  bs.oninput=build; build();
})();
