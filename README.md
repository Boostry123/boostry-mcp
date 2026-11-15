# Boostry-MCP

An [MCP](https://modelcontextprotocol.io) server that gives AI agents ready-made code snippets, so they reuse vetted code instead of guessing or writing their own.

No snippets are bundled with the server. Both the snippets index and the snippet files are fetched at runtime from a separate Git repo, by default [Boostry123/boostry-snippets](https://github.com/Boostry123/boostry-snippets). The repo, the index location and every snippet path are configurable (see [Using your own snippets repo](#using-your-own-snippets-repo)).

## Tools

| Tool            | Input       | Description                                                          |
| --------------- | ----------- | -------------------------------------------------------------------- |
| `list-snippets` | `category?` | List all snippets, or only those in one category                     |
| `fetch-snippet` | `path`      | Fetch a snippet's source by the `path` returned from `list-snippets` |

## Setup

```bash
npm install
cp .env.example .env
npm run server:build
```

`.env`:

```
SNIPPETS_BASE_URL="https://raw.githubusercontent.com/Boostry123/boostry-snippets/main/"
SNIPPETS_LIST_PATH="snippets.json"
```

| Variable             | Required | Description                                                                        |
| -------------------- | -------- | ---------------------------------------------------------------------------------- |
| `SNIPPETS_BASE_URL`  | Yes      | Raw-content URL of the snippets repo root. A trailing `/` is added if missing.     |
| `SNIPPETS_LIST_PATH` | No       | Path of the snippets index, relative to the base URL. Defaults to `snippets.json`. |

### Using your own snippets repo

Nothing about the snippet locations is hardcoded:

- `SNIPPETS_BASE_URL` can point to any repo or branch (the raw-content URL of its root).
- `SNIPPETS_LIST_PATH` sets where the index lives in that repo (default `snippets.json` at the root).
- Snippet files can live at any path. Each one's location comes from its `path` in the index, so files can be moved or renamed as long as the index is updated.

The index is fetched on every `list-snippets` call, so changes in the snippets repo show up without restarting the server. Changes to `.env` need a restart.

## Install in your agent

The server works with any MCP client (agent). Every client starts it the same way, as a local **stdio** server:

- **command:** `node`
- **args:** the **absolute** path to `dist/server.js` in this repo

**Before you start:** do the [Setup](#setup) steps above. `dist/server.js` only exists after `npm run server:build`, and the server exits on start if `.env` is missing or invalid.

**Rules for every client:**

- Use an absolute path. A relative path only works when the agent happens to start in this repo's folder.
- On Windows, write the path with forward slashes (`F:/code/boostry-mcp/dist/server.js`) or doubled backslashes (`F:\\code\\...`) in JSON.
- Use `node` directly, not `npm run server:start`. npm prints a banner to stdout, which breaks the MCP connection.
- After you change `src/`, run `npm run server:build` again and restart the agent.

### Claude Code

Register it once for all your projects:

```bash
claude mcp add boostry-code-snippets -s user -- node <absolute-path-to-repo>/dist/server.js
```

Check it with `claude mcp list`.

### Any other agent (Claude Desktop, Cursor, VS Code, ...)

Most clients use a JSON config with an `mcpServers` object. Add this entry:

```json
{
  "mcpServers": {
    "boostry-code-snippets": {
      "command": "node",
      "args": ["<absolute-path-to-repo>/dist/server.js"]
    }
  }
}
```

Where the config lives and what the top-level key is called differ by client:

| Client         | Config                                                                         | Notes                                                      |
| -------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Claude Desktop | `claude_desktop_config.json` (Settings → Developer → Edit Config)              | Restart the app after saving.                              |
| Cursor         | `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project)        |                                                            |
| VS Code        | `.vscode/mcp.json`, or the **MCP: Add Server** command                         | Uses `"servers"` instead of `"mcpServers"`; add `"type": "stdio"`. |

For a client not listed here, look up "MCP server config" in its docs and give it the same `command` and `args`. To check it worked, ask the agent to call `list-snippets`.

## Scripts

| Script                   | Description                |
| ------------------------ | -------------------------- |
| `npm run server:dev`     | Run from source with `tsx` |
| `npm run server:build`   | Compile to `dist/`         |
| `npm run server:start`   | Run the compiled server    |
| `npm run server:inspect` | Open the MCP Inspector     |

## Adding snippets

Add the file anywhere in the snippets repo and register it in the index (`SNIPPETS_LIST_PATH`, default `snippets.json`). `path` is relative to the repo root (`SNIPPETS_BASE_URL`), not to the index file. Example entry:

```json
{
  "Buttons": {
    "simple-button": {
      "category": "Buttons",
      "description": "Simple, lightweight button with onClick only",
      "path": "snippets/react/components/buttons/simple-button.tsx"
    }
  }
}
```
