"""Passa os modelos 3D de pintura de 4 para 3 etapas: Hidrojato, Fundo e Acabamento (decisão do Paulo, 22/11/2026).
- A 2ª demão (intermediária) deixa de existir: chapa com 2ª demão conta como Fundo concluído (Fundo = maior entre 1ª e 2ª).
- Avanço por área (m²); global = média simples das 3 etapas.
- Chapa com etapa em andamento: cor da última etapa concluída com riscos cruzados na cor da etapa em andamento.
Uso: python ferramentas/tres_etapas.py [arquivos.html]   (sem argumentos: tanques/*.html; pode rodar várias vezes; em página já com 3 etapas só converte DATA novo que vier com 4 valores)"""
import pathlib, re, sys, json

def conv_p(m):
    p = json.loads(m.group(1))
    if len(p) != 4: return m.group(0)
    return '"p": ' + json.dumps([p[0], max(p[1], p[2]), p[3]])

PAINT = (
 "function stripeTex(base,part,w){const k=base+part+'|'+w.toFixed(2);if(stripeTex.c[k])return stripeTex.c[k];"
 "const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,64,64);"
 "x.strokeStyle=part;x.lineWidth=4;for(let k=-64;k<=64;k+=16){x.beginPath();x.moveTo(k,64);x.lineTo(k+64,0);x.stroke();x.beginPath();x.moveTo(k,0);x.lineTo(k+64,64);x.stroke();}"
 "const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(Math.max(1,w*R*Math.PI/180/1.4),2.44/1.4);return stripeTex.c[k]=t;}stripeTex.c={};\n"
 "function partOf(d){if(view!=='geral')return null;let best=-1,part=-1;for(let i=0;i<STAGES.length;i++)if(d.p[i]>=1)best=i;"
 "for(let i=best+1;i<STAGES.length;i++)if(d.p[i]>0&&d.p[i]<1){part=i;break;}return part>=0?[best,part]:null;}\n"
 "function paint(){stripeTex.c={};meshes.forEach(m=>{const d=m.userData,pp=partOf(d),w=((d.e-d.s)+360)%360;"
 "if(pp){const b=pp[0]>=0?'#'+PC(pp[0],d).getHexString():'#E4E6E8';let s='#'+PC(pp[1],d).getHexString();if(s.toUpperCase()==='#FFFFFF'&&b!=='#1c1c1c')s='#F4F4F1';"
 "if(b===s)s='#8A9096';m.material.map=stripeTex(b,s,w);m.material.color.set(0xffffff);m.geometry=m.gF;m.baseE.setHex(0x111111);m.material.emissive.copy(m.baseE);m.material.needsUpdate=true;return;}"
 "const c=colorOf(d);if(!c){if(!d._t){const t=hatch.clone();t.needsUpdate=true;t.repeat.set(Math.max(1,w*R*Math.PI/180/1.4),2.44/1.4);d._t=t;}"
 "m.material.map=d._t;m.material.color.set(0xEEF0EE);m.geometry=m.gT;m.baseE.setHex(0);}"
 "else{m.material.map=null;m.material.color.copy(c);m.geometry=m.gF;m.baseE.copy(c).multiplyScalar(c.equals(pal[STAGES.length-1])?0.5:0.06);}"
 "m.material.emissive.copy(m.baseE);m.material.needsUpdate=true;});}")

def converte(t):
    if 'const DATA=[' not in t: return None
    i = t.index('const DATA=['); j = t.index('];', i)
    t0 = t; t = t[:i] + re.sub(r'"p":\s*(\[[^\]]*\])', conv_p, t[i:j]) + t[j:]
    if 'const STAGES=[["Hidrojato","--hidro"],["Fundo","--fundo"],["Acabamento","--acab"]];' in t:  # já com 3 etapas: só ajusta dados novos de 4 valores
        return t if t != t0 else None
    if '["Intermediária 2ª demão","--inter"]' not in t: return None
    R = [
     ('const STAGES=[["Hidrojato","--hidro"],["Fundo 1ª demão","--fundo"],["Intermediária 2ª demão","--inter"],["Acabamento","--acab"]];',
      'const STAGES=[["Hidrojato","--hidro"],["Fundo","--fundo"],["Acabamento","--acab"]];'),
     ("/4*100)+'%'", "/STAGES.length*100)+'%'"),
     ("function PC(i,d){return i===3&&d.a===1?pal.acab1:pal[i];}", "function PC(i,d){return i===STAGES.length-1&&d.a===1?pal.acab1:pal[i];}"),
     ("for(let i=0;i<4;i++)if(d.p[i]>=1)best=i;", "for(let i=0;i<STAGES.length;i++)if(d.p[i]>=1)best=i;"),
     ("for(let i=0;i<4;i++)if(d.p[i]>0&&d.p[i]<1)part=i;", "for(let i=0;i<STAGES.length;i++)if(d.p[i]>0&&d.p[i]<1)part=i;"),
     ("${n.split(' ')[0]}${i===1?' 1ª':i===2?' 2ª':''}", "${n}"),
     ('<th>Inter.</th>', ''),
     ('média das 4 etapas', 'média das 3 etapas'),
     ('<span class="sw" style="background:var(--fundo)"></span>Fundo 1ª</button>', '<span class="sw" style="background:var(--fundo)"></span>Fundo</button>'),
    ]
    for a, b in R:
        if a not in t: raise SystemExit('não achei: ' + a[:60])
        t = t.replace(a, b)
    t = t.replace('bege = 2ª demão, ', '')
    t = re.sub(r'\s*<button data-v="2" aria-pressed="false"><span class="sw" style="background:var\(--inter\)"></span>Intermediária 2ª</button>', '', t)
    t = t.replace('<button data-v="3" aria-pressed="false">', '<button data-v="2" aria-pressed="false">')
    t, n = re.subn(r'function paint\(\)\{meshes\.forEach\(m=>\{.*?m\.material\.needsUpdate=true;\}\);\}', lambda m: PAINT, t, count=1, flags=re.S)
    if not n: raise SystemExit('paint não encontrado')
    return t

arqs = [pathlib.Path(a) for a in sys.argv[1:]] or sorted((pathlib.Path(__file__).resolve().parent.parent / "tanques").glob("*.html"))
for f in arqs:
    t = f.read_text(encoding="utf-8"); n = converte(t)
    if n is None: print("sem mudança:", f.name); continue
    f.write_text(n, encoding="utf-8"); print("ok:", f.name)
