#!/usr/bin/env node
// Cuts out the chroma background (#00E000) and normalizes every image into a
// 512x512 transparent WebP sticker under 100KB (WhatsApp's ceiling).
//
// The cutout is a flood fill seeded from the four edges: it erases the green
// and STOPS at the drawing's outline. That is what preserves enclosed gaps
// (the hole between two hands): a global chroma key would eat any green in the
// character's palette, while the flood fill only eats what is connected to the
// background. A pocket of green fenced in by the drawing never touches an edge,
// so a second pass seeds inside it with a tighter tolerance to avoid bleeding.
//
// Usage:
//   node tools/cutout.mjs                        # reads input/, writes output/
//   node tools/cutout.mjs --in photos --out stickers
//   node tools/cutout.mjs --tolerance 60 --seeds 45

import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, parse } from "node:path";

const arg = (name, fallback) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const DIR_IN = arg("in", "input");
const DIR_OUT = arg("out", "output");
const TOL_EDGE = Number(arg("tolerance", 60)); // flood fill from the edges
const TOL_SEED = Number(arg("seeds", 45)); // inner pockets (tight on purpose)
const CHROMA = [0, 224, 0]; // #00E000
const SIDE = 512;
const MARGIN = 16;
const MAX_BYTES = 100 * 1024;

const dist = (r, g, b) =>
    Math.sqrt((r - CHROMA[0]) ** 2 + (g - CHROMA[1]) ** 2 + (b - CHROMA[2]) ** 2);

async function cutout(file) {
    const source = sharp(join(DIR_IN, file)).ensureAlpha();
    const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;

    const visited = new Uint8Array(W * H);
    const queue = [];
    const push = (x, y) => {
        const i = y * W + x;
        if (!visited[i]) {
            visited[i] = 1;
            queue.push(x, y);
        }
    };

    const fill = (tol) => {
        while (queue.length) {
            const y = queue.pop();
            const x = queue.pop();
            const p = (y * W + x) * 4;
            if (dist(data[p], data[p + 1], data[p + 2]) > tol) continue;
            data[p + 3] = 0;
            if (x > 0) push(x - 1, y);
            if (x < W - 1) push(x + 1, y);
            if (y > 0) push(x, y - 1);
            if (y < H - 1) push(x, y + 1);
        }
    };

    // Pass 1: the four edges seed the flood fill.
    for (let x = 0; x < W; x++) {
        push(x, 0);
        push(x, H - 1);
    }
    for (let y = 0; y < H; y++) {
        push(0, y);
        push(W - 1, y);
    }
    fill(TOL_EDGE);

    // Pass 2: inner pockets. A pixel still opaque and VERY close to the chroma
    // becomes a seed; the tight tolerance keeps it from eating the drawing.
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const p = (y * W + x) * 4;
            if (data[p + 3] > 0 && !visited[y * W + x] && dist(data[p], data[p + 1], data[p + 2]) <= TOL_SEED) {
                push(x, y);
            }
        }
    }
    fill(TOL_SEED);

    // Bounding box of whatever stayed opaque.
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
    if (maxX < 0) throw new Error("the image came out 100% transparent (is the background really #00E000?)");

    const cropped = sharp(data, { raw: { width: W, height: H, channels: 4 } })
        .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
        .resize(SIDE - 2 * MARGIN, SIDE - 2 * MARGIN, { fit: "inside", withoutEnlargement: false });
    const inner = await cropped.png().toBuffer();

    // Export, stepping quality down until it fits WhatsApp's ceiling.
    const canvas = sharp({
        create: { width: SIDE, height: SIDE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([{ input: inner, gravity: "center" }]);
    const base = await canvas.png().toBuffer();

    for (const q of [90, 80, 70, 60, 50]) {
        const webp = await sharp(base).webp({ quality: q }).toBuffer();
        if (webp.length <= MAX_BYTES) return { webp, quality: q };
    }
    const webp = await sharp(base).webp({ quality: 40 }).toBuffer();
    return { webp, quality: 40 };
}

if (!existsSync(DIR_IN)) {
    console.error(`The folder "${DIR_IN}/" does not exist. Create it and drop your generated images there.`);
    process.exit(1);
}
const files = readdirSync(DIR_IN).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
if (!files.length) {
    console.error(`No images in "${DIR_IN}/". Generate them with the recipe in the README and save them there.`);
    process.exit(1);
}
mkdirSync(DIR_OUT, { recursive: true });

let ok = 0;
for (const file of files) {
    const target = join(DIR_OUT, `${parse(file).name}.webp`);
    try {
        const { webp, quality } = await cutout(file);
        await sharp(webp).toFile(target);
        const kb = Math.round(statSync(target).size / 1024);
        console.log(`ok  ${file} -> ${target} (${kb}KB, q${quality})`);
        ok++;
    } catch (e) {
        console.error(`ERROR ${file}: ${e.message}`);
    }
}
console.log(`\n${ok}/${files.length} stickers in "${DIR_OUT}/". Next step: node tools/pack.mjs`);
