import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { SnippetList, SnippetListType } from "../types/snippet-type.js";

dotenv.config();
const SNIPPETS_BASE_URL = process.env.SNIPPETS_BASE_URL;
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

/*
Helper function that will use the base url from the .env and add the path provided to fetch a raw text file

*/
export async function FetchSnippetsList(
  path: string,
): Promise<SnippetListType> {
  const url = new URL(path, SNIPPETS_BASE_URL).toString();

  const response = await fetch(url);
  const snippetsList = await response.json();
  if (!response.ok) {
    throw new Error(
      `Failed to fetch file from ${url} (status: ${response.status})`,
    );
  }
  return SnippetList.parse(snippetsList);
}
