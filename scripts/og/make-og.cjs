// Regenerates public/default-og.jpg from scripts/og/og.svg. Run: pnpm og
//
// The SVG uses the site font, Google Sans Code. Astro caches its TTF files in
// node_modules/.astro/fonts, so run `pnpm dev` or `pnpm build` once first.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const fontDir = path.join(root, "node_modules/.astro/fonts");
const input = path.join(__dirname, "og.svg");
const output = path.join(root, "public/default-og.jpg");

const hasFonts =
  fs.existsSync(fontDir) &&
  fs.readdirSync(fontDir).some(file => file.endsWith(".ttf"));
if (!hasFonts) {
  process.stderr.write(
    `No font files in ${path.relative(root, fontDir)}. Run \`pnpm build\` once, then retry.\n`
  );
  process.exit(1);
}

// sharp renders SVG text through fontconfig, which only sees system fonts.
// Add Astro's font cache on top of the system config. This has to happen
// before sharp is loaded.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "og-fonts-"));
const fontsConf = path.join(tmpDir, "fonts.conf");
fs.writeFileSync(
  fontsConf,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>${fontDir}</dir>
  <cachedir>${path.join(tmpDir, "cache")}</cachedir>
</fontconfig>
`
);
process.env.FONTCONFIG_FILE = fontsConf;

const sharp = require("sharp");

sharp(input)
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(output)
  .then(info => {
    process.stdout.write(
      `Wrote ${path.relative(root, output)} (${info.width}x${info.height}, ${info.size} bytes)\n`
    );
  })
  .finally(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
