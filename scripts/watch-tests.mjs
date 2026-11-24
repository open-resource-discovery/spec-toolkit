import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this watcher with npm run test:watch.");

let child;
let timer;
let pending = false;
let stopping = false;

function runTests() {
  if (stopping || child) return;
  pending = false;
  child = spawn(process.execPath, [npmCli, "run", "test", "--", ...process.argv.slice(2)], {
    cwd: packageRoot,
    stdio: "inherit",
  });
  child.on("error", (error) => {
    process.stderr.write(`${error.message}\n`);
  });
  child.on("close", (code, signal) => {
    child = undefined;
    if (stopping) return;
    if (pending) {
      runTests();
    } else {
      process.stdout.write(`Tests finished (${signal ?? code}); waiting for source changes.\n`);
    }
  });
}

function scheduleTests() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    pending = true;
    runTests();
  }, 200);
}

const watchers = [
  watch(join(packageRoot, "src"), { recursive: true }, (_event, filename) => {
    const relativePath = filename?.toString().replaceAll("\\", "/");
    // Test and build commands write generated output under src; avoid a rebuild loop.
    if (relativePath?.startsWith("generated/") || relativePath?.startsWith("__tests__/generated/")) return;
    scheduleTests();
  }),
  watch(packageRoot, (_event, filename) => {
    if (/^(?:package|tsconfig(?:\.[\w-]+)?|spec(?:-toolkit-config)?\.config)\.json$/.test(filename ?? "")) {
      scheduleTests();
    }
  }),
  watch(join(packageRoot, "scripts"), { recursive: true }, scheduleTests),
];

function stop(signal) {
  stopping = true;
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  child?.kill(signal);
}

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
runTests();
