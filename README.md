# Tanques em 3D

Página inicial com os modelos 3D offline dos tanques, publicada pelo GitHub Pages.

## Adicionar um tanque
1. Coloque o modelo em `tanques/` (ex.: `tanques/TQ-70000.html`).
2. (Opcional) Coloque uma imagem de prévia em `imagens/` (ex.: `imagens/TQ-70000.png`).
3. Acrescente um bloco em `tanques.json`:

```json
{
  "id": "TQ-70000",
  "descricao": "Pintura do costado · Ø 50 m",
  "desenho": "DE-....",
  "modelo": "tanques/TQ-70000.html",
  "imagem": "imagens/TQ-70000.png"
}
```

Lembre da vírgula entre um bloco e outro. A ordem no arquivo é a ordem na página.

## Retirar um tanque
Apague o bloco dele em `tanques.json` (e, se quiser, os arquivos em `tanques/` e `imagens/`).

## Botão "← Tanques"
Cada modelo tem um botão para voltar à página inicial. Ao adicionar um modelo novo, rode
`python ferramentas/botao_voltar.py` para colocar o botão nele (não duplica nos que já têm).

## Tema escuro / claro
A página inicial e cada modelo têm um botão "☾ Escuro / ☀ Claro". A escolha fica guardada no navegador
e vale para todas as páginas (sem escolha, segue o tema do aparelho). As cores das etapas não mudam.
Ao adicionar um modelo novo, rode `python ferramentas/tema.py` para colocar o botão nele (não duplica).

## Botão "⤓ Planificação (PNG)"
Cada modelo tem um botão que gera no navegador a imagem da planificação no layout da planilha
(faixa única de 360°, um anel por linha, cada chapa na posição real, sem número de chapa) e baixa o PNG
(`TQ-xxxxx_planificacao_DD-MM-AAAA.png`). Usa os dados que já estão na página; o desenho fica em `planificacao.js`.
Ao adicionar um modelo novo, acrescente a faixa da escada em `ferramentas/botao_planificacao.py` e rode
`python ferramentas/botao_planificacao.py` (não duplica).
Sempre que `planificacao.js` mudar, rode `python ferramentas/versao_js.py`: ele põe `?v=<hash>` no `<script>` das páginas
para o navegador não usar uma cópia antiga do desenho. Ao regravar uma página de tanque, mantenha o botão, o tema e os
`<script>` do final (`planif-cfg` e `planificacao.js`).

## Botão "⤓ Teto (PNG)"
Nas páginas com teto flutuante (`const ROOF_P=`), o botão baixa a vista de cima do lençol com a limpeza
(`TQ-xxxxx_teto_planificacao_DD-MM-AAAA.png`, modelo A escolhido pelo Paulo em 24/11/2026).
Padrão aprovado (24/11/2026): vista de cima, legenda com só 2 itens, **Limpo** e **Não limpo** (sem "limpeza parcial");
chapa limpa em parte mostra a parte limpa em azul e o resto em bege; cartões Limpo / Não limpo (m² e % do lençol) + Lençol limpo (%);
só o lençol, sem o flutuador/pontão e sem o costado (25/11/2026); BVs do teto (laranja) e ângulos a cada 30° em volta do lençol. O desenho fica em
`planificacao_teto.js`. Para pôr o botão num tanque novo com teto: `python ferramentas/botao_teto.py` e depois `python ferramentas/versao_js.py`.

## Levantamento manual (`levantamento.html`)
Nos modelos de pintura do costado, o botão "✎ Levantamento do costado" abre `levantamento.html#TQ-xxxxx`. Nela o avanço é marcado
direto na planificação 360°: clique pinta a chapa inteira, arrastar pinta só a área do retângulo, e o modo "Em andamento"
marca a chapa com o % digitado. O avanço por etapa e o global (média das 3 etapas) recalculam na hora, e a lista mostra as
chapas alteradas. A base é o último levantamento do próprio modelo (a página lê `DATA`, `FAIXAS`, `NUM`, a escada e a data
direto de `tanques/TQ-xxxxx.html`, então não precisa regravar nada quando o modelo muda). O resultado sai por
"Copiar resultado para o chat" (JSON só com as chapas alteradas) ou pelos botões ⤓ JSON / ⤓ CSV; o rascunho fica no navegador.
Tanque novo de pintura: rode `python ferramentas/botao_levantamento.py` (não duplica).

## Levantamento do teto (`levantamento_teto.html`)
Nos modelos com teto flutuante (`const ROOF_P=`), o botão "✎ Levantamento do teto" abre `levantamento_teto.html#TQ-xxxxx`:
vista de cima do lençol (norte para cima), marcando **Limpo / Não limpo** com clique (chapa inteira), arrastar (só a área) ou
"Limpeza parcial" (% da chapa, a partir do lado leste, como no PNG do teto). Mostra m² limpo, % do lençol limpo e as chapas
alteradas; sai por "Copiar resultado para o chat", ⤓ JSON e ⤓ CSV (`limpo` = fração da chapa, mesma chave `fiada-chapa` de `ROOF_L`).
A base vem de `ROOF_P`/`ROOF_L` do próprio modelo. O botão é colocado por `ferramentas/botao_levantamento.py`.
