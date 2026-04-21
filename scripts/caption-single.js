/**
 * caption-single.js
 *
 * Generates a BEE caption for one photo and updates data/projects.json.
 * Called by the generate-caption GitHub Actions workflow.
 *
 *   node scripts/caption-single.js <gallery-id> <filename>
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const [,, galleryId, filename] = process.argv;
if (!galleryId || !filename) {
  console.error('Usage: node caption-single.js <gallery-id> <filename>');
  process.exit(1);
}

const __dirname  = dirname(fileURLToPath(import.meta.url));
const DATA_PATH  = join(__dirname, '..', 'data', 'projects.json');
const IMAGES_DIR = join(__dirname, '..', 'images');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function resizeImage(src, dest) {
  // Try ImageMagick (Linux/GitHub Actions), fall back to sips (macOS), then no resize
  try {
    execSync(`convert "${src}" -resize "1600x1600>" -quality 80 "${dest}" 2>/dev/null`);
    return;
  } catch {}
  try {
    execSync(`sips -Z 1600 "${src}" --out "${dest}" -s formatOptions 80 2>/dev/null`);
    return;
  } catch {}
  copyFileSync(src, dest);
}

async function main() {
  const projects = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  const project  = projects.find(p => p.id === galleryId);
  if (!project) { console.error(`Gallery "${galleryId}" not found`); process.exit(1); }

  const photo = project.photos.find(p => p.file === `${galleryId}/${filename}`);
  if (!photo) { console.error(`Photo "${filename}" not found in "${galleryId}"`); process.exit(1); }

  const imagePath = join(IMAGES_DIR, photo.file);
  const tmpDir    = mkdtempSync(join(tmpdir(), 'caption-'));
  const tmpFile   = join(tmpDir, 'photo.jpg');

  await resizeImage(imagePath, tmpFile);
  const imageData = readFileSync(tmpFile).toString('base64');
  rmSync(tmpDir, { recursive: true });

  const message = await client.messages.create({
    model:      'claude-opus-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } },
        { type: 'text',  text: `${project.aiPrompt}\n\nReturn ONLY a JSON object: {"caption":"..."}. No markdown fences.` }
      ]
    }]
  });

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  photo.caption = JSON.parse(raw).caption;
  writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));

  console.log(`✓ Caption written for ${galleryId}/${filename}`);
  console.log(`  "${photo.caption}"`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
