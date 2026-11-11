// 3D: idealgassens tilstandsflade p(V,T) med en Carnot-kredsproces
(function(){
  const S=scene3d('pvt3d',{cam:[6,4.5,6.5],target:[0,1.2,0],printT:2});
  const info=document.getElementById('pvt3dinfo'), sTh=onRange('pvtTh',build), sTc=onRange('pvtTc',build);
  const R=8.314, g=1.4, V0=0.5,V1=40, T0=200,T1=1000;
  const X=V=>(Math.log(V/V0)/Math.log(V1/V0))*5-2.5, Z=T=>(T-T0)/(T1-T0)*5-2.5, Yp=p=>(Math.log10(p)-4.5)/(7.3-4.5)*3.2;
  // flade
  const n=60, pos=[], idx=[], col=[]; const c=new THREE.Color();
  for(let i=0;i<=n;i++)for(let j=0;j<=n;j++){ const V=V0*Math.pow(V1/V0,i/n), T=T0+(T1-T0)*j/n, p=R*T/(V*1e-3); pos.push(X(V),Yp(p),Z(T)); c.setHSL(0.6-0.6*(T-T0)/(T1-T0),0.55,0.5); col.push(c.r,c.g,c.b); }
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){ const a=i*(n+1)+j,b=a+1,d=a+n+1,e=d+1; idx.push(a,d,b,b,d,e); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); geo.setIndex(idx); geo.computeVertexNormals();
  S.scene.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:0.8,side:THREE.DoubleSide})));
  S.scene.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(5,5,10,10).rotateX(-Math.PI/2)),new THREE.LineBasicMaterial({color:0x1c2438})));
  const ax=new THREE.Group(); S.scene.add(ax);
  ax.add(arrow3([-2.5,0,2.6],[1,0,0],5.4,C3.dim,0.15)); ax.add(arrow3([-2.6,0,-2.5],[0,0,1],5.4,C3.dim,0.15)); ax.add(arrow3([-2.6,0,-2.6],[0,1,0],3.6,C3.dim,0.15));
  const lV=label3(T3('rumfang V (log)','volume V (log)'),'#9ba4b6',0.25); lV.position.set(0.5,0,3.1); ax.add(lV);
  const lT=label3(T3('temperatur T','temperature T'),'#9ba4b6',0.25); lT.position.set(-3.4,0,0.5); ax.add(lT);
  const lp=label3(T3('tryk p (log)','pressure p (log)'),'#9ba4b6',0.25); lp.position.set(-2.6,3.9,-2.6); ax.add(lp);
  const cyc=new THREE.Group(); S.scene.add(cyc); const dot=ball3(0.09,C3.red,{emissive:0x551111}); S.scene.add(dot);
  let path=[];
  function build(){ const Th=+sTh.value, Tc=Math.min(+sTc.value,Th-50); document.getElementById('pvtThv').textContent=Th+' K'; document.getElementById('pvtTcv').textContent=Tc+' K';
    clear3(cyc); path=[]; const A=6, rho=2.5, B=A*Math.pow(Tc/Th,1/(g-1)), C=B*rho, D=A*rho; // L
    const seg=(f,n2,cls)=>{ const pts=[]; for(let k=0;k<=n2;k++){ const [V,T]=f(k/n2); pts.push(new THREE.Vector3(X(V),Yp(R*T/(V*1e-3))+0.02,Z(T))); } path.push(...pts); cyc.add(tube3(pts,cls,0.035)); };
    seg(s=>{const V=A*Math.pow(B/A,s); return [V,Tc*Math.pow(A/V,g-1)];},40,C3.ice);
    seg(s=>{const V=B*Math.pow(C/B,s); return [V,Th];},40,C3.red);
    seg(s=>{const V=C*Math.pow(D/C,s); return [V,Th*Math.pow(C/V,g-1)];},40,C3.ice);
    seg(s=>{const V=D*Math.pow(A/D,s); return [V,Tc];},40,C3.grn);
    info.innerHTML=T3(`Carnot mellem ${Th} K og ${Tc} K · η = 1 − T<sub>k</sub>/T<sub>v</sub> = <b>${F3(100*(1-Tc/Th),1)} %</b><br><span style="color:#f08a7a">rød</span>/<span style="color:#7fd1b9">grøn</span>: isotermer · <span style="color:#9fd0ff">blå</span>: adiabater`,
      `Carnot between ${Th} K and ${Tc} K · η = 1 − T<sub>c</sub>/T<sub>h</sub> = <b>${F3(100*(1-Tc/Th),1)} %</b><br><span style="color:#f08a7a">red</span>/<span style="color:#7fd1b9">green</span>: isotherms · <span style="color:#9fd0ff">blue</span>: adiabats`); }
  build();
  S.onFrame(t=>{ if(!path.length) return; const i=Math.floor((t*0.15%1)*(path.length-1)); dot.position.copy(path[i]); });
})();
