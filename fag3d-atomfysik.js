// 3D: vektormodellen – L og S præcesserer om J; J præcesserer om B (svagt felt, Zeeman)
(function(){
  const S=scene3d('vec3d',{cam:[3.4,2.2,3.4],target:[0,1.1,0]});
  const info=document.getElementById('vec3dinfo');
  let l=1,s=0.5,j=1.5,mj=1.5;
  const G=new THREE.Group(); S.scene.add(G);
  const bArrow=arrow3([0,-0.4,0],[0,1,0],3.2,0x6b7896,0.2); S.scene.add(bArrow); const bl=label3('B','#9ba4b6',0.3); bl.position.set(0.25,2.9,0); S.scene.add(bl);
  let aL,aS,aJ,cone1,cone2,lab=[];
  const len=q=>Math.sqrt(q*(q+1));
  function cone(h,r,col){ const pts=[]; for(let k=0;k<=64;k++){ const a=2*Math.PI*k/64; pts.push([r*Math.cos(a),h,r*Math.sin(a)]); } return line3(pts,col,0.5); }
  function build(){ clear3(G); const J=len(j),L=len(l),Sv=len(s);
    aJ=arrow3([0,0,0],[0,1,0],J,C3.gold2,0.2); aL=arrow3([0,0,0],[0,1,0],L,C3.red,0.17); aS=arrow3([0,0,0],[0,1,0],Sv,C3.ice,0.15); G.add(aJ,aL,aS);
    lab=[label3('J','#f2d590',0.3),label3('L','#f08a7a',0.3),label3('S','#9fd0ff',0.3)]; lab.forEach(x=>G.add(x));
    const thJ=Math.acos(mj/J); G.add(cone(J*Math.cos(thJ),J*Math.sin(thJ),C3.gold));
    const gJ=1+(j*(j+1)+s*(s+1)-l*(l+1))/(2*j*(j+1));
    info.innerHTML=T3(`l = ${l}, s = ½, j = ${j===0.5?'½':j===1.5?'3/2':j===2.5?'5/2':j}, m<sub>j</sub> = ${mj>0?'+':'−'}${Math.abs(mj)*2}/2 · Landé g<sub>J</sub> = ${F3(gJ,3)}<br>Energiskift ΔE = g<sub>J</sub> μ<sub>B</sub> B m<sub>j</sub>`,
      `l = ${l}, s = ½, j = ${j===0.5?'½':j===1.5?'3/2':j===2.5?'5/2':j}, m<sub>j</sub> = ${mj>0?'+':'−'}${Math.abs(mj)*2}/2 · Landé g<sub>J</sub> = ${F3(gJ,3)}<br>Energy shift ΔE = g<sub>J</sub> μ<sub>B</sub> B m<sub>j</sub>`);
    S.t=0; frame(0); }
  const up=new THREE.Vector3(0,1,0);
  function frame(t){ const J=len(j),L=len(l),Sv=len(s); const thJ=Math.acos(mj/J), ph=0.6*t;
    const ej=new THREE.Vector3(Math.sin(thJ)*Math.cos(ph),Math.cos(thJ),Math.sin(thJ)*Math.sin(ph));
    // vinkel mellem L og J
    const cLJ=(J*J+L*L-Sv*Sv)/(2*J*L); const aLJ=Math.acos(Math.max(-1,Math.min(1,cLJ)));
    const u=new THREE.Vector3().crossVectors(ej,up); if(u.lengthSq()<1e-6) u.set(1,0,0); u.normalize(); const w=new THREE.Vector3().crossVectors(ej,u);
    const ps=4*t; const eL=ej.clone().multiplyScalar(Math.cos(aLJ)).add(u.clone().multiplyScalar(Math.sin(aLJ)*Math.cos(ps))).add(w.clone().multiplyScalar(Math.sin(aLJ)*Math.sin(ps)));
    const vJ=ej.clone().multiplyScalar(J), vL=eL.clone().multiplyScalar(L), vS=vJ.clone().sub(vL);
    aJ.setDirection(ej); aJ.setLength(J,0.2,0.12); aL.setDirection(eL.clone()); aL.setLength(L,0.17,0.1);
    aS.position.copy(vL); aS.setDirection(vS.clone().normalize()); aS.setLength(Sv,0.15,0.09);
    lab[0].position.copy(vJ.clone().multiplyScalar(1.08)); lab[1].position.copy(vL.clone().multiplyScalar(1.12)); lab[2].position.copy(vL.clone().add(vS.clone().multiplyScalar(0.55)).add(new THREE.Vector3(0.15,0,0))); }
  S.onFrame(t=>frame(t));
  chips('#vecsel button',b=>{ l=+b.dataset.l; j=+b.dataset.j; mj=+b.dataset.m; build(); }); build();
})();
