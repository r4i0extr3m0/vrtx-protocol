import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = "dist";
const files = await readdir(outputDirectory);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const publicEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.startsWith("EXPO_PUBLIC_")),
);
const processShim = `<script>globalThis.process=globalThis.process||{env:${JSON.stringify(publicEnv)}};</script>`;

for (const file of htmlFiles) {
  const path = join(outputDirectory, file);
  const html = await readFile(path, "utf8");
  const patched = html
    .replace(
      /<script src="\/_expo\/static\/js\//g,
      '<script type="module" src="/_expo/static/js/',
    )
    .replace("</body>", `${processShim}</body>`);

  if (patched !== html) {
    await writeFile(path, patched, "utf8");
  }
}
