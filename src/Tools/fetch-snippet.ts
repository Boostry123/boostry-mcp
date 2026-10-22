import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

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
      description: "Fetch a snippet of code by a given path",
      inputSchema: z.object({ path: z.string() }),
      annotations: {
        title: "List snippets",
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async (params) => {
      const path = params.path.trim();
      if (!params.path || path === "")
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Path was not provided. Reffer to the Snippets list.",
            },
          ],
        };
      const snippet = await handleFileFetch(path);
      return {
        content: [{ type: "text", text: JSON.stringify(snippet, null, 2) }],
      };
    },
  );
}
