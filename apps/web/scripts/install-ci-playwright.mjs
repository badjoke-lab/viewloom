import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const prefix = '/tmp/viewloom-playwright';
const appRoot = process.cwd();
const appNodeModules = resolve(appRoot, 'node_modules');

rmSync(prefix, { recursive: true, force: true });
mkdirSync(prefix, { recursive: true });

execFileSync(
  'npm',
  [
    'install',
    '--prefix',
    prefix,
    'playwright@1.52.0',
    '--no-save',
    '--no-audit',
    '--no-fund',
    '--ignore-scripts',
  ],
  { stdio: 'inherit' },
);

for (const packageName of ['playwright', 'playwright-core']) {
  const target = resolve(prefix, 'node_modules', packageName);
  const link = resolve(appNodeModules, packageName);
  if (!existsSync(target)) {
    throw new Error(`isolated Playwright install missing ${packageName}`);
  }
  rmSync(link, { recursive: true, force: true });
  symlinkSync(target, link, 'dir');
}

const playwrightBinary = resolve(prefix, 'node_modules', '.bin', 'playwright');
if (!existsSync(playwrightBinary)) {
  throw new Error('isolated Playwright install missing binary');
}

console.log(`Playwright installed in isolated prefix: ${prefix}`);
