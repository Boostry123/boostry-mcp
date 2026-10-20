import { readFile } from "fs/promises";

/*
Helper function to fetch a file as raw text
*/
export async function FileFetchRawText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return `Error: ${message}`;
  }
}
