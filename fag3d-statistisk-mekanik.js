// 3D: gas af hårde kugler i en kasse – Maxwell-fordelingen opstår af sig selv
(function(){
  const N=300, Lb=4, rad=0.11;
  const S=scene3d('gas3d',{cam:[5.5,4,6.5],target:[0,0,0],autoRotate:0.4,print:api=>{ for(let k=0;k<1500;k++) step(0.01); sync(); drawHist(); }});
  const info=document.getElementById('gas3dinfo'), hc=document.getElementById('gashist'), hx=hc.getContext('2d');
  S.scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(Lb,Lb,Lb)),new THREE.LineBasicMaterial({color:0x4a5878})));
  const geo=new THREE.SphereGeometry(rad,10,8), mat=new THREE.MeshStandardMaterial({roughness:0.4});
  const inst=new THREE.InstancedMesh(geo,mat,N); S.scene.add(inst);
  const P=new Float32Array(3*N), V=new Float32Array(3*N), M=new THREE.Matrix4(), col=new THREE.Color();
  let hist=[];
  function reset(mode){ for(let i=0;i<N;i++){ for(let a=0;a<3;a++) P[3*i+a]=(Math.random()-0.5)*(Lb-2*rad);
      const th=Math.acos(2*Math.random()-1), ph=2*Math.PI*Math.random(), v=1.0;
      if(mode==='en'){ V[3*i]=v*Math.sin(th)*Math.cos(ph); V[3*i+1]=v*Math.sin(th)*Math.sin(ph); V[3*i+2]=v*Math.cos(th); }
      else { const vv=i<N/2?1.6:0.25; V[3*i]=vv*Math.sin(th)*Math.cos(ph); V[3*i+1]=vv*Math.sin(th)*Math.sin(ph); V[3*i+2]=vv*Math.cos(th); P[3*i]=(i<N/2?1:-1)*Math.abs(P[3*i]); } }
    hist=[]; }
  function step(dt){ const h=Lb/2-rad;
    for(let i=0;i<3*N;i++) P[i]+=V[i]*dt;
    for(let i=0;i<N;i++) for(let a=0;a<3;a++){ const k=3*i+a; if(P[k]>h){P[k]=2*h-P[k];V[k]=-Math.abs(V[k]);} else if(P[k]<-h){P[k]=-2*h-P[k];V[k]=Math.abs(V[k]);} }
    const d2=(2*rad)**2;
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){ const dx=P[3*j]-P[3*i], dy=P[3*j+1]-P[3*i+1], dz=P[3*j+2]-P[3*i+2], r2=dx*dx+dy*dy+dz*dz;
      if(r2<d2&&r2>1e-12){ const dvx=V[3*j]-V[3*i], dvy=V[3*j+1]-V[3*i+1], dvz=V[3*j+2]-V[3*i+2], b=dx*dvx+dy*dvy+dz*dvz; if(b<0){ const f=b/r2;
        V[3*i]+=f*dx; V[3*i+1]+=f*dy; V[3*i+2]+=f*dz; V[3*j]-=f*dx; V[3*j+1]-=f*dy; V[3*j+2]-=f*dz; } } } }
  function sync(){ let s2=0; for(let i=0;i<N;i++){ const v=Math.hypot(V[3*i],V[3*i+1],V[3*i+2]); s2+=v*v; M.makeTranslation(P[3*i],P[3*i+1],P[3*i+2]); inst.setMatrixAt(i,M);
      col.setHSL(0.62-Math.min(1,v/2.2)*0.62,0.8,0.6); inst.setColorAt(i,col); }
    inst.instanceMatrix.needsUpdate=true; if(inst.instanceColor) inst.instanceColor.needsUpdate=true; return s2/N; }
  function drawHist(){ const W=hc.width,H=hc.height; hx.clearRect(0,0,W,H); const nb=24, vmax=3; const cnt=new Array(nb).fill(0);
    for(let i=0;i<N;i++){ const v=Math.hypot(V[3*i],V[3*i+1],V[3*i+2]); const b=Math.floor(v/vmax*nb); if(b<nb) cnt[b]++; }
    hist.push(cnt); if(hist.length>15) hist.shift(); const avg=cnt.map((_,b)=>hist.reduce((s,c)=>s+c[b],0)/hist.length);
    let v2=0; for(let i=0;i<N;i++) v2+=V[3*i]**2+V[3*i+1]**2+V[3*i+2]**2; v2/=N; const a=v2/3; // kT/m
    const f=v=>4*Math.PI*Math.pow(1/(2*Math.PI*a),1.5)*v*v*Math.exp(-v*v/(2*a));
    const sx=W/nb, ymax=Math.max(...avg,N*f(Math.sqrt(2*a))*vmax/nb)*1.15;
    hx.fillStyle='rgba(216,180,106,0.75)'; avg.forEach((c,b)=>hx.fillRect(b*sx+1,H-14-c/ymax*(H-30),sx-2,c/ymax*(H-30)));
    hx.strokeStyle='#9fd0ff'; hx.lineWidth=2; hx.beginPath(); for(let i=0;i<=100;i++){ const v=vmax*i/100, y=H-14-N*f(v)*vmax/nb/ymax*(H-30); i?hx.lineTo(i/100*W,y):hx.moveTo(0,y);} hx.stroke();
    hx.fillStyle='#9ba4b6'; hx.font='11px system-ui'; hx.fillText(T3('fart →','speed →'),W-48,H-2); hx.fillText(T3('Maxwell (blå)','Maxwell (blue)'),6,12); }
  let mode='en'; chips('#gasmode button',b=>{mode=b.dataset.m;reset(mode);}); reset(mode); sync();
  let fr=0; S.onFrame((t,dt)=>{ for(let k=0;k<3;k++) step(0.012); const v2=sync(); if((fr++)%4===0){ drawHist();
    info.innerHTML=T3(`N = ${N} kugler · ⟨v²⟩ = ${F3(v2,2)}<br>Kollisioner bevarer energien – fordelingen går mod Maxwell.`,`N = ${N} spheres · ⟨v²⟩ = ${F3(v2,2)}<br>Collisions conserve energy – the distribution tends to Maxwell’s.`); } });
})();
