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
