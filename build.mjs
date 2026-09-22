import { cpSync, mkdirSync, rmSync } from 'node:fs';

const output = new URL('./dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
for (const name of ['index.html', '_redirects', '_headers', 'assets', 'still-have-it', 'fortune-cookie']) {
  cpSync(new URL(name, import.meta.url), new URL(name, output), {
    recursive: true,
    filter: source => !/(^|\/)(creative|writer|src|node_modules)(\/|$)|\.(md|mjs|cjs)$|\/package(?:-lock)?\.json$/.test(source),
  });
}
