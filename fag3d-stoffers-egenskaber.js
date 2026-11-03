// 3D: van der Waals-gassens tilstandsflade med sameksistensområdet (Maxwell-konstruktion)
(function(){
  const S=scene3d('vdw3d',{cam:[4.5,4.2,-6.5],target:[0,1.0,0]});
  const info=document.getElementById('vdw3dinfo'); let flat=true;
  const P=(v,t)=>8*t/(3*v-1)-3/(v*v);
  function maxwell(t){ if(t>=0.999) return null;
    const roots=p=>{const a=3*p,b=-(p+8*t),c=9,d=-3,rs=[];let prev=null;for(let v=0.34;v<=40;v*=1.003){const f=a*v*v*v+b*v*v+c*v+d;if(prev&&Math.sign(f)!==Math.sign(prev.f)){let l=prev.v,h=v;for(let k=0;k<40;k++){const m=(l+h)/2,fm=a*m*m*m+b*m*m+c*m+d;if(Math.sign(fm)===Math.sign(prev.f))l=m;else h=m;}rs.push((l+h)/2);}prev={v,f};}return rs;};
    const area=p=>{const r=roots(p);if(r.length<3)return null;const[vl,,vg]=r;let A=0;for(let i=0;i<300;i++){const v=vl+(vg-vl)*(i+0.5)/300;A+=(P(v,t)-p)*(vg-vl)/300;}return{A,vl,vg};};
    let lo=0.001,hi=1;for(let k=0;k<45;k++){const m=(lo+hi)/2,r=area(m);if(!r){if(roots(m).length<3){if(m<0.5)lo=m;else hi=m;}continue;}if(r.A>0)lo=m;else hi=m;}
    const p=(lo+hi)/2,r=area(p);return r?{p,vl:r.vl,vg:r.vg}:null; }
  const v0=0.45,v1=6,t0=0.82,t1=1.25;
  const X=v=>Math.log(v/v0)/Math.log(v1/v0)*5-2.5, Z=t=>(t-t0)/(t1-t0)*5-2.5, Y=p=>Math.max(-0.2,Math.min(2.3,p))*1.4;
  const nv=90, nt=50, MX=[]; for(let j=0;j<=nt;j++){ const t=t0+(t1-t0)*j/nt; MX.push(maxwell(t)); }
  const surf=new THREE.Group(); S.scene.add(surf);
  function build(){ clear3(surf); const pos=[],col=[],idx=[]; const c=new THREE.Color();
    for(let i=0;i<=nv;i++)for(let j=0;j<=nt;j++){ const v=v0*Math.pow(v1/v0,i/nv), t=t0+(t1-t0)*j/nt; let p=P(v,t), inside=false; const m=MX[j];
      if(flat&&m&&v>m.vl&&v<m.vg){ p=m.p; inside=true; }
      pos.push(X(v),Y(p),Z(t)); if(inside) c.set(0x7fd1b9); else c.setHSL(0.62+0.18*(t-t0)/(t1-t0),0.45,0.42+0.12*(t-t0)/(t1-t0)); col.push(c.r,c.g,c.b); }
    for(let i=0;i<nv;i++)for(let j=0;j<nt;j++){ const a=i*(nt+1)+j,b=a+1,d=a+nt+1,e=d+1; idx.push(a,d,b,b,d,e); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
    surf.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:0.88})));
    // sameksistenskurve
    const L=[],G=[]; MX.forEach((m,j)=>{ if(!m) return; const t=t0+(t1-t0)*j/nt; L.push(new THREE.Vector3(X(m.vl),Y(m.p)+0.03,Z(t))); G.push(new THREE.Vector3(X(m.vg),Y(m.p)+0.03,Z(t))); });
    const dome=L.concat([new THREE.Vector3(X(1),Y(1)+0.03,Z(1))]).concat(G.reverse()); surf.add(tube3(dome,C3.gold,0.03,200));
    // isotermer
    [0.9,1,1.1,1.2].forEach(t=>{ const pts=[]; const j=Math.round((t-t0)/(t1-t0)*nt), m=MX[j]; for(let i=0;i<=120;i++){ const v=v0*Math.pow(v1/v0,i/120); let p=P(v,t); if(flat&&m&&v>m.vl&&v<m.vg) p=m.p; pts.push([X(v),Y(p)+0.02,Z(t)]); } surf.add(line3(pts,t===1?C3.red:0xe7e9ef,0.8)); });
    const cp=ball3(0.08,C3.red,{emissive:0x551111}); cp.position.set(X(1),Y(1)+0.03,Z(1)); surf.add(cp);
    info.innerHTML=T3(`Reducerede enheder p/p<sub>c</sub>, V/V<sub>c</sub>, T/T<sub>c</sub><br>${flat?'<span style="color:#7fd1b9">Grøn</span>: væske og damp sameksisterer (Maxwell)':'Uden Maxwell: ufysiske bølger under T<sub>c</sub>'} · <span style="color:#f08a7a">●</span> kritisk punkt`,
      `Reduced units p/p<sub>c</sub>, V/V<sub>c</sub>, T/T<sub>c</sub><br>${flat?'<span style="color:#7fd1b9">Green</span>: liquid and vapour coexist (Maxwell)':'Without Maxwell: unphysical wiggles below T<sub>c</sub>'} · <span style="color:#f08a7a">●</span> critical point`); }
  const ax=new THREE.Group(); S.scene.add(ax);
  const l1=label3(T3('rumfang V/V_c (log)','volume V/V_c (log)'),'#9ba4b6',0.25); l1.position.set(0,-0.4,3.0); ax.add(l1);
  const l2=label3(T3('temperatur T/T_c','temperature T/T_c'),'#9ba4b6',0.25); l2.position.set(-3.5,-0.4,0); ax.add(l2);
  const l3=label3(T3('tryk p/p_c','pressure p/p_c'),'#9ba4b6',0.25); l3.position.set(-2.8,3.4,-2.6); ax.add(l3);
  chips('#vdwm button',b=>{flat=b.dataset.m==='1';build();}); build();
})();
