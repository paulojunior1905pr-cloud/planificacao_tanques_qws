"""Coloca o botão "✎ Levantamento do costado" nos modelos de pintura do costado em tanques/.
O botão abre levantamento.html (e, nos tanques com teto flutuante, um segundo botão abre levantamento_teto.html) (raiz do site) já no tanque, para marcar o avanço clicando ou arrastando nas chapas.
A página lê os dados do próprio modelo (DATA, FAIXAS, NUM, escada e data do último levantamento), então não precisa
regravar nada quando o modelo muda.
Uso: python ferramentas/botao_levantamento.py   (pode rodar várias vezes; não duplica)"""
import pathlib, re, json
raiz = pathlib.Path(__file__).resolve().parent.parent
pintura = {t["id"] for t in json.loads((raiz / "tanques.json").read_text(encoding="utf-8")) if "pintura" in t.get("descricao", "").lower()}
for f in sorted((raiz / "tanques").glob("*.html")):
    if f.stem not in pintura: continue
    botao = (f'<a id="levantamento-manual" href="../levantamento.html#{f.stem}" title="Marcar o avanço clicando ou arrastando nas chapas da planificação" '
             'style="display:inline-block;margin:0 0 6px 6px;padding:4px 10px;border:1px solid currentColor;border-radius:6px;'
             'font:600 13px system-ui,sans-serif;color:inherit;text-decoration:none;opacity:.8">&#9998; Levantamento do costado</a>')
    t = f.read_text(encoding="utf-8")
    t = re.sub(r'\s*<a id="levantamento-(manual|teto)".*?</a>', '', t, flags=re.S)
    if "const ROOF_P=" in t:  # teto flutuante: segundo botão, logo depois do primeiro
        botao += ('\n    ' + botao.replace('levantamento-manual', 'levantamento-teto').replace('levantamento.html#', 'levantamento_teto.html#')
                  .replace('Marcar o avanço clicando ou arrastando nas chapas da planificação', 'Marcar a limpeza do lençol clicando ou arrastando nas chapas')
                  .replace('&#9998; Levantamento do costado', '&#9998; Levantamento do teto'))
    t, n = re.subn(r'(<button id="tema-toggle".*?</button>)', lambda m: m.group(1) + '\n    ' + botao, t, count=1, flags=re.S)
    if not n: print("sem lugar para o botão:", f.name); continue
    f.write_text(t, encoding="utf-8"); print("ok:", f.name)
