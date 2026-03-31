import fs from 'node:fs/promises';

async function formatFile(filepath: string) {
  return await fs.readFile(filepath, 'utf8');
}

export { formatFile };
