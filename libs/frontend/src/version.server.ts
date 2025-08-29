import { readFile } from "fs/promises";

export async function getVersion() {
  const packageJson = JSON.parse(await readFile("./package.json", "utf-8"));
  return packageJson.version;
}
