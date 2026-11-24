import { spawn } from "node:child_process";
import { chmod, copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const websiteDocsDirectory = "website/docs/docs";
const websiteSchemasDirectory = "website/static/spec-v1";

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

async function copyDirectoryContents(sourceDirectory, targetDirectory) {
  for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
    if (entry.isFile()) {
      await copyFile(path.join(sourceDirectory, entry.name), path.join(targetDirectory, entry.name));
    }
  }
}

const cliPath = "dist/cli.js";
if (process.platform !== "win32") {
  const cliStats = await stat(cliPath);
  await chmod(cliPath, cliStats.mode | 0o111);
}
await mkdir(websiteDocsDirectory, { recursive: true });
await mkdir(websiteSchemasDirectory, { recursive: true });

await run(process.execPath, [cliPath, "-c", "spec-toolkit-config.config.json"]);
await copyFile(
  "src/generated/spec-toolkit-config/spec-v1/docs/spec-toolkit-config.md",
  path.join(websiteDocsDirectory, "spec-toolkit-config.md"),
);
await copyDirectoryContents("src/generated/spec-toolkit-config/spec-v1/schemas", websiteSchemasDirectory);

await run(process.execPath, [cliPath, "-c", "spec.config.json"]);
await copyFile("src/generated/spec/spec-v1/docs/spec.md", path.join(websiteDocsDirectory, "spec.md"));
await copyDirectoryContents("src/generated/spec/spec-v1/schemas", websiteSchemasDirectory);
