import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

//types
import { z } from "zod";
//helpers
import { FetchSnippet } from "../helpers/fileFetch.js";

async function handleFileFetch(path: string): Promise<string> {
  return await FetchSnippet(path);
}

export default function fetchSnippet(server: McpServer) {
  server.registerTool(
    "fetch-snippet",
    {
      title: "Fetch Snippet",
      description:
        "Fetch a snippet of code by a given path, use the list-snippets for full content table with paths",
      inputSchema: { path: z.string().trim().min(1) },
      annotations: {
        title: "Fetch Snippet",
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async (params) => {
      const path = params.path;
      let snippet = "";
      try {
        snippet = await handleFileFetch(path);
        return { content: [{ type: "text", text: snippet }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Couldn't fetch a snippet from "${path}": ${message}. Use a path from list-snippets.`,
            },
          ],
        };
      }
    },
  );
}
