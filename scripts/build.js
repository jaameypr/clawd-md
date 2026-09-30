// Renders every scene in clawd.config.json (or the file given as first argument) to <outDir>/<name>.svg.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { renderScene } from '../src/render.js';

const configPath = resolve(process.argv[2] || 'clawd.config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const outDir = resolve(dirname(configPath), config.outDir || 'assets');
await mkdir(outDir, { recursive: true });

for (const [name, scene] of Object.entries(config.scenes || {})) {
  const file = join(outDir, `${name}.svg`);
  await writeFile(file, renderScene(scene));
  console.log(`✓ ${name} -> ${file}`);
}
