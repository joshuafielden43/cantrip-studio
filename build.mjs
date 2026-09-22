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
// Rewrite targets must be outside /still-have-it/ to avoid Pages redirect loops.
cpSync(new URL('still-have-it/index.html', import.meta.url), new URL('shi-shell.html', output));
cpSync(new URL('still-have-it/privacy/index.html', import.meta.url), new URL('shi-privacy.html', output));
