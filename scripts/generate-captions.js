/**
 * generate-captions.js
 *
 * Regenerates captions for all photos in data/projects.json using Claude vision.
 * Each photo is sent as a base64 image so Claude writes text truly inspired by it.
 *
 *   npm run captions
 *
 * Requires: ANTHROPIC_API_KEY in .env
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { config } from 'dotenv';

config();

const __dirname  = dirname(fileURLToPath(import.meta.url));
const DATA_PATH  = join(__dirname, '..', 'data', 'projects.json');
const IMAGES_DIR = join(__dirname, '..', 'images');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateCaptionForPhoto(photo, aiPrompt) {
  const imagePath = join(IMAGES_DIR, photo.file);
  const tmpDir    = mkdtempSync(join(tmpdir(), 'caption-'));
  const tmpFile   = join(tmpDir, 'photo.jpg');

  try {
    execSync(`sips -Z 1600 "${imagePath}" --out "${tmpFile}" -s formatOptions 80 2>/dev/null`);
  } catch {
    execSync(`sips -Z 1600 "${imagePath}" --out "${tmpFile}" 2>/dev/null`);
  }

  const imageData = readFileSync(tmpFile).toString('base64');
  rmSync(tmpDir, { recursive: true });

  const message = await client.messages.create({
    model:      'claude-opus-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } },
        { type: 'text',  text: `${aiPrompt}\n\nReturn ONLY a JSON object: {"caption":"..."}. No markdown fences.` }
      ]
    }]
  });

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(raw).caption;
  } catch (e) {
    console.error(`  ✗ Failed to parse JSON for "${photo.file}". Raw:\n${raw}`);
    throw e;
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set. Add it to .env');
    process.exit(1);
  }

  const projects = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

  for (const project of projects) {
    console.log(`\nGenerating captions for: ${project.title} (${project.photos.length} photos)`);
    for (const photo of project.photos) {
      process.stdout.write(`  → ${photo.file} ... `);
      photo.caption = await generateCaptionForPhoto(photo, project.aiPrompt);
      console.log('✓');
    }
  }

  writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));
  console.log('\n✓ All captions saved to data/projects.json');
  console.log('  Commit the file to include captions in your deployment.');
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
