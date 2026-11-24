# Uso: python3 ferramentas/versao_js.py
# Coloca ?v=<hash de planificacao.js> no <script src="../planificacao.js"> de todas as páginas dos tanques,
# para o navegador e o GitHub Pages não usarem uma cópia antiga do desenho do PNG. Rodar sempre que planificacao.js mudar.
import hashlib, re, glob, os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for js in ('planificacao.js', 'planificacao_teto.js'):
    v = hashlib.sha1(open(os.path.join(raiz, js), 'rb').read()).hexdigest()[:8]
    for f in sorted(glob.glob(os.path.join(raiz, 'tanques', '*.html'))):
        t = open(f, encoding='utf-8').read()
        n = re.sub(r'<script src="\.\./' + re.escape(js) + r'(\?v=[0-9a-f]+)?">', f'<script src="../{js}?v={v}">', t)
        if n != t: open(f, 'w', encoding='utf-8').write(n); print(js, v, '→', os.path.basename(f))
