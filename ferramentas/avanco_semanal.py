"""Seletor de levantamento (avanço por semana) nas páginas 3D dos tanques.

Uso: python3 ferramentas/avanco_semanal.py tanques/TQ-xxxxx.html Planificacao_Pintura_Costado_TQ-xxxxx.xlsx

Lê a aba "Lançamentos" da planilha, monta o avanço acumulado de cada chapa em cada
data de levantamento e injeta na página um seletor no cabeçalho (SEM nn · dd/mm).
Ao trocar a data, o 3D, os indicadores e a tabela por anel mostram a situação daquele
dia, com o ganho em relação ao levantamento anterior. Pode ser rodado de novo a cada
levantamento: o bloco anterior é substituído.
"""
import collections, datetime, json, re, sys
import openpyxl

ST = {'Hidrojato': 0, 'Fundo - 1ª demão': 1, 'Intermediária - 2ª demão': 2, 'Acabamento': 3}
INI, FIM = '<!-- avanco-semanal:inicio -->', '<!-- avanco-semanal:fim -->'


def lancamentos(xlsx):
    ws = openpyxl.load_workbook(xlsx, data_only=True)['Lançamentos']
    out = []
    for r in ws.iter_rows(min_row=6, values_only=True):
        if not isinstance(r[0], datetime.datetime) or r[1] not in ST or r[2] is None or r[3] is None:
            continue
        p = 1.0 if r[4] in (None, '') else float(r[4])
        out.append((r[0].date(), ST[r[1]], int(r[2]), int(r[3]), p / 100 if p > 1 else p))
    return out


def historico(rows, data):
    datas = sorted({r[0] for r in rows})
    hist = {}
    for D in datas:
        acc = collections.defaultdict(float)
        for d, i, a, n, p in rows:
            if d <= D:  # mesma regra da planilha: soma dos lançamentos, limitada a 100%
                acc[(a, n, i)] = min(1.0, acc[(a, n, i)] + p)
        hist[D.isoformat()] = [[round(acc.get((x['a'], x['n'], i), 0), 3) for i in range(4)] for x in data]
    return datas, hist


BLOCO = r'''<style>
.lev{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.lev-cap{font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.lev-seg{display:inline-flex;max-width:100%;overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--panel)}
.lev-seg button{font:500 12px var(--mono);color:var(--fg);background:transparent;border:0;padding:8px 14px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;cursor:pointer;white-space:nowrap}
.lev-seg button+button{border-left:1px solid var(--line)}
.lev-seg button small{font:600 10px var(--mono);letter-spacing:.08em;color:var(--muted)}
.lev-seg button[aria-pressed="true"]{background:var(--fg);color:var(--bg)}
.lev-seg button[aria-pressed="true"] small{color:var(--bg);opacity:.7}
.lev-seg button:focus-visible{outline:2px solid var(--hidro);outline-offset:-2px}
.lev-d{font:600 11px var(--mono);color:#2F7D4F;background:rgba(47,125,79,.12);border-radius:3px;padding:2px 6px;margin-right:8px;white-space:nowrap}
.lev-d.z{color:var(--muted);background:rgba(127,135,142,.14)}
.lev-g{margin-top:6px}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .lev-d:not(.z){color:#7BC596;background:rgba(123,197,150,.14)}}
:root[data-theme="dark"] .lev-d:not(.z){color:#7BC596;background:rgba(123,197,150,.14)}
@media (max-width:900px){.lev{align-items:flex-start}}
</style>
<script>
(function(){
const HIST=__HIST__;
const datas=HIST.datas;if(!datas.length||typeof DATA==='undefined')return;
const dm=s=>s.slice(8,10)+'/'+s.slice(5,7);
const sem=s=>{const d=new Date(s+'T12:00:00Z');const t=new Date(d);t.setUTCDate(d.getUTCDate()+3-((d.getUTCDay()+6)%7));const y=new Date(Date.UTC(t.getUTCFullYear(),0,4));return 1+Math.round(((t-y)/864e5-3+((y.getUTCDay()+6)%7))/7);};
const tot=DATA.reduce((s,d)=>s+d.ar,0);
const pcts=P=>{const st=[0,1,2,3].map(i=>DATA.reduce((s,d,j)=>s+d.ar*P[j][i],0)/tot*100);return {st,g:st.reduce((a,b)=>a+b,0)/4};};
const f1=x=>x.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const chip=v=>`<span class="lev-d${v<0.05?' z':''}">${v<0.05?'+0,0':'+'+f1(v)} pp</span>`;
const box=document.querySelector('header .date');
box.className='lev';
box.innerHTML='<span class="lev-cap">Levantamento</span><div class="lev-seg" role="group" aria-label="Escolher o levantamento">'+
  datas.map((d,k)=>`<button data-k="${k}" aria-pressed="false"><small>SEM ${sem(d)}</small>${dm(d)}</button>`).join('')+'</div>';
const gl=document.querySelector('.global .lbl');const gd=document.createElement('div');gd.className='lev-g';gl.parentNode.insertBefore(gd,gl.nextSibling);
function sel(k){
  const P=HIST.p[datas[k]];DATA.forEach((d,j)=>{d.p=P[j].slice();});
  kpis();paint();
  box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.k===k));
  if(k>0){const a=pcts(HIST.p[datas[k-1]]),b=pcts(P);
    document.querySelectorAll('#stages .pct').forEach((e,i)=>e.insertAdjacentHTML('afterbegin',chip(b.st[i]-a.st[i])));
    gd.innerHTML=chip(b.g-a.g).replace('pp</span>','pp desde '+dm(datas[k-1])+'</span>');}
  else gd.innerHTML='<span class="lev-d z">1º levantamento</span>';
}
box.addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(b)sel(+b.dataset.k);});
sel(datas.length-1);
})();
</script>'''


def main(html, xlsx):
    s = open(html, encoding='utf-8').read()
    s = re.sub(re.escape(INI) + '.*?' + re.escape(FIM) + '\n?', '', s, flags=re.S)
    data = json.loads(re.search(r'const DATA=(\[.*?\]);\n', s).group(1))
    rows = lancamentos(xlsx)
    datas, hist = historico(rows, data)
    if not datas:
        print(html, ': planilha sem lançamentos, nada a fazer');
        open(html, 'w', encoding='utf-8').write(s)
        return
    ultimo = hist[datas[-1].isoformat()]
    dif = [(x['a'], x['n']) for x, p in zip(data, ultimo) if any(abs(u - v) > 0.011 for u, v in zip(x['p'], p))]
    if dif:
        print('ATENÇÃO: o último levantamento da planilha não bate com a página nas chapas', dif[:10])
    bloco = BLOCO.replace('__HIST__', json.dumps({'datas': [d.isoformat() for d in datas], 'p': hist}, separators=(',', ':')))
    i = s.rfind('</body>')
    i = i if i >= 0 else len(s)
    s = s[:i] + INI + '\n' + bloco + '\n' + FIM + '\n' + s[i:]
    open(html, 'w', encoding='utf-8').write(s)
    print(html, ':', len(datas), 'levantamentos', [d.strftime('%d/%m') for d in datas])


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
