import { config } from "../config.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
//types
import { z } from "zod";
//snippets
import { FetchSnippetsList } from "../helpers/fileFetch.js";
import { SnippetListType } from "../types/snippet-type.js";

async function handleSnippetsListFetch(): Promise<SnippetListType> {
  const result = await FetchSnippetsList(
    config.SNIPPETS_LIST_PATH || "snippets.json",
  );
  return result;
}
export default function listSnippets(server: McpServer) {
  server.registerTool(
    "list-snippets",
    {
      title: "List snippets",
      description:
        "Lists snippets for a given category or all if category is not given",
      inputSchema: { category: z.string().optional() },
      annotations: {
        title: "List snippets",
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async (params) => {
      const category = params.category;
      let snippets: SnippetListType = {};

      try {
        snippets = await handleSnippetsListFetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to fetch the snippets list: ${message}`,
            },
          ],
        };
      }
      if (category && !snippets[category]) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Unknown category "${category}". Valid categories: ${Object.keys(snippets).join(", ")}`,
            },
          ],
        };
      }
      const result = category ? snippets[category] : snippets;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
