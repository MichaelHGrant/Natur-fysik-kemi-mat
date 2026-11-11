// 3D: atomkerne som tætpakkede nukleoner; R = r0 A^(1/3), deformation β (prolat/oblat)
(function(){
  const S=scene3d('nuc3d',{cam:[0,1.5,9],autoRotate:1});
  const info=document.getElementById('nuc3dinfo'), As=document.getElementById('nucA'), bs=document.getElementById('nucB');
  const G=new THREE.Group(); S.scene.add(G);
  const NAMES={4:'⁴He',12:'¹²C',16:'¹⁶O',40:'⁴⁰Ca',56:'⁵⁶Fe',120:'¹²⁰Sn',208:'²⁰⁸Pb',238:'²³⁸U'};
  const gp=new THREE.SphereGeometry(0.5,16,12), mp=new THREE.MeshStandardMaterial({color:0xf08a7a,roughness:0.45}), mn=new THREE.MeshStandardMaterial({color:0x8fa3c8,roughness:0.45});
  function Zof(A){ return Math.round(A/(1.98+0.0155*Math.pow(A,2/3))); }
  function build(){ G.children.length=0; const A=+As.value, b=+bs.value, Z=Zof(A);
    // fcc-gitterpunkter sorteret efter afstand, skaleret efter deformation
    const pts=[]; const n=6; for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)for(let k=-n;k<=n;k++){ if((i+j+k)&1) continue; const p=new THREE.Vector3(i,j,k).multiplyScalar(0.72);
      const ez=Math.exp(b*1.2), exy=1/Math.sqrt(ez); const q=new THREE.Vector3(p.x/exy,p.y/ez,p.z/exy); pts.push([q.length()+1e-4*Math.random(),p]); }
    pts.sort((a,c)=>a[0]-c[0]); const sel=pts.slice(0,A).map(x=>x[1]);
    const ez=Math.exp(b*1.2), exy=1/Math.sqrt(ez);
    // tilfældig men fast fordeling af protoner
    const ids=sel.map((_,i)=>i); let seed=A*7+3; ids.sort((x,y)=>((x*9301+seed)%233)-((y*9301+seed)%233));
    const prot=new Set(ids.slice(0,Z));
    sel.forEach((p,i)=>{ const m=new THREE.Mesh(gp,prot.has(i)?mp:mn); m.position.set(p.x*1,p.y*1,p.z*1); G.add(m); });
    const R=1.2*Math.pow(A,1/3);
    info.innerHTML=T3(`A = ${A}${NAMES[A]?' ('+NAMES[A]+')':''} · Z ≈ ${Z} protoner (røde), N ≈ ${A-Z} neutroner (blå)<br>R = r<sub>0</sub>A<sup>1/3</sup> ≈ ${F3(R,1)} fm · β = ${F3(b,2)}`,
      `A = ${A}${NAMES[A]?' ('+NAMES[A]+')':''} · Z ≈ ${Z} protons (red), N ≈ ${A-Z} neutrons (blue)<br>R = r<sub>0</sub>A<sup>1/3</sup> ≈ ${F3(R,1)} fm · β = ${F3(b,2)}`);
    S.camera.position.setLength(5+2.2*Math.pow(A,1/3)); }
  As.oninput=bs.oninput=build;
  chips('#nucsel button',bt=>{As.value=bt.dataset.a; bs.value=bt.dataset.b; build();}); build();
})();
