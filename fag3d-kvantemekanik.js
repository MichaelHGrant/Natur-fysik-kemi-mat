// 3D: brintatomets orbitaler som punktsky (sandsynlighedstæthed), farvet efter fortegn
(function(){
  const S=scene3d('orb3d',{cam:[0,0,30],autoRotate:1.0});
  const info=document.getElementById('orb3dinfo');
  const G=new THREE.Group(); S.scene.add(G);
  function lag(k,a,x){ if(k===0) return 1; let L0=1,L1=1+a-x; for(let i=1;i<k;i++){ const L2=((2*i+1+a-x)*L1-(i+a)*L0)/(i+1); L0=L1; L1=L2; } return L1; }
  const R=(n,l,r)=>{ const x=2*r/n; return Math.pow(x,l)*Math.exp(-x/2)*lag(n-l-1,2*l+1,x); };
  // reelle kuglefladefunktioner (uden normering, kun form)
  const Y={ s:(x,y,z,r)=>1, pz:(x,y,z,r)=>z/r, px:(x,y,z,r)=>x/r, dz2:(x,y,z,r)=>(3*z*z-r*r)/(r*r), dxy:(x,y,z,r)=>x*y/(r*r), dxz:(x,y,z,r)=>x*z/(r*r), fz3:(x,y,z,r)=>z*(5*z*z-3*r*r)/(r*r*r), fxyz:(x,y,z,r)=>x*y*z/(r*r*r) };
  const ORB={ '1s':[1,0,'s'],'2s':[2,0,'s'],'2p_z':[2,1,'pz'],'3s':[3,0,'s'],'3p_z':[3,1,'pz'],'3d_z²':[3,2,'dz2'],'3d_xy':[3,2,'dxy'],'4f_z³':[4,3,'fz3'],'4f_xyz':[4,3,'fxyz'] };
  let cur='2p_z';
  function build(){
    clear3(G); const [n,l,yk]=ORB[cur], Yf=Y[yk]; const rmax=n===1?6:n===2?14:n===3?24:34;
    // find maksimum af |psi|^2 til rejection sampling
    let pmax=0; for(let i=0;i<20000;i++){ const x=(Math.random()*2-1)*rmax,y=(Math.random()*2-1)*rmax,z=(Math.random()*2-1)*rmax,r=Math.hypot(x,y,z)+1e-9; const v=R(n,l,r)*Yf(x,y,z,r); pmax=Math.max(pmax,v*v); }
    const pos=[], col=[], N=14000; let tries=0;
    const cp=new THREE.Color(C3.gold), cm=new THREE.Color(C3.ice);
    while(pos.length<N*3&&tries<4e6){ tries++; const x=(Math.random()*2-1)*rmax,y=(Math.random()*2-1)*rmax,z=(Math.random()*2-1)*rmax,r=Math.hypot(x,y,z)+1e-9; const v=R(n,l,r)*Yf(x,y,z,r);
      if(Math.random()*pmax*1.05<v*v){ pos.push(x,z,y); const c=v>=0?cp:cm; col.push(c.r,c.g,c.b); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    G.add(new THREE.Points(g,new THREE.PointsMaterial({size:rmax/90,vertexColors:true,transparent:true,opacity:0.75,depthWrite:false})));
    G.add(ball3(rmax/60,0xffffff,{emissive:0x666666}));
    const ax=axes3(rmax*0.9,['x','z','y']); G.add(ax);
    S.camera.position.setLength(rmax*2.4); S.controls.update();
    const E=-13.6/(n*n);
    info.innerHTML=`<b>${cur.replace('_','')}</b> · n = ${n}, l = ${l} · E = ${F3(E,2)} eV<br>`+T3(`Knudeflader: ${l} vinkel + ${n-l-1} radial · guld/blå = bølgefunktionens fortegn`,`Nodal surfaces: ${l} angular + ${n-l-1} radial · gold/blue = sign of the wave function`);
  }
  chips('#orbsel button',b=>{cur=b.dataset.o;build();}); build();
})();
