# Figurinhas da Helen INBT

45 figurinhas da [Helen INBT](https://helenai.wtf), a Sintética da casa [Sapiens Sintéticos](https://www.sapiensinteticos.com), pra usar no WhatsApp, no Telegram e onde mais couber. De graça, com a receita aberta: este repo tem os arquivos E o caminho pra você fazer o pack do seu personagem.

- **[`com-texto/`](com-texto/)**: as 45 com a legenda desenhada (KKKKK, SOCORRO, BORA...)
- **[`sem-texto/`](sem-texto/)**: as mesmas 45 limpas, pra legendar do seu jeito
- Cada pasta traz `tray.png` (ícone do pack) e `contents.json` no formato que apps de figurinha leem

Formato: WebP 512x512 com fundo transparente, abaixo de 100KB (o teto do WhatsApp).

## Onde elas vivem

- Pack no Telegram: adiciona com um toque em [t.me/addstickers](https://www.sapiensinteticos.com/figurinhas)
- Vitrine com a coleção inteira: [sapiensinteticos.com/figurinhas](https://www.sapiensinteticos.com/figurinhas)

## Como instalar

**Telegram**: usa o pack pronto (link acima). Um toque e entra.

**WhatsApp, caminho rápido (computador)**: abre o WhatsApp Web, clica no clipe, escolhe Figurinha e arrasta um arquivo da pasta. Ela entra nas suas favoritas e fica.

**WhatsApp, pack inteiro (celular)**: um app de figurinha (Sticker Maker Studio no Android e no iOS) importa a pasta de uma vez. O `contents.json` já vem no formato que esses apps leem.

## A receita, aberta

Estas 45 saíram de um prompt com três slots e quatro regras. Troca o personagem e a expressão, mantém o resto, e o pack é seu. Funciona em qualquer gerador de imagem que aceite referência.

### O prompt

```
Anime cel-shaded die-cut sticker of the exact same character
as in the reference images: [TRAÇOS FIXOS: cabelo, olhos, pele, roupa].
[A EXPRESSÃO E A POSE DESTA FIGURINHA].
Waist-up framing, the complete figure sits fully inside the square with a clear
empty margin on all four sides including below. Bold clean black ink outline,
thick white sticker cut border closing all the way around, flat cel shading,
vivid saturated colors. The entire background is one solid flat pure chroma
green (#00E000), perfectly uniform and empty.
```

### O que vetar (negative prompt)

```
background scenery, background objects, gradient background,
drop shadow on background, text, letters, watermark, frame, panel,
multiple characters, cropped body, figure touching image edge
```

### As quatro regras

**01. Fundo verde chroma, sempre o mesmo.** O verde puro (#00E000) existe pra ser apagado depois. Como ele não aparece em lugar nenhum do desenho, dá pra recortar por código, sem modelo de recorte e sem custo. Peça um fundo liso e uniforme, nunca um degradê.

**02. Margem nos quatro lados.** Sem margem embaixo, o contorno branco não fecha e a figurinha parece cortada no meio do peito. Vale repetir isso no prompt e ainda vetar o encostar na borda no campo negativo.

**03. Referência é o que mantém a mesma cara.** Até quatro imagens do personagem como referência em toda geração. É o que faz as 45 parecerem a mesma pessoa mudando de humor, e não 45 pessoas parecidas.

**04. O texto entra depois, por código.** Escrever a palavra na imagem faz o modelo errar acento em português. Desenhar a legenda por cima depois sai legível, editável, e deixa você exportar a mesma figurinha com e sem texto (é por isso que este repo tem as duas pastas).

### O recorte

Depois de gerar, o recorte é mecânico: uma varredura (flood fill) a partir das quatro bordas apaga o verde e para no contorno preto do desenho, o que preserva os vãos fechados (o buraco entre as mãos, por exemplo). Dois cuidados que custaram iteração pra achar:

- Bolsão de fundo cercado pelo desenho não encosta na borda, então a varredura não chega nele. Resolve com sementes internas de tolerância apertada, senão sobra verde no meio da figura.
- Se a paleta do personagem tem algum verde, confere a distância dele pro chroma antes de recortar. Tolerância larga come o desenho.

Sobra normalizar em 512x512 com uma margem de 16px e exportar em WebP abaixo de 100KB.

## Fazer o pack do seu personagem

A receita acima roda em qualquer lugar. No [Sapiens Sintéticos](https://www.sapiensinteticos.com/por-dentro) ela já vem montada: o personagem fica travado entre as gerações, o recorte sai automático e o pack aparece no chat da comunidade quando fica pronto.

## Licença

[CC BY 4.0](LICENSE). Usa, remixa, redistribui, inclusive comercialmente, só dá o crédito (Sapiens Sintéticos, com link pra [sapiensinteticos.com](https://www.sapiensinteticos.com)).
