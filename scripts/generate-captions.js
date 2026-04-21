/**
 * generate-captions.js
 *
 * Generates AI captions for each photo in data/projects.json using Claude.
 * Run once locally before deploying:
 *
 *   npm run captions
 *
 * Requires: ANTHROPIC_API_KEY in .env
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'projects.json');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateCaptionsForProject(project) {
  const photoList = project.photos
    .map((p, i) => `${i + 1}. ${p.alt}`)
    .join('\n');

  console.log(`  Prompt: "${project.aiPrompt.slice(0, 80)}..."`);

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `${project.aiPrompt}\n\nPhotos:\n${photoList}\n\nReturn ONLY a valid JSON array of objects, one per photo, in order. Each object must have exactly two keys:\n- "caption": the text (max 280 characters)\n- "song": the suggested song as "Artist - Title"\nNo explanation, no markdown fences, no extra text.`
    }]
  });

  const raw = message.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  let results;
  try {
    results = JSON.parse(raw);
  } catch (e) {
    console.error(`  ✗ Failed to parse JSON for "${project.id}". Raw:\n${raw}`);
    throw e;
  }

  if (results.length !== project.photos.length) {
    throw new Error(
      `Result count mismatch for "${project.id}": got ${results.length}, expected ${project.photos.length}`
    );
  }

  return results;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set. Add it to .env');
    process.exit(1);
  }

  const projects = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

  for (const project of projects) {
    console.log(`\nGenerating captions for: ${project.title} (${project.photos.length} photos)`);
    const results = await generateCaptionsForProject(project);
    project.photos.forEach((photo, i) => {
      photo.caption = results[i].caption;
      photo.songSuggestion = results[i].song;
    });
    console.log(`  ✓ ${results.length} captions + song suggestions written`);
  }

  writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));
  console.log('\n✓ All captions saved to data/projects.json');
  console.log('  Commit the file to include captions in your deployment.');
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
