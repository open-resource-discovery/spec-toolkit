import spawnAsync from "@expo/spawn-async";

export async function expectTypeScriptToCompile(...filePaths: string[]): Promise<void> {
  await spawnAsync("node", [
    "node_modules/typescript/lib/tsc.js",
    "--ignoreConfig",
    "--noEmit",
    "--skipLibCheck",
    "--target",
    "ES2022",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    ...filePaths,
  ]).catch((error) => {
    const result = error as spawnAsync.SpawnResult;
    throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n"));
  });
}
