import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const [name, source] = process.argv.slice(2);
if (!/^(tournaments|teams|rules|faq|contacts|profile)$/.test(name ?? "") || !source) {
  throw new Error("Usage: node scripts/optimize-page-object.mjs <name> <source.png>");
}
const directory = resolve("public/page-objects");
await mkdir(directory, { recursive: true });
const metadata = await sharp(source).metadata();
if (!metadata.hasAlpha) throw new Error("Transparent source required");
const pipeline = sharp(source).resize(512, 512, { fit: "contain", background: "#00000000" });
await pipeline.clone().png({ compressionLevel: 9 }).toFile(resolve(directory, `${name}.png`));
await pipeline.clone().webp({ quality: 88, alphaQuality: 100 }).toFile(resolve(directory, `${name}.webp`));
const stats = await sharp(resolve(directory, `${name}.png`)).stats();
const alpha = stats.channels[3];
if (!alpha || alpha.min !== 0 || alpha.max !== 255) throw new Error("Missing transparent/opaque pixels");
console.log(`${name}: 512px PNG + WebP, alpha 0–255`);
