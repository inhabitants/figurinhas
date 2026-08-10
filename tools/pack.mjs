#!/usr/bin/env node
// Assembles the pack from finished stickers: generates the tray (96x96 icon)
// and the contents.json in the format WhatsApp sticker apps read (Sticker
// Maker Studio and friends).
//
// WhatsApp accepts at MOST 30 stickers per pack (and at least 3). A bigger
// collection is not your mistake: it becomes several parts. This script splits
// it on its own and writes each part into its own folder, ready to import.
// Without that the app chokes on import and never says why.
//
// Usage:
//   node tools/pack.mjs --name "My Pack" --author "Your Name"
//   node tools/pack.mjs --dir helen-inbt/com-texto --out packs-whatsapp
//   node tools/pack.mjs --dir output --tray output/05-amei.webp --site https://yoursite.com

import sharp from "sharp";
import { readdirSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const DIR = arg("dir", "output");
const OUT = arg("out", null); // without --out, writes into the source folder (single pack)
const NAME = arg("name", "My pack");
const AUTHOR = arg("author", "");
const SITE = arg("site", "");
const MAX = 30; // WhatsApp's per-pack limit

if (!existsSync(DIR)) {
    console.error(`The folder "${DIR}/" does not exist. Run the cutout first: node tools/cutout.mjs`);
    process.exit(1);
}
const stickers = readdirSync(DIR).filter((f) => f.endsWith(".webp") && f !== "tray.webp");
if (stickers.length < 3) {
    console.error(`WhatsApp asks for at least 3 stickers per pack (found ${stickers.length} in "${DIR}/").`);
    process.exit(1);
}

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Split into parts of up to 30, preserving file order.
const parts = [];
for (let i = 0; i < stickers.length; i += MAX) parts.push(stickers.slice(i, i + MAX));

for (const [idx, batch] of parts.entries()) {
    const part = idx + 1;
    const name = parts.length > 1 ? `${NAME} ${part}` : NAME;
    // One folder per part when --out is given; without it, writes into the
    // source folder (which only makes sense for a collection that fits one pack).
    const target = OUT ? join(OUT, `${slug(NAME)}-${part}`) : DIR;
    mkdirSync(target, { recursive: true });

    if (OUT) for (const f of batch) copyFileSync(join(DIR, f), join(target, f));

    // The tray is the pack icon: a 96x96 PNG. It comes from the first sticker
    // of the part, or from whichever you pick with --tray.
    const trayFrom = arg("tray", join(DIR, batch[0]));
    await sharp(trayFrom).resize(96, 96).png().toFile(join(target, "tray.png"));

    // Emojis stay as placeholders: you (or your agent) are the one who knows
    // which emoji matches each expression. Edit contents.json before importing.
    const contents = {
        android_play_store_link: "",
        ios_app_store_link: "",
        sticker_packs: [
            {
                identifier: `${slug(NAME)}-${part}`,
                name,
                publisher: AUTHOR,
                tray_image_file: "tray.png",
                image_data_version: "1",
                avoid_cache: false,
                publisher_website: SITE,
                stickers: batch.map((f) => ({ image_file: f, emojis: ["🙂"] })),
            },
        ],
    };
    writeFileSync(join(target, "contents.json"), JSON.stringify(contents, null, 2) + "\n");
    console.log(`ok  "${name}": ${batch.length} stickers in ${target}/`);
}

if (parts.length > 1) {
    console.log(`\nThat is ${parts.length} packs because WhatsApp accepts at most ${MAX} per pack.`);
}
console.log(`\nSwap the 🙂 placeholders in contents.json for the emojis that match each expression,`);
console.log(`then import each folder in a sticker app (Sticker Maker on Android, Sticker Maker Studio on iOS).`);
console.log(`Telegram has no such ceiling: BotFather -> @Stickers -> /newpack, uploading everything at once.`);
