#!/usr/bin/env node
// Desenha a legenda por cima da figurinha (a regra 04 da receita: texto nunca
// sai do modelo de imagem, entra depois por código, senão o acento erra).
//
// Uso:
//   node tools/legenda.mjs output/01-kkkkk.webp "KKKKK"
//   node tools/legenda.mjs output/01-kkkkk.webp "KKKKK" --out minha-pasta
//   node tools/legenda.mjs output/01-kkkkk.webp "sei lá" --tamanho 80

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, parse } from "node:path";

const argv = process.argv.slice(2);
const posicionais = [];
for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
        i++; // pula o valor do flag
        continue;
    }
    posicionais.push(argv[i]);
}
const [arquivo, texto] = posicionais;
const arg = (nome, padrao) => {
    const i = process.argv.indexOf(`--${nome}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

if (!arquivo || !texto) {
    console.error('Uso: node tools/legenda.mjs <figurinha.webp> "TEXTO" [--out pasta] [--tamanho 92]');
    process.exit(1);
}

// "output-com-texto" de propósito: "com-texto/" é a pasta das figurinhas da
// Helen, e legenda de usuário nunca escreve lá.
const DIR_OUT = arg("out", "output-com-texto");
const TAMANHO = Number(arg("tamanho", 92));
const LADO = 512;

// Impact é a fonte clássica de figurinha; onde ela não existe (Linux pelado),
// cai pra uma sans bold qualquer. Contorno preto por baixo do branco
// (paint-order) pra ler em qualquer fundo de conversa.
const escapado = texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const svg = `<svg width="${LADO}" height="${LADO}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="${LADO - 28}" text-anchor="middle"
    font-family="Impact, 'Arial Black', 'DejaVu Sans', sans-serif"
    font-size="${TAMANHO}" font-weight="900"
    fill="#ffffff" stroke="#000000" stroke-width="10"
    style="paint-order: stroke" letter-spacing="2">${escapado}</text>
</svg>`;

mkdirSync(DIR_OUT, { recursive: true });
const destino = join(DIR_OUT, `${parse(arquivo).name}.webp`);
await sharp(arquivo)
    .composite([{ input: Buffer.from(svg) }])
    .webp({ quality: 90 })
    .toFile(destino);
console.log(`ok  "${texto}" -> ${destino}`);
