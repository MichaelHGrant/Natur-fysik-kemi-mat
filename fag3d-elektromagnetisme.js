// 3D: magnetfeltlinjer omkring en strømsløjfe eller en spole (Biot–Savart, numerisk)
(function(){
  const S=scene3d('mag3d',{cam:[5,3,6],autoRotate:0.6});
  const info=document.getElementById('mag3dinfo'); let typ='loop';
  const G=new THREE.Group(); S.scene.add(G);
  let segs=[];
  function wires(){ segs=[]; const loops=typ==='loop'?[0]:Array.from({length:9},(_,i)=>-1.6+0.4*i), R=1, n=48;
    loops.forEach(z0=>{ for(let k=0;k<n;k++){ const a1=2*Math.PI*k/n,a2=2*Math.PI*(k+1)/n; segs.push([[R*Math.cos(a1),z0,R*Math.sin(a1)],[R*Math.cos(a2),z0,R*Math.sin(a2)]]); } }); return loops; }
  function B(p){ let bx=0,by=0,bz=0; for(const [a,b] of segs){ const dl=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], m=[(a[0]+b[0])/2-p[0],(a[1]+b[1])/2-p[1],(a[2]+b[2])/2-p[2]]; const r=Math.hypot(...m)+1e-6, r3=r*r*r;
      // dl × (p - m) = dl × (-m)
      bx+=(dl[1]*(-m[2])-dl[2]*(-m[1]))/r3; by+=(dl[2]*(-m[0])-dl[0]*(-m[2]))/r3; bz+=(dl[0]*(-m[1])-dl[1]*(-m[0]))/r3; } return [bx,by,bz]; }
  function trace(p0,dir){ const pts=[p0.slice()]; let p=p0.slice(); for(let i=0;i<500;i++){ const b=B(p), m=Math.hypot(...b)+1e-12, h=0.04; p=[p[0]+dir*h*b[0]/m,p[1]+dir*h*b[1]/m,p[2]+dir*h*b[2]/m]; pts.push(p.slice()); if(Math.hypot(...p)>5) break; if(i>40&&Math.hypot(p[0]-p0[0],p[1]-p0[1],p[2]-p0[2])<0.05) break; } return pts; }
  function build(){ clear3(G); const loops=wires();
    loops.forEach(z0=>{ const ring=new THREE.Mesh(new THREE.TorusGeometry(1,0.04,8,60),new THREE.MeshStandardMaterial({color:0xb87333,metalness:0.6,roughness:0.4})); ring.rotation.x=Math.PI/2; ring.position.y=z0; G.add(ring); });
    // startpunkter i planet gennem aksen, i flere azimut-vinkler
    const starts=typ==='loop'?[0.15,0.35,0.55,0.75,0.9]:[0.2,0.45,0.7,0.88];
    [0,Math.PI/2,Math.PI,3*Math.PI/2].forEach(ph=>starts.forEach(r=>{ const p0=[r*Math.cos(ph),0,r*Math.sin(ph)];
      const a=trace(p0,1), b=trace(p0,-1).reverse(); const pts=b.concat(a.slice(1)).map(q=>new THREE.Vector3(...q)); G.add(line3(pts,C3.ice,0.85)); }));
    // strømretning-pile
    G.add(arrow3([1,typ==='loop'?0:1.6,0],[0,0,-1],0.5,C3.gold,0.15));
    info.innerHTML=typ==='loop'?T3('<b>Strømsløjfe</b>: feltet ligner en kort stangmagnets – en magnetisk dipol.','<b>Current loop</b>: the field resembles that of a short bar magnet – a magnetic dipole.')
      :T3('<b>Spole</b>: inde i spolen er feltet næsten homogent, B ≈ μ<sub>0</sub>nI; udenfor svagt.','<b>Solenoid</b>: inside the coil the field is almost uniform, B ≈ μ<sub>0</sub>nI; outside it is weak.'); }
  chips('#magsel button',b=>{typ=b.dataset.t;build();}); build();
})();
