#!/usr/bin/env node
// Draws the caption on top of a finished sticker (rule 04 of the recipe: text
// never comes out of the image model, it goes on afterwards in code, otherwise
// accented characters come out wrong).
//
// Usage:
//   node tools/caption.mjs output/01-kkkkk.webp "KKKKK"
//   node tools/caption.mjs output/01-kkkkk.webp "KKKKK" --out my-folder
//   node tools/caption.mjs output/01-kkkkk.webp "sei la" --size 80

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, parse } from "node:path";

const argv = process.argv.slice(2);
const positional = [];
for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
        i++; // skip the flag's value
        continue;
    }
    positional.push(argv[i]);
}
const [file, text] = positional;
const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

if (!file || !text) {
    console.error('Usage: node tools/caption.mjs <sticker.webp> "TEXT" [--out folder] [--size 92]');
    process.exit(1);
}

// "output-captioned" on purpose: helen-inbt/com-texto/ is the template's own
// captioned folder, and a user caption never writes in there.
const DIR_OUT = arg("out", "output-captioned");
const SIZE = Number(arg("size", 92));
const SIDE = 512;

// Impact is the classic sticker face; where it does not exist (a bare Linux
// box) it falls back to any bold sans. Black stroke under the white fill
// (paint-order) so it reads on any chat background.
const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const svg = `<svg width="${SIDE}" height="${SIDE}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="${SIDE - 28}" text-anchor="middle"
    font-family="Impact, 'Arial Black', 'DejaVu Sans', sans-serif"
    font-size="${SIZE}" font-weight="900"
    fill="#ffffff" stroke="#000000" stroke-width="10"
    style="paint-order: stroke" letter-spacing="2">${escaped}</text>
</svg>`;

mkdirSync(DIR_OUT, { recursive: true });
const target = join(DIR_OUT, `${parse(file).name}.webp`);
await sharp(file)
    .composite([{ input: Buffer.from(svg) }])
    .webp({ quality: 90 })
    .toFile(target);
console.log(`ok  "${text}" -> ${target}`);
