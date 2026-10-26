import { access, cp, mkdir, rm } from 'node:fs/promises';

// Prepare a self-contained dist folder for Capacitor Android and local preview
const sourceBuildDir = 'public/build';
const targetDir = 'dist';
const targetBuildDir = 'dist/build';

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetBuildDir, { recursive: true });
await cp(sourceBuildDir, targetBuildDir, { recursive: true });

// Place index.html at dist root for Capacitor Android webview
await cp('public/build/index.html', 'dist/index.html');

// Copy assets directory so both /assets and /build/assets resolve
try {
  await cp('public/build/assets', 'dist/assets', { recursive: true });
} catch {
  // Ignore if missing
}

const copyIfExists = async (from, to) => {
  try {
    await access(from);
    await cp(from, to);
  } catch {
    // Ignore missing optional static files
  }
};

await copyIfExists('public/favicon.svg', 'dist/favicon.svg');
await copyIfExists('public/favicon.ico', 'dist/favicon.ico');
await copyIfExists('public/apple-touch-icon.png', 'dist/apple-touch-icon.png');
await copyIfExists('public/site.webmanifest', 'dist/site.webmanifest');
await copyIfExists('public/sw.js', 'dist/sw.js');
await copyIfExists('public/manifest.webmanifest', 'dist/manifest.webmanifest');

const copyDirIfExists = async (from, to) => {
  try {
    await access(from);
    await cp(from, to, { recursive: true });
  } catch {
    // Ignore missing optional directories
  }
};
await copyDirIfExists('public/icons', 'dist/icons');
await copyDirIfExists('public/images', 'dist/images');
await copyDirIfExists('public/screenshots', 'dist/screenshots');
