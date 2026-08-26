// Expo Router's static web export names the dynamic public quiz route's
// output file literally "[slug].html" (from src/app/q/[slug].tsx). Square
// brackets in a routed filename appear to be unreliable as a Vercel rewrite
// destination (see vercel.json) even URL-encoded, so this copies it to a
// plain filename that both a rewrite and a plain HTTP request can reach
// unambiguously. Run after `expo export --platform web` (see package.json).
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const source = path.join(distDir, 'q', '[slug].html');
const destination = path.join(distDir, 'q', 'shell.html');

if (!fs.existsSync(source)) {
  console.error(`Expected export output not found: ${source}`);
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log(`Copied ${source} -> ${destination}`);
