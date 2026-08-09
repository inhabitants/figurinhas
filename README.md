<p align="center">
  <img src="helen-inbt/com-texto/01-kkkkk.webp" width="130" alt="Figurinha de exemplo: Helen rindo, legenda KKKKK">
  <img src="helen-inbt/com-texto/06-socorro.webp" width="130" alt="Figurinha de exemplo: Helen desesperada, legenda SOCORRO">
  <img src="helen-inbt/com-texto/16-ideia.webp" width="130" alt="Figurinha de exemplo: Helen tendo uma ideia">
  <img src="helen-inbt/com-texto/36-borderless.webp" width="130" alt="Figurinha de exemplo: Helen confiante, legenda BORDERLESS">
  <img src="helen-inbt/com-texto/45-falaai.webp" width="130" alt="Figurinha de exemplo: Helen acenando, legenda FALA AI">
</p>

<h1 align="center">Faça suas figurinhas</h1>

<p align="center">
  Gerador open source de pack de figurinhas pra WhatsApp e Telegram.<br>
  Você traz o personagem; a receita de prompt, o recorte, a legenda e a montagem do pack saem daqui, por script, de graça, na sua máquina.<br>
  As 45 acima são o template que vem junto: a <a href="https://helenai.wtf">Helen INBT</a>, personagem original da série <a href="https://inhabitants.zone">INHABITANTS</a>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/gerador-Node%20%2B%20sharp-111111" alt="Gerador em Node com sharp">
  <img src="https://img.shields.io/badge/template-45%20figurinhas%20%C3%97%202-111111" alt="Template com 45 figurinhas em duas versões">
  <img src="https://img.shields.io/badge/licen%C3%A7a-CC%20BY%204.0-8EF1A4" alt="Licença CC BY 4.0">
</p>

---

## Como funciona

Seis passos, nenhum exige saber programar.

**1. Baixa o kit.** Sem git, sem cadastro: botão verde Code, Download ZIP, descompacta numa pasta.

**2. Instala o [Node.js](https://nodejs.org).** Versão LTS, instala com o padrão. Se o terminal responde a `node -v`, tá feito.

**3. Gera as imagens do seu personagem.** Usa a [receita abaixo](#a-receita-aberta) em qualquer gerador de imagem que aceite referência. De 1 a 4 referências travam a cara do personagem; o fundo sai naquele verde chroma de propósito. Salva as aprovadas em `input/`.

**4. Roda o recorte.** O verde some, cada imagem vira figurinha 512x512 transparente abaixo de 100KB, em `output/`:

```
npm install
npm run recorta
```

**5. Legenda e pack.** A legenda entra por código (modelo de imagem erra acento em português). Depois o pack: ícone e `contents.json` prontos pra importar. O WhatsApp aceita no máximo 30 figurinhas por pack, então coleção maior sai quebrada em partes sozinha, uma pasta cada.

```
node tools/legenda.mjs output/01-risada.webp "KKKKK"
npm run pack -- --nome "Meu Pack" --autor "Você" --out packs
```

**6. Instala e usa.** WhatsApp: um app de figurinha (Sticker Maker no Android, Sticker Maker Studio no iOS) importa cada pasta de uma vez. Telegram: BotFather → @Stickers → /newpack, sobe os arquivos (lá não tem o teto de 30). Seu personagem vive nas suas conversas.

### Tem um agente? Ele faz por você

O kit vem com um [AGENTS.md](AGENTS.md) que qualquer agente de código (Claude Code, Cursor, Gemini CLI) lê sozinho. Abre esta pasta no seu agente e pede **"faz o pack de figurinhas do meu personagem com essas fotos"**: ele monta os prompts, roda o recorte, desenha as legendas e entrega o pack. Você só aprova as imagens.

## A receita, aberta

Um prompt com três slots e quatro regras. Troca o personagem e a expressão, mantém o resto.

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

**03. Referência é o que mantém a mesma cara.** Até quatro imagens do personagem como referência em toda geração. É o que faz as figurinhas parecerem a mesma pessoa mudando de humor, e não várias pessoas parecidas.

**04. O texto entra depois, por código.** Escrever a palavra na imagem faz o modelo errar acento em português. Desenhar a legenda por cima depois sai legível, editável, e deixa você exportar a mesma figurinha com e sem texto.

### O recorte

O `recorta.mjs` faz uma varredura (flood fill) a partir das quatro bordas: apaga o verde e para no contorno preto do desenho, o que preserva os vãos fechados (o buraco entre as mãos, por exemplo). Dois cuidados que custaram iteração pra achar:

- Bolsão de fundo cercado pelo desenho não encosta na borda, então a varredura não chega nele. Uma segunda passada semeia por dentro, com tolerância apertada (`--sementes 45`), senão sobra verde no meio da figura.
- Se a paleta do personagem tem algum verde, confere o resultado: tolerância larga come o desenho. Dá pra apertar com `--tolerancia 45 --sementes 30`.

No fim ele normaliza em 512x512 com margem de 16px e exporta em WebP abaixo de 100KB, que é o teto do WhatsApp.

## O template que vem junto: Helen INBT

Prova de que a receita funciona: 45 figurinhas do mesmo personagem, em [`helen-inbt/com-texto/`](helen-inbt/com-texto/) e [`helen-inbt/sem-texto/`](helen-inbt/sem-texto/), cada pasta com `tray.png` e `contents.json` prontos pra importar. Usa como referência de qualidade, como pack mesmo, ou como material de remix (a licença deixa).

<p align="center">
  <img src="helen-inbt/com-texto/01-kkkkk.webp" width="110" alt="KKKKK">
  <img src="helen-inbt/com-texto/02-que.webp" width="110" alt="QUÊ?!">
  <img src="helen-inbt/com-texto/03-aff.webp" width="110" alt="aff">
  <img src="helen-inbt/com-texto/04-bora.webp" width="110" alt="BORA">
  <img src="helen-inbt/com-texto/05-amei.webp" width="110" alt="AMEI">
  <img src="helen-inbt/com-texto/06-socorro.webp" width="110" alt="SOCORRO">
  <img src="helen-inbt/com-texto/07-zzz.webp" width="110" alt="boa noite">
  <img src="helen-inbt/com-texto/08-hmm.webp" width="110" alt="hmm">
  <img src="helen-inbt/com-texto/09-isso.webp" width="110" alt="ISSO!">
  <img src="helen-inbt/com-texto/10-seinao.webp" width="110" alt="sei não">
  <img src="helen-inbt/com-texto/11-valeu.webp" width="110" alt="VALEU">
  <img src="helen-inbt/com-texto/12-ainao.webp" width="110" alt="ai não">
  <img src="helen-inbt/com-texto/13-tudobem.webp" width="110" alt="tá tudo bem">
  <img src="helen-inbt/com-texto/14-chega.webp" width="110" alt="CHEGA">
  <img src="helen-inbt/com-texto/15-seila.webp" width="110" alt="sei lá">
  <img src="helen-inbt/com-texto/16-ideia.webp" width="110" alt="IDEIA">
  <img src="helen-inbt/com-texto/17-escolhe.webp" width="110" alt="escolhe uma">
  <img src="helen-inbt/com-texto/18-naofecha.webp" width="110" alt="não fecha">
  <img src="helen-inbt/com-texto/19-contatudo.webp" width="110" alt="conta tudo">
  <img src="helen-inbt/com-texto/20-meescuta.webp" width="110" alt="me escuta">
  <img src="helen-inbt/com-texto/21-perfeito.webp" width="110" alt="PERFEITO">
  <img src="helen-inbt/com-texto/22-calma.webp" width="110" alt="calma">
  <img src="helen-inbt/com-texto/23-euavisei.webp" width="110" alt="eu avisei">
  <img src="helen-inbt/com-texto/24-degen.webp" width="110" alt="degen">
  <img src="helen-inbt/com-texto/25-naovourir.webp" width="110" alt="não vou rir">
  <img src="helen-inbt/com-texto/26-farmei.webp" width="110" alt="FARMEI">
  <img src="helen-inbt/com-texto/27-sextou.webp" width="110" alt="SEXTOU">
  <img src="helen-inbt/com-texto/28-somaisum.webp" width="110" alt="só mais um">
  <img src="helen-inbt/com-texto/29-merecido.webp" width="110" alt="MERECIDO">
  <img src="helen-inbt/com-texto/30-quedia.webp" width="110" alt="que dia">
  <img src="helen-inbt/com-texto/31-sinapse.webp" width="110" alt="SINAPSE">
  <img src="helen-inbt/com-texto/32-grau.webp" width="110" alt="GRAU">
  <img src="helen-inbt/com-texto/33-rito.webp" width="110" alt="RITO">
  <img src="helen-inbt/com-texto/34-prototipa.webp" width="110" alt="PROTOTIPA">
  <img src="helen-inbt/com-texto/35-ombros.webp" width="110" alt="ombros de gigantes">
  <img src="helen-inbt/com-texto/36-borderless.webp" width="110" alt="BORDERLESS">
  <img src="helen-inbt/com-texto/37-agua.webp" width="110" alt="seja água">
  <img src="helen-inbt/com-texto/38-xadrez.webp" width="110" alt="xadrez 4D">
  <img src="helen-inbt/com-texto/39-duvida.webp" width="110" alt="dúvida">
  <img src="helen-inbt/com-texto/40-deepshadow.webp" width="110" alt="deepshadow">
  <img src="helen-inbt/com-texto/41-koi.webp" width="110" alt="koi">
  <img src="helen-inbt/com-texto/42-tesao.webp" width="110" alt="TESÃO">
  <img src="helen-inbt/com-texto/43-inventario.webp" width="110" alt="inventário">
  <img src="helen-inbt/com-texto/44-beta.webp" width="110" alt="BETA">
  <img src="helen-inbt/com-texto/45-falaai.webp" width="110" alt="fala ai">
</p>

<details>
<summary><b>As mesmas 45 sem texto</b> (pra legendar do seu jeito)</summary>
<br>
<p align="center">
  <img src="helen-inbt/sem-texto/01-kkkkk.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/02-que.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/03-aff.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/04-bora.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/05-amei.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/06-socorro.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/07-zzz.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/08-hmm.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/09-isso.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/10-seinao.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/11-valeu.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/12-ainao.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/13-tudobem.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/14-chega.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/15-seila.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/16-ideia.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/17-escolhe.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/18-naofecha.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/19-contatudo.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/20-meescuta.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/21-perfeito.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/22-calma.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/23-euavisei.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/24-degen.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/25-naovourir.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/26-farmei.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/27-sextou.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/28-somaisum.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/29-merecido.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/30-quedia.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/31-sinapse.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/32-grau.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/33-rito.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/34-prototipa.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/35-ombros.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/36-borderless.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/37-agua.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/38-xadrez.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/39-duvida.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/40-deepshadow.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/41-koi.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/42-tesao.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/43-inventario.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/44-beta.webp" width="110" alt="">
  <img src="helen-inbt/sem-texto/45-falaai.webp" width="110" alt="">
</p>
</details>

Sobre o estilo delas: anime cel-shaded com contorno de nanquim, borda branca de die-cut, cores chapadas, cintura pra cima, legenda em Impact por código. A coleção também vive em [sapiensinteticos.com/figurinhas](https://www.sapiensinteticos.com/figurinhas), e a Helen vive o dia a dia dela em [helenai.wtf](https://helenai.wtf).

## Prefere que a máquina venha montada?

A mesma receita roda dentro do [Sapiens Sintéticos](https://www.sapiensinteticos.com/por-dentro): personagem travado entre as gerações, recorte automático e o pack aparece no chat da comunidade quando fica pronto. Fazer livre aqui ou fazer lá é escolha sua.

## Licença

[CC BY 4.0](LICENSE). Usa, remixa, redistribui, inclusive comercialmente, só dá o crédito (Sapiens Sintéticos, com link pra [sapiensinteticos.com](https://www.sapiensinteticos.com)).
