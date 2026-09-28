import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = "dist";
const files = await readdir(outputDirectory);
const htmlFiles = files.filter((file) => file.endsWith(".html"));

for (const file of htmlFiles) {
  const path = join(outputDirectory, file);
  const html = await readFile(path, "utf8");
  const patched = html.replace(
    /<script src="\/_expo\/static\/js\//g,
    '<script type="module" src="/_expo/static/js/',
  );

  if (patched !== html) {
    await writeFile(path, patched, "utf8");
  }
}
