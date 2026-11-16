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

## Seletor de levantamento (avanço por semana)
Cada modelo mostra no cabeçalho os levantamentos (SEM nn · dd/mm). Ao trocar a data, o 3D, os
indicadores e a tabela por anel mostram a situação daquele dia, com o ganho desde o levantamento anterior.
Depois de atualizar um modelo com um levantamento novo, rode:
`python ferramentas/avanco_semanal.py tanques/TQ-xxxxx.html Planificacao_Pintura_Costado_TQ-xxxxx.xlsx`
(lê a aba Lançamentos; pode rodar de novo, substitui o bloco anterior).
