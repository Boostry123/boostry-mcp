import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

//types
import { z } from "zod";
import { SnippetType } from "../types/snippet-type.js";
//snippets
import snippetsJson from "../snippets-list/snippets.json" with { type: "json" };

const snippets = snippetsJson as Record<string, Record<string, SnippetType>>;

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
