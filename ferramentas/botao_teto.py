# Uso: python3 ferramentas/botao_teto.py
# Nas páginas que têm o teto flutuante (const ROOF_P=), põe o botão "⤓ Teto (PNG)" ao lado do botão do costado
# e carrega planificacao_teto.js. Não duplica. Depois rode ferramentas/versao_js.py.
import glob, os, re
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for f in sorted(glob.glob(os.path.join(raiz, 'tanques', '*.html'))):
    t = open(f, encoding='utf-8').read()
    if 'const ROOF_P=' not in t or 'id="teto-png"' in t: continue
    m = re.search(r'(    <button id="planif-png"[^\n]*</button>\n)', t)
    btn = m.group(1).replace('id="planif-png"', 'id="teto-png"').replace(
        'title="Baixar a imagem da planificação (igual à da planilha)"', 'title="Baixar a imagem do teto flutuante (vista de cima, limpeza do lençol)"').replace(
        '&#10515; Planificação (PNG)', '&#10515; Teto (PNG)')
    t = t.replace(m.group(1), m.group(1) + btn, 1)
    s = re.search(r'<script src="\.\./planificacao\.js(\?v=[0-9a-f]+)?"></script>\n?', t)
    t = t[:s.end()] + '<script src="../planificacao_teto.js"></script>\n' + t[s.end():]
    open(f, 'w', encoding='utf-8').write(t); print('botão do teto →', os.path.basename(f))
