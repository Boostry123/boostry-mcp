import "./config.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import registerAllTools from "./Tools/register-all-tools.js";

const server = new McpServer({
  name: "Boostry-MCP",
  version: "1.0.0",
  description:
    "This is boostries MCP server. The server will include resources and snippets of code to reuse",
});

//Register all available tools (Before settings the transport)
registerAllTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Boostry-MCP server started!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
