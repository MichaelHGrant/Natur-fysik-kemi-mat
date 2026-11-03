// 3D: event display – ladede spor krummer i solenoidens felt (helixer), fotoner/neutrale ret frem
(function(){
  const S=scene3d('ev3d',{cam:[4.5,3.4,8.5],autoRotate:0.5});
  const info=document.getElementById('ev3dinfo'), Bs=document.getElementById('evB');
  const det=new THREE.Group(); S.scene.add(det);
  [[1.2,0x4a5878],[2.6,0x4a5878],[3.2,0x8a6a3a]].forEach(([r,c])=>[-3,0,3].forEach(z=>{ const pts=[]; for(let k=0;k<=64;k++){ const a=2*Math.PI*k/64; pts.push([r*Math.cos(a),r*Math.sin(a),z]); } det.add(line3(pts,c,z?0.5:0.25)); }));
  for(let k=0;k<12;k++){ const a=2*Math.PI*k/12; det.add(line3([[3.2*Math.cos(a),3.2*Math.sin(a),-3],[3.2*Math.cos(a),3.2*Math.sin(a),3]],0x8a6a3a,0.2)); }
  const beam=line3([[0,0,-4],[0,0,4]],C3.dim); det.add(beam);
  const G=new THREE.Group(); S.scene.add(G); let tracks=[];
  function newEvent(){ clear3(G); tracks=[]; const B=+Bs.value; const n=10+Math.floor(Math.random()*14); let nc=0;
    G.add(ball3(0.08,C3.gold2,{emissive:0x886600}));
    for(let i=0;i<n;i++){ const pt=0.4+(-Math.log(Math.random()))*1.6, phi=2*Math.PI*Math.random(), eta=(Math.random()*2-1)*1.4, pz=pt*Math.sinh(eta);
      const neutral=Math.random()<0.25, q=Math.random()<0.5?1:-1;
      const pts=[]; const Rc=neutral?1e9:pt/(0.3*B+1e-9)*1.0; // R[m] = pT[GeV]/(0.3 B[T])
      for(let s=0;s<=400;s++){ const L=s*0.012; // buelængde i transversalplanet
        let x,y; if(neutral||B===0){ x=L*Math.cos(phi); y=L*Math.sin(phi); } else { const a=q*L/Rc; x=Rc*(Math.sin(phi+a)-Math.sin(phi))*q; y=-Rc*(Math.cos(phi+a)-Math.cos(phi))*q; }
        const z=L*pz/pt; if(Math.hypot(x,y)>(neutral?3.2:2.6)||Math.abs(z)>3) break; pts.push(new THREE.Vector3(x,y,z)); if(L>40) break; }
      if(pts.length<2) continue; if(!neutral) nc++;
      const c=neutral?0xf2d590:(q>0?0xf08a7a:0x9fd0ff); let ln; if(neutral){ ln=line3(pts,c); ln.material=new THREE.LineDashedMaterial({color:c,dashSize:0.12,gapSize:0.08}); ln.computeLineDistances(); } else ln=tube3(pts,c,0.018,pts.length);
      G.add(ln); tracks.push([ln,neutral?pts.length:ln.geometry.index.count]); ln.geometry.setDrawRange(0,0);
      const end=pts[pts.length-1]; if(Math.hypot(end.x,end.y)>2.5){ const e=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.12),new THREE.MeshBasicMaterial({color:c})); e.position.copy(end); G.add(e); } }
    S.t=0; info.innerHTML=T3(`${nc} ladede spor (rød +, blå −), ${tracks.length-nc} neutrale (stiplede) · B = ${F3(B,1)} T`,`${nc} charged tracks (red +, blue −), ${tracks.length-nc} neutral (dashed) · B = ${F3(B,1)} T`); }
  S.onFrame(t=>{ const f=Math.min(1,t/0.8); tracks.forEach(([l,n])=>l.geometry.setDrawRange(0,Math.ceil(n*f/6)*6)); });
  (window.__printPrep=window.__printPrep||[]).push(()=>tracks.forEach(([l,n])=>l.geometry.setDrawRange(0,n)));
  document.getElementById('evnew').onclick=newEvent; Bs.oninput=newEvent; newEvent();
})();
