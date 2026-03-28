import { cp, mkdir, rm } from 'node:fs/promises';

// Vercel projects often default to "dist" output. Mirror the built public folder
// so deploy succeeds even when dashboard settings still point to dist.
const sourceDir = 'public';
const targetDir = 'dist';

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });
await cp(sourceDir, targetDir, { recursive: true });
