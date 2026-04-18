import { access, cp, mkdir, rm } from 'node:fs/promises';

// Prepare a static-only dist folder for Vercel.
// Important: do not copy public/index.php or any PHP files, otherwise Vercel may
// serve them as downloads instead of loading the app.
const sourceBuildDir = 'public/build';
const targetDir = 'dist';
const targetBuildDir = 'dist/build';

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetBuildDir, { recursive: true });
await cp(sourceBuildDir, targetBuildDir, { recursive: true });

// Also place an index.html at dist root so / resolves to the app immediately.
await cp('public/build/index.html', 'dist/index.html');

const copyIfExists = async (from, to) => {
	try {
		await access(from);
		await cp(from, to);
	} catch {
		// Ignore missing optional static files.
	}
};

await copyIfExists('public/favicon.svg', 'dist/favicon.svg');
await copyIfExists('public/favicon.ico', 'dist/favicon.ico');
await copyIfExists('public/apple-touch-icon.png', 'dist/apple-touch-icon.png');
await copyIfExists('public/site.webmanifest', 'dist/site.webmanifest');
