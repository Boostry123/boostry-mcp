import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
//types
import { z } from "zod";
//snippets
import { FetchSnippetsList } from "../helpers/fileFetch.js";

const snippets = await FetchSnippetsList("snippets.json");
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
