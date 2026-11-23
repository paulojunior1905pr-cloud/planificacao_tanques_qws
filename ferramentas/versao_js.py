# Uso: python3 ferramentas/versao_js.py
# Coloca ?v=<hash de planificacao.js> no <script src="../planificacao.js"> de todas as páginas dos tanques,
# para o navegador e o GitHub Pages não usarem uma cópia antiga do desenho do PNG. Rodar sempre que planificacao.js mudar.
import hashlib, re, glob, os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
v = hashlib.sha1(open(os.path.join(raiz, 'planificacao.js'), 'rb').read()).hexdigest()[:8]
for f in sorted(glob.glob(os.path.join(raiz, 'tanques', '*.html'))):
    t = open(f, encoding='utf-8').read()
    n = re.sub(r'<script src="\.\./planificacao\.js(\?v=[0-9a-f]+)?">', f'<script src="../planificacao.js?v={v}">', t)
    if n != t: open(f, 'w', encoding='utf-8').write(n); print('versão', v, '→', os.path.basename(f))
