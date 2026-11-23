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
