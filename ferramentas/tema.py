"""Coloca o botão de tema (escuro / claro) em todos os modelos de tanques/.
A escolha fica guardada no navegador e vale também na página inicial.
Uso: python ferramentas/tema.py   (pode rodar várias vezes; não duplica)"""
import pathlib, re

# lê a escolha salva antes de desenhar a página (evita piscar no tema errado)
CEDO = ('<script id="tema-cedo">try{var t=localStorage.getItem("tema-tanques");'
        'if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>')

BOTAO = ('<button id="tema-toggle" type="button" style="display:inline-block;margin:0 0 6px 6px;'
         'padding:4px 10px;border:1px solid currentColor;border-radius:6px;font:600 13px system-ui,sans-serif;'
         'color:inherit;background:transparent;cursor:pointer;opacity:.8">Tema</button>')

LOGICA = r'''<script id="tema-logica">(function(){
var b=document.getElementById("tema-toggle"),r=document.documentElement,mq=matchMedia("(prefers-color-scheme: dark)");
function atual(){var t=r.getAttribute("data-theme");return t==="dark"||t==="light"?t:(mq.matches?"dark":"light")}
function rot(){var e=atual()==="dark";b.textContent=e?"☀ Claro":"☾ Escuro";b.title=e?"Mudar para o tema claro":"Mudar para o tema escuro";b.setAttribute("aria-label",b.title)}
b.addEventListener("click",function(){var n=atual()==="dark"?"light":"dark";r.setAttribute("data-theme",n);try{localStorage.setItem("tema-tanques",n)}catch(e){}rot()});
mq.addEventListener&&mq.addEventListener("change",rot);
addEventListener("storage",function(e){if(e.key==="tema-tanques"&&(e.newValue==="dark"||e.newValue==="light")){r.setAttribute("data-theme",e.newValue);rot()}});
rot()})();</script>'''

raiz = pathlib.Path(__file__).resolve().parent.parent / "tanques"
for f in sorted(raiz.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    # tira versões anteriores para regravar a atual
    t = re.sub(r'<script id="tema-cedo">.*?</script>\n?', '', t, flags=re.S)
    t = re.sub(r'<script id="tema-logica">.*?</script>\n?', '', t, flags=re.S)
    t = re.sub(r'\n?\s*<button id="tema-toggle".*?</button>', '', t, count=1, flags=re.S)
    # 1) leitura cedo, logo após o <meta charset>
    t, n1 = re.subn(r'(<meta charset="utf-8">\n)', lambda m: m.group(1) + CEDO + '\n', t, count=1)
    # 2) botão ao lado do "← Tanques"
    t, n2 = re.subn(r'(<a id="voltar-tanques".*?</a>)', lambda m: m.group(1) + '\n    ' + BOTAO, t, count=1, flags=re.S)
    if not n2:
        t = BOTAO.replace('style="', 'style="position:fixed;top:10px;right:10px;z-index:9999;background:var(--bg,#fff);') + '\n' + t
    # 3) lógica no fim da página
    i = t.rfind('</body>')
    t = (t[:i] + LOGICA + '\n' + t[i:]) if i >= 0 else t + '\n' + LOGICA + '\n'
    f.write_text(t, encoding="utf-8"); print("ok:", f.name, "(cedo)" if n1 else "(sem meta charset!)")
