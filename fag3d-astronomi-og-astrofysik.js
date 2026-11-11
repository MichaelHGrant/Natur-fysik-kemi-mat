// 3D: spiralgalakse – stjerner med flad rotationskurve (mørkt stof) eller kepler-rotation; sidegraf v(r)
(function(){
  const S=scene3d('gal3d',{cam:[0,6,9]});
  const info=document.getElementById('gal3dinfo'); let dm=true;
  const N=6000, P=new Float32Array(3*N), Cc=new Float32Array(3*N), R=new Float32Array(N), TH=new Float32Array(N), Y=new Float32Array(N);
  const col=new THREE.Color();
  for(let i=0;i<N;i++){ const bulge=i<N*0.15; let r,th;
    if(bulge){ r=Math.abs(0.6*Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(2*Math.PI*Math.random())); th=2*Math.PI*Math.random(); Y[i]=(Math.random()-0.5)*0.5*Math.exp(-r); col.setHSL(0.1,0.7,0.7); }
    else { r=0.3+(-Math.log(Math.random()))*1.6; if(r>6) r=6*Math.random(); const arm=Math.random()<0.5?0:Math.PI; th=arm+Math.log(r+0.5)/0.3+(Math.random()-0.5)*0.7*(1+0.2*r); Y[i]=(Math.random()-0.5)*0.12;
      const young=Math.random()<0.35; col.setHSL(young?0.6:0.12,young?0.7:0.4,young?0.75:0.65); }
    R[i]=r; TH[i]=th; Cc[3*i]=col.r; Cc[3*i+1]=col.g; Cc[3*i+2]=col.b; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(Cc,3));
  S.scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:0.05,vertexColors:true,transparent:true,opacity:0.9,depthWrite:false,blending:THREE.AdditiveBlending})));
  const core=ball3(0.25,0xffe8b0,{emissive:0xaa8844}); S.scene.add(core);
  // markerede stjerner på en radius, så man ser forskellen
  const mark=[]; [1,2,3,4,5].forEach(r=>{ const b=ball3(0.09,0xf08a7a,{emissive:0x803020}); b.userData.r=r; S.scene.add(b); mark.push(b); });
  const vflat=r=>1.0*(1-Math.exp(-r/0.6)), vkep=r=>r<0.8?1.0*r/0.8*1.15:1.15*Math.sqrt(0.8/r)*1.0;
  const v=r=>dm?vflat(r):vkep(r);
  let ang=new Float32Array(N), am=[0,0,0,0,0];
  function upd(dt){ for(let i=0;i<N;i++){ ang[i]+=dt*v(R[i])/Math.max(R[i],0.15); const a=TH[i]+ang[i]; P[3*i]=R[i]*Math.cos(a); P[3*i+1]=Y[i]; P[3*i+2]=R[i]*Math.sin(a); }
    g.attributes.position.needsUpdate=true; mark.forEach((b,k)=>{ const r=b.userData.r; am[k]+=dt*v(r)/r; b.position.set(r*Math.cos(am[k]),0.05,r*Math.sin(am[k])); }); }
  S.onFrame((t,dt)=>upd(dt*0.6)); upd(0);
  // sidegraf
  const cv=document.getElementById('gal3dside'), cx=cv.getContext('2d');
  function plot(){ const W=cv.width,H=cv.height; cx.clearRect(0,0,W,H); cx.font='12px system-ui'; cx.fillStyle='#9ba4b6';
    const X=r=>30+r/6*(W-40), Yv=q=>H-24-q/1.3*(H-40);
    cx.strokeStyle='#4a5878'; cx.beginPath(); cx.moveTo(30,10); cx.lineTo(30,H-24); cx.lineTo(W-8,H-24); cx.stroke();
    cx.fillText('v',8,18); cx.fillText('r',W-14,H-8);
    [[vflat,'#7fd1b9',T3('målt (flad)','observed (flat)')],[vkep,'#f08a7a',T3('kun synligt stof','visible matter only')]].forEach(([f,c,n],k)=>{ cx.strokeStyle=c; cx.lineWidth=(dm===(k===0))?2.5:1.2; cx.beginPath(); for(let r=0.02;r<=6;r+=0.05){ const x=X(r),y=Yv(f(r)); r<0.05?cx.moveTo(x,y):cx.lineTo(x,y); } cx.stroke(); cx.fillStyle=c; cx.fillText(n,X(2.6),Yv(f(5.5))+(k?14:-6)); });
    cx.lineWidth=1; }
  function txt(){ info.innerHTML=dm?T3('<b>Med mørkt stof</b>: rotationskurven er flad – de ydre stjerner (røde) kører lige så hurtigt som de indre.','<b>With dark matter</b>: the rotation curve is flat – the outer stars (red) move as fast as the inner ones.')
      :T3('<b>Kun synligt stof</b>: v ∝ 1/√r udenfor kernen, så de ydre stjerner halter bagud, og spiralarmene vikles hurtigt op.','<b>Visible matter only</b>: v ∝ 1/√r outside the core, so the outer stars lag behind and the spiral arms wind up quickly.'); plot(); }
  chips('#galsel button',b=>{ dm=b.dataset.d==='1'; txt(); }); txt();
})();
