import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

//types
import { z } from "zod";
//helpers
import { FileFetchRawText } from "../helpers/fileFetch.js";

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
      const path = params.path;
      if (!params.path)
        return {
          isError: true,
          content: [{ type: "text", text: "Path was not provided." }],
        };
      const snippet = await handleFileFetch(path);
      return { content: [{ type: "text", text: snippet }] };
    },
  );
}
const handleFileFetch = (path: string) => {
  return FileFetchRawText(path);
};
