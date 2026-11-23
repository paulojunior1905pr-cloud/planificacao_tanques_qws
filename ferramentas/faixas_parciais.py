# Uso: python3 ferramentas/faixas_parciais.py faixas.json tanques/TQ-xxxxx.html [outro.html ...]
# Insere FAIXAS (faixa pintada numa parte da chapa, ex.: anel 6 acima do contraventamento) no 3D; o botão PNG lê a mesma constante.
import re,sys,json
fx=json.load(open(sys.argv[1]))["faixas"]
ET=["Hidrojato","Fundo","Acabamento"]
FA=[{"a":f["anel"],"e":ET.index(f["etapa"]),"de":f["de"],"ate":f["ate"],"t":f["frac_topo"],"txt":"Acabamento acima do contraventamento"} for f in fx]
for fn in sys.argv[2:]:
    t=open(fn).read()
    assert 'const FAIXAS' not in t
    m=re.search(r'const DATA=\[.*?\];',t,re.S)
    js=("\n// Faixas pintadas numa parte da chapa, na posição real (ex.: anel 6 acima do contraventamento).\n"
        "// d.pr = avanço do restante da chapa (sem a faixa); d.p continua sendo o avanço da chapa inteira (usado nos %).\n"
        "const FAIXAS="+json.dumps(FA,ensure_ascii=False)+";\n"
        "(function(){function ov(s,e,a0,a1){const w=((e-s)%360+360)%360;let t=0;for(const sh of[-360,0,360]){const lo=Math.max(s+sh,a0),hi=Math.min(s+sh+w,a1);if(hi>lo)t+=hi-lo;}return w?Math.min(1,t/w):0;}\n"
        " FAIXAS.forEach(f=>DATA.forEach(d=>{if(d.a!==f.a)return;const cov=f.t*ov(d.s,d.e,f.de,f.ate);if(cov<=0)return;d.fx=(d.fx||0)+cov;d.pr=(d.pr||d.p.slice());for(let i=0;i<=f.e;i++)d.pr[i]=cov<1?Math.max(0,d.pr[i]-cov)/(1-cov):0;}));})();\n"
        "const PV=d=>d.pr||d.p;\n")
    t=t[:m.end()]+js+t[m.end():]
    # colorOf / partOf usam o restante da chapa
    i=t.index('function colorOf(d){'); j=t.index('function paint(){')
    seg=t[i:j].replace('d.p[i]','PV(d)[i]')
    t=t[:i]+seg+t[j:]
    # tooltip
    old='(d.o?`<div>${d.o}</div>`:\'\')'
    assert old in t
    t=t.replace(old,old+"+(d.fx?`<div>Faixa superior: ${FAIXAS.filter(f=>f.a===d.a).map(f=>f.txt).join(', ')}</div>`:'')",1)
    # faixa 3D: depois do listener das vistas
    anchor="document.querySelectorAll('.views button').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.v;"
    k=t.index(anchor)
    band=("// faixas parciais (topo do anel): superfície na cor da etapa com contorno vermelho\n"
      "const BANDS=FAIXAS.map(f=>{const w=f.ate-f.de,ts=Math.PI-f.ate*Math.PI/180,tl=w*Math.PI/180,bh=f.t*H,yTop=f.a*H,grp=new THREE.Group();\n"
      " const surf=new THREE.Mesh(new THREE.CylinderGeometry(R+0.04,R+0.04,bh,Math.ceil(w)*2,1,true,ts,tl),new THREE.MeshLambertMaterial({side:THREE.DoubleSide}));surf.position.y=yTop-bh/2;grp.add(surf);\n"
      " const red=new THREE.MeshBasicMaterial({color:0xD32F2F,side:THREE.DoubleSide});\n"
      " [yTop-0.07,yTop-bh+0.07].forEach(y=>{const r=new THREE.Mesh(new THREE.CylinderGeometry(R+0.09,R+0.09,0.14,Math.ceil(w)*2,1,true,ts,tl),red);r.position.y=y;grp.add(r);});\n"
      " [f.de,f.ate].forEach(b=>{const r=b*Math.PI/180,m=new THREE.Mesh(new THREE.BoxGeometry(0.16,bh,0.16),red);m.position.set((R+0.09)*Math.sin(r),yTop-bh/2,-(R+0.09)*Math.cos(r));grp.add(m);});\n"
      " scene.add(grp);return{f,grp,surf};});\n"
      "function paintBands(){BANDS.forEach(({f,grp,surf})=>{const i=view==='geral'?f.e:+view;grp.visible=i<=f.e;if(!grp.visible)return;const c=PC(i,{a:f.a});surf.material.color.copy(c);surf.material.emissive=c.clone().multiplyScalar(i===STAGES.length-1?0.5:0.06);surf.material.needsUpdate=true;});}\n"
      "{const _p=paint;paint=function(){_p();paintBands();};}paintBands();\n")
    t=t[:k]+band+t[k:]
    open(fn,'w').write(t); print('ok',fn)
