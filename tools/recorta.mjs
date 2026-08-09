#!/usr/bin/env node
// Recorta o fundo chroma (#00E000) e normaliza cada imagem em figurinha
// 512x512 WebP transparente abaixo de 100KB (o teto do WhatsApp).
//
// O recorte é uma varredura (flood fill) a partir das quatro bordas, que apaga
// o verde e PARA no contorno do desenho. É isso que preserva os vãos fechados
// (o buraco entre as mãos): um chroma key global comeria qualquer verde da
// paleta do personagem; a varredura só come o que está conectado ao fundo.
// Bolsão de verde cercado pelo desenho não encosta na borda, então uma segunda
// passada semeia dentro dele, com tolerância mais apertada pra não vazar.
//
// Uso:
//   node tools/recorta.mjs                     # varre input/ e escreve output/
//   node tools/recorta.mjs --in fotos --out figurinhas
//   node tools/recorta.mjs --tolerancia 60 --sementes 45

import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, parse } from "node:path";

const arg = (nome, padrao) => {
    const i = process.argv.indexOf(`--${nome}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

const DIR_IN = arg("in", "input");
const DIR_OUT = arg("out", "output");
const TOL_BORDA = Number(arg("tolerancia", 60)); // varredura a partir das bordas
const TOL_SEMENTE = Number(arg("sementes", 45)); // bolsões internos (apertada de propósito)
const CHROMA = [0, 224, 0]; // #00E000
const LADO = 512;
const MARGEM = 16;
const TETO_BYTES = 100 * 1024;

const dist = (r, g, b) =>
    Math.sqrt((r - CHROMA[0]) ** 2 + (g - CHROMA[1]) ** 2 + (b - CHROMA[2]) ** 2);

async function recorta(arquivo) {
    const origem = sharp(join(DIR_IN, arquivo)).ensureAlpha();
    const { data, info } = await origem.raw().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;

    const visitado = new Uint8Array(W * H);
    const fila = [];
    const empurra = (x, y) => {
        const i = y * W + x;
        if (!visitado[i]) {
            visitado[i] = 1;
            fila.push(x, y);
        }
    };

    const varre = (tol) => {
        while (fila.length) {
            const y = fila.pop();
            const x = fila.pop();
            const p = (y * W + x) * 4;
            if (dist(data[p], data[p + 1], data[p + 2]) > tol) continue;
            data[p + 3] = 0;
            if (x > 0) empurra(x - 1, y);
            if (x < W - 1) empurra(x + 1, y);
            if (y > 0) empurra(x, y - 1);
            if (y < H - 1) empurra(x, y + 1);
        }
    };

    // Passada 1: as quatro bordas semeiam a varredura.
    for (let x = 0; x < W; x++) {
        empurra(x, 0);
        empurra(x, H - 1);
    }
    for (let y = 0; y < H; y++) {
        empurra(0, y);
        empurra(W - 1, y);
    }
    varre(TOL_BORDA);

    // Passada 2: bolsões internos. Pixel ainda opaco e MUITO próximo do chroma
    // vira semente; a tolerância apertada evita comer o desenho.
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const p = (y * W + x) * 4;
            if (data[p + 3] > 0 && !visitado[y * W + x] && dist(data[p], data[p + 1], data[p + 2]) <= TOL_SEMENTE) {
                empurra(x, y);
            }
        }
    }
    varre(TOL_SEMENTE);

    // Caixa do que sobrou opaco.
    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (data[(y * W + x) * 4 + 3] > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) throw new Error("a imagem ficou 100% transparente (o fundo é mesmo #00E000?)");

    const recortada = sharp(data, { raw: { width: W, height: H, channels: 4 } })
        .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
        .resize(LADO - 2 * MARGEM, LADO - 2 * MARGEM, { fit: "inside", withoutEnlargement: false });
    const miolo = await recortada.png().toBuffer();

    // Exporta caindo a qualidade até caber no teto do WhatsApp.
    const tela = sharp({
        create: { width: LADO, height: LADO, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([{ input: miolo, gravity: "center" }]);
    const base = await tela.png().toBuffer();

    for (const q of [90, 80, 70, 60, 50]) {
        const webp = await sharp(base).webp({ quality: q }).toBuffer();
        if (webp.length <= TETO_BYTES) return { webp, quality: q };
    }
    const webp = await sharp(base).webp({ quality: 40 }).toBuffer();
    return { webp, quality: 40 };
}

if (!existsSync(DIR_IN)) {
    console.error(`A pasta "${DIR_IN}/" não existe. Cria ela e joga as imagens geradas lá dentro.`);
    process.exit(1);
}
const arquivos = readdirSync(DIR_IN).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
if (!arquivos.length) {
    console.error(`Nenhuma imagem em "${DIR_IN}/". Gera com a receita do README e salva lá.`);
    process.exit(1);
}
mkdirSync(DIR_OUT, { recursive: true });

let ok = 0;
for (const arquivo of arquivos) {
    const destino = join(DIR_OUT, `${parse(arquivo).name}.webp`);
    try {
        const { webp, quality } = await recorta(arquivo);
        await sharp(webp).toFile(destino);
        const kb = Math.round(statSync(destino).size / 1024);
        console.log(`ok  ${arquivo} -> ${destino} (${kb}KB, q${quality})`);
        ok++;
    } catch (e) {
        console.error(`ERRO ${arquivo}: ${e.message}`);
    }
}
console.log(`\n${ok}/${arquivos.length} figurinhas em "${DIR_OUT}/". Próximo passo: node tools/pack.mjs`);
