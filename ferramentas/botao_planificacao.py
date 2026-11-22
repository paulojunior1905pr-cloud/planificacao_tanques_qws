"""Coloca o botão "⤓ Planificação (PNG)" em todos os modelos de tanques/.
O botão gera no navegador a imagem da planificação no layout da planilha (4 setores de 90°) e baixa o PNG.
O desenho fica em planificacao.js (raiz do site); aqui só vai o botão, a faixa da escada e o <script>.
Uso: python ferramentas/botao_planificacao.py   (pode rodar várias vezes; atualiza sem duplicar)
Tanque novo: acrescente a faixa da escada (graus, 0° = Norte) em ESCADA."""
import pathlib, re, json
ESCADA = {"TQ-61006": [100, 121], "TQ-61009": [241.5, 260], "TQ-69024": [208, 216], "TQ-62025": [20, 53]}
BOTAO = ('<button id="planif-png" type="button" title="Baixar a imagem da planificação (igual à da planilha)" '
         'style="display:inline-block;margin:0 0 6px 6px;padding:4px 10px;border:1px solid currentColor;border-radius:6px;'
         'font:600 13px system-ui,sans-serif;color:inherit;background:transparent;cursor:pointer;opacity:.8">&#10515; Planificação (PNG)</button>')
raiz = pathlib.Path(__file__).resolve().parent.parent / "tanques"
for f in sorted(raiz.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    t = re.sub(r'\s*<button id="planif-png".*?</button>', '', t, flags=re.S)
    t = re.sub(r'\n?<script id="planif-cfg">.*?</script>\n?<script src="\.\./planificacao\.js"></script>', '', t, flags=re.S)
    t, n = re.subn(r'(<button id="tema-toggle".*?</button>)', lambda m: m.group(1) + '\n    ' + BOTAO, t, count=1, flags=re.S)
    if not n:
        t, n = re.subn(r'(<a id="voltar-tanques".*?</a>)', lambda m: m.group(1) + '\n    ' + BOTAO, t, count=1, flags=re.S)
    if not n: print("sem lugar para o botão:", f.name); continue
    cfg = json.dumps({"escada": ESCADA.get(f.stem)})
    t = t.rstrip() + f'\n<script id="planif-cfg">window.PLANIF_CFG={cfg};</script>\n<script src="../planificacao.js"></script>\n'
    f.write_text(t, encoding="utf-8"); print("ok:", f.name)
