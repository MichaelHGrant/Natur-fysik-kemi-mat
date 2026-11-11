// 3D: transversale laser-modes (Hermite–Gauss TEM_mn og Laguerre–Gauss "donut") som intensitetsflade
(function(){
  const S=scene3d('tem3d',{cam:[0,4.2,5.2],autoRotate:0.7});
  const info=document.getElementById('tem3dinfo');
  const n=110, L=6;
  const geo=new THREE.PlaneGeometry(L,L,n,n); geo.rotateX(-Math.PI/2);
  const col=new Float32Array((n+1)*(n+1)*3); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  S.scene.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})));
  const H=(k,x)=>{ if(k===0) return 1; let a=1,b=2*x; for(let i=1;i<k;i++){ const c=2*x*b-2*i*a; a=b; b=c; } return b; };
  let mode=[0,0,'hg'];
  function build(){ const [m,nn,typ]=mode, pos=geo.attributes.position, w=1.0; let I=[],mx=0;
    for(let i=0;i<pos.count;i++){ const x=pos.getX(i), y=pos.getZ(i), r2=x*x+y*y; let v;
      if(typ==='hg') v=Math.pow(H(m,Math.SQRT2*x/w)*H(nn,Math.SQRT2*y/w),2)*Math.exp(-2*r2/(w*w));
      else { const p=nn, l=m, rr=2*r2/(w*w); let Lp=1; if(p===1) Lp=1+l-rr; v=Math.pow(rr,l)*Lp*Lp*Math.exp(-rr); }
      I.push(v); mx=Math.max(mx,v); }
    const c=new THREE.Color();
    for(let i=0;i<pos.count;i++){ const v=I[i]/mx; pos.setY(i,v*1.6); c.setRGB(Math.min(1,v*2.2),Math.max(0,v*1.5-0.4)*0.8,0.08+0.15*v); col[3*i]=0.05+c.r*0.95; col[3*i+1]=0.03+c.g; col[3*i+2]=0.05+c.b; }
    pos.needsUpdate=true; geo.attributes.color.needsUpdate=true; geo.computeVertexNormals();
    info.innerHTML=(typ==='hg'?`<b>TEM<sub>${m}${nn}</sub></b> · `+T3(`${m} knudelinjer langs x, ${nn} langs y`,`${m} nodal lines along x, ${nn} along y`):`<b>LG<sub>${nn}${m}</sub></b> · `+T3('ring med et hul i midten – bærer impulsmoment','ring with a hole in the centre – carries angular momentum'))+'<br>'+(m===0&&nn===0&&typ==='hg'?T3('Grundmoden: en Gauss-profil, den skarpeste stråle','The fundamental mode: a Gaussian, the sharpest beam'):T3('Højere mode: bredere stråle, større divergens','Higher mode: wider beam, larger divergence')); }
  chips('#temsel button',b=>{ const d=b.dataset.m.split(','); mode=[+d[0],+d[1],d[2]]; build(); }); build();
})();
