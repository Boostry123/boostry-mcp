import { config } from "../config.js";
import { readFile } from "fs/promises";
import { SnippetList, SnippetListType } from "../types/snippet-type.js";

/*
Helper function to fetch a file as raw text from local folder within the server (Unused but stays just incase)
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
Helper function that will use the base url from the .env and add the path provided to fetch the snippets list as raw json file

*/
export async function FetchSnippetsList(
  path: string,
): Promise<SnippetListType> {
  const url = new URL(path, config.SNIPPETS_BASE_URL).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch file from ${url} (status: ${response.status})`,
    );
  }
  const snippetsList = await response.json();
  return SnippetList.parse(snippetsList);
}

/*
Helper function that will use the base url from the .env and add the path provided to fetch the snippet as a raw text file

*/
export async function FetchSnippet(path: string): Promise<string> {
  const url = new URL(path, config.SNIPPETS_BASE_URL).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch file from ${url} (status: ${response.status})`,
    );
  }
  const snippet = await response.text();
  return snippet;
}
