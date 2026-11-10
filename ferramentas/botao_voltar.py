"""Coloca o botão "← Tanques" (volta à página inicial) em todos os modelos de tanques/.
Uso: python ferramentas/botao_voltar.py   (pode rodar várias vezes; não duplica)"""
import pathlib, re
BOTAO = ('<a id="voltar-tanques" href="../" style="display:inline-block;margin:0 0 6px;'
         'padding:4px 10px;border:1px solid currentColor;border-radius:6px;font:600 13px system-ui,sans-serif;'
         'color:inherit;text-decoration:none;opacity:.8">&larr; Tanques</a>')
raiz = pathlib.Path(__file__).resolve().parent.parent / "tanques"
for f in sorted(raiz.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    if 'id="voltar-tanques"' in t and '<meta charset' in t[:2000].lower():
        print("já tem:", f.name); continue
    if 'id="voltar-tanques"' in t:
        t = re.sub(r'\n\s*<a id="voltar-tanques".*?</a>', '', t, count=1)
    t2, n = re.subn(r'(<header>\s*<div>)', r'\1\n    ' + BOTAO.replace('\\', '\\\\'), t, count=1)
    if not n:  # modelo sem <header><div>: botão fixo no canto
        t2 = BOTAO.replace('style="', 'style="position:fixed;top:10px;left:10px;z-index:9999;background:#fff;color:#1c2530;') + '\n' + t
    if '<meta charset' not in t2[:2000].lower():  # garante acentos certos ao abrir o arquivo
        t2 = '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + t2
    f.write_text(t2, encoding="utf-8"); print("ok:", f.name)
