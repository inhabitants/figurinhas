#!/usr/bin/env node
// Monta o pack a partir das figurinhas prontas: gera o tray (ícone 96x96) e o
// contents.json no formato que os apps de figurinha do WhatsApp leem
// (Sticker Maker Studio e afins).
//
// Uso:
//   node tools/pack.mjs --nome "Meu Pack" --autor "Seu Nome"
//   node tools/pack.mjs --dir com-texto --tray com-texto/05-amei.webp --site https://seusite.com

import sharp from "sharp";
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const arg = (nome, padrao) => {
    const i = process.argv.indexOf(`--${nome}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

const DIR = arg("dir", "output");
const NOME = arg("nome", "Meu pack");
const AUTOR = arg("autor", "");
const SITE = arg("site", "");

if (!existsSync(DIR)) {
    console.error(`A pasta "${DIR}/" não existe. Roda o recorte primeiro: node tools/recorta.mjs`);
    process.exit(1);
}
const figurinhas = readdirSync(DIR).filter((f) => f.endsWith(".webp") && f !== "tray.webp");
if (figurinhas.length < 3) {
    console.error(`O WhatsApp pede no mínimo 3 figurinhas por pack (achei ${figurinhas.length} em "${DIR}/").`);
    process.exit(1);
}

// O tray é o ícone do pack: 96x96 PNG. Sai da primeira figurinha, ou da que
// você escolher com --tray.
const trayDe = arg("tray", join(DIR, figurinhas[0]));
await sharp(trayDe).resize(96, 96).png().toFile(join(DIR, "tray.png"));

// Emoji fica de placeholder: é você (ou o agente) quem sabe qual emoji casa
// com cada expressão. Edita o contents.json antes de importar.
const contents = {
    android_play_store_link: "",
    ios_app_store_link: "",
    sticker_packs: [
        {
            identifier: NOME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            name: NOME,
            publisher: AUTOR,
            tray_image_file: "tray.png",
            image_data_version: "1",
            avoid_cache: false,
            publisher_website: SITE,
            stickers: figurinhas.map((f) => ({ image_file: f, emojis: ["🙂"] })),
        },
    ],
};
writeFileSync(join(DIR, "contents.json"), JSON.stringify(contents, null, 2) + "\n");

console.log(`ok  ${figurinhas.length} figurinhas no pack "${NOME}"`);
console.log(`    ${join(DIR, "tray.png")} + ${join(DIR, "contents.json")}`);
console.log(`\nAgora troca os emojis 🙂 do contents.json pelos que casam com cada expressão`);
console.log(`e importa a pasta num app de figurinha (Sticker Maker Studio no Android/iOS).`);
console.log(`No Telegram: BotFather -> @Stickers -> /newpack, subindo os arquivos da pasta.`);
