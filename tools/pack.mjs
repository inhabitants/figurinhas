#!/usr/bin/env node
// Monta o pack a partir das figurinhas prontas: gera o tray (ícone 96x96) e o
// contents.json no formato que os apps de figurinha do WhatsApp leem
// (Sticker Maker Studio e afins).
//
// O WhatsApp aceita no MÁXIMO 30 figurinhas por pack (e no mínimo 3). Coleção
// maior que isso não é erro seu: ela vira várias partes. Este script divide
// sozinho e escreve cada parte numa pasta própria, pronta pra importar. Sem
// isso o app engasga na importação e não diz por quê.
//
// Uso:
//   node tools/pack.mjs --nome "Meu Pack" --autor "Seu Nome"
//   node tools/pack.mjs --dir helen-inbt/com-texto --out packs-whatsapp
//   node tools/pack.mjs --dir output --tray output/05-amei.webp --site https://seusite.com

import sharp from "sharp";
import { readdirSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const arg = (nome, padrao) => {
    const i = process.argv.indexOf(`--${nome}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};

const DIR = arg("dir", "output");
const OUT = arg("out", null); // sem --out, escreve na própria pasta (pack único)
const NOME = arg("nome", "Meu pack");
const AUTOR = arg("autor", "");
const SITE = arg("site", "");
const TETO = 30; // limite do WhatsApp por pack

if (!existsSync(DIR)) {
    console.error(`A pasta "${DIR}/" não existe. Roda o recorte primeiro: node tools/recorta.mjs`);
    process.exit(1);
}
const figurinhas = readdirSync(DIR).filter((f) => f.endsWith(".webp") && f !== "tray.webp");
if (figurinhas.length < 3) {
    console.error(`O WhatsApp pede no mínimo 3 figurinhas por pack (achei ${figurinhas.length} em "${DIR}/").`);
    process.exit(1);
}

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Divide em partes de até 30, preservando a ordem dos arquivos.
const partes = [];
for (let i = 0; i < figurinhas.length; i += TETO) partes.push(figurinhas.slice(i, i + TETO));

for (const [idx, lote] of partes.entries()) {
    const parte = idx + 1;
    const nome = partes.length > 1 ? `${NOME} ${parte}` : NOME;
    // Uma pasta por parte quando há --out; sem ele, escreve na pasta de origem
    // (só faz sentido pra coleção que já cabe num pack).
    const destino = OUT ? join(OUT, `${slug(NOME)}-${parte}`) : DIR;
    mkdirSync(destino, { recursive: true });

    if (OUT) for (const f of lote) copyFileSync(join(DIR, f), join(destino, f));

    // O tray é o ícone do pack: 96x96 PNG. Sai da primeira figurinha da parte,
    // ou da que você escolher com --tray.
    const trayDe = arg("tray", join(DIR, lote[0]));
    await sharp(trayDe).resize(96, 96).png().toFile(join(destino, "tray.png"));

    // Emoji fica de placeholder: é você (ou o agente) quem sabe qual emoji casa
    // com cada expressão. Edita o contents.json antes de importar.
    const contents = {
        android_play_store_link: "",
        ios_app_store_link: "",
        sticker_packs: [
            {
                identifier: `${slug(NOME)}-${parte}`,
                name: nome,
                publisher: AUTOR,
                tray_image_file: "tray.png",
                image_data_version: "1",
                avoid_cache: false,
                publisher_website: SITE,
                stickers: lote.map((f) => ({ image_file: f, emojis: ["🙂"] })),
            },
        ],
    };
    writeFileSync(join(destino, "contents.json"), JSON.stringify(contents, null, 2) + "\n");
    console.log(`ok  "${nome}": ${lote.length} figurinhas em ${destino}/`);
}

if (partes.length > 1) {
    console.log(`\nSão ${partes.length} packs porque o WhatsApp aceita no máximo ${TETO} por pack.`);
}
console.log(`\nTroca os emojis 🙂 do contents.json pelos que casam com cada expressão`);
console.log(`e importa cada pasta num app de figurinha (Sticker Maker no Android, Sticker Maker Studio no iOS).`);
console.log(`No Telegram não tem esse teto: BotFather -> @Stickers -> /newpack, subindo tudo de uma vez.`);
