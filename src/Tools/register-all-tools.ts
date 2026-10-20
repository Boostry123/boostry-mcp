import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import listSnippets from "./list-snippets.js";
import fetchSnippet from "./fetch-snippet.js";

/*
Function will register all available tools in the Tools folder
@param : server, type : McpServer
*/
export default function registerAllTools(server: McpServer) {
  listSnippets(server);
  fetchSnippet(server);
}
