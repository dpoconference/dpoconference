import { createWriteStream } from "node:fs";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const outDir = join(root, "cpanel-upload");
const zipPath = join(root, "ndpo-cpanel-upload.zip");

if (!existsSync(dist)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(dist, outDir, { recursive: true });

rmSync(zipPath, { force: true });

async function zipWithArchiver() {
  try {
    const archiver = require("archiver");
    await new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);
      archive.directory(outDir, false);
      archive.finalize();
    });
    return true;
  } catch {
    return false;
  }
}

async function zipWithPowerShell() {
  const { execFileSync } = await import("node:child_process");
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${outDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: "inherit" },
  );
}

const ok = await zipWithArchiver();
if (!ok) {
  await zipWithPowerShell();
}

console.log("");
console.log("cPanel upload ready:");
console.log(`  Folder: ${outDir}`);
console.log(`  Zip:    ${zipPath}`);
console.log("");
console.log("Upload contents of cpanel-upload/ (or the zip) into:");
console.log("  public_html/  (site root) on webthinkers.com");
console.log("Site URL: https://webthinkers.com/");
