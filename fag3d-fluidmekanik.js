// 3D: strømning om en kugle – ideal potentialstrømning eller Stokes-strømning (Re ≪ 1)
(function(){
  const S=scene3d('flow3d',{cam:[0,2.2,6.5],target:[0,0,0]});
  const info=document.getElementById('flow3dinfo'); let typ='pot';
  const a=1, U=1, N=1400, X0=-5, X1=5, Rmax=2.4;
  const sph=ball3(a*0.98,0x6b7896,{seg:40}); S.scene.add(sph);
  const pos=new Float32Array(3*N), col=new Float32Array(3*N);
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3));
  S.scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:0.06,vertexColors:true})));
  function seed(i,x){ let y,z; do{ y=(Math.random()*2-1)*Rmax; z=(Math.random()*2-1)*Rmax; }while(y*y+z*z>Rmax*Rmax); pos[3*i]=x!==undefined?x:X0+Math.random()*(X1-X0); pos[3*i+1]=y; pos[3*i+2]=z; }
  for(let i=0;i<N;i++) seed(i);
  function vel(x,y,z){ const r2=x*x+y*y+z*z, r=Math.sqrt(r2); if(r<a) return [0,0,0];
    if(typ==='pot'){ const f=a*a*a/(2*r2*r), h=3*a*a*a*x/(2*r2*r2*r); return [U*(1+f)-U*h*x, -U*h*y, -U*h*z]; }
    const A=1-3*a/(4*r)-a*a*a/(4*r2*r), B=3*a/(4*r2*r)-3*a*a*a/(4*r2*r2*r); return [U*A-x*U*x*B, -y*U*x*B, -z*U*x*B]; }
  const c=new THREE.Color();
  function frame(dt){ for(let i=0;i<N;i++){ let x=pos[3*i],y=pos[3*i+1],z=pos[3*i+2]; const v=vel(x,y,z); x+=v[0]*dt; y+=v[1]*dt; z+=v[2]*dt;
      if(x>X1||x*x+y*y+z*z<a*a*0.98){ seed(i,X0); } else { pos[3*i]=x; pos[3*i+1]=y; pos[3*i+2]=z; }
      const s=Math.hypot(...v)/U; c.setHSL(0.62-Math.max(0,Math.min(1,(s-0.4)/1.1))*0.62,0.85,0.6); col[3*i]=c.r; col[3*i+1]=c.g; col[3*i+2]=c.b; }
    g.attributes.position.needsUpdate=true; g.attributes.color.needsUpdate=true; }
  S.onFrame((t,dt)=>frame(dt*1.2));
  (window.__printPrep=window.__printPrep||[]).push(()=>{ for(let k=0;k<200;k++) frame(0.03); });
  function txt(){ info.innerHTML=typ==='pot'?T3('<b>Ideal strømning</b> (Euler): symmetrisk for og bag – ingen modstand (d’Alemberts paradoks). Farten på ækvator er 1,5 U.','<b>Ideal flow</b> (Euler): symmetric in front and behind – no drag (d’Alembert’s paradox). The speed at the equator is 1.5 U.')
      :T3('<b>Stokes-strømning</b> (Re ≪ 1): viskositeten bremser væsken langt ud; modstanden er F = 6πηaU.','<b>Stokes flow</b> (Re ≪ 1): viscosity slows the fluid far out; the drag is F = 6πηaU.'); }
  chips('#flowsel button',b=>{typ=b.dataset.t; for(let i=0;i<N;i++) seed(i); txt();}); txt();
})();
