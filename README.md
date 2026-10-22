# Boostry-MCP

An [MCP](https://modelcontextprotocol.io) server that gives AI agents ready-made code snippets, so they reuse vetted code instead of guessing or writing their own.

Snippets are served from a separate Git repo: [Boostry123/boostry-snippets](https://github.com/Boostry123/boostry-snippets).

## Tools

| Tool | Input | Description |
|---|---|---|
| `list-snippets` | `category?` | List all snippets, or only those in one category |
| `fetch-snippet` | `path` | Fetch a snippet's source by the `path` returned from `list-snippets` |

## Setup

```bash
npm install
cp .env.example .env
npm run server:build
```

`.env`:

```
SNIPPETS_BASE_URL="https://raw.githubusercontent.com/Boostry123/boostry-snippets/main/"
```

The trailing `/` is required.

### Using your own snippets repo

`SNIPPETS_BASE_URL` can point to any snippets repo you like (the raw-content URL of its root). The only requirement is a `snippets.json` table of contents at that root. The snippet files themselves can live at any path, as long as each one is listed in `snippets.json` (see [Adding snippets](#adding-snippets)).

## Use with an MCP client

Add to your client's MCP config (e.g. `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "boostries-mcp": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "server:start"]
    }
  }
}
```

## Scripts

| Script | Description |
|---|---|
| `npm run server:dev` | Run from source with `tsx` |
| `npm run server:build` | Compile to `dist/` |
| `npm run server:start` | Run the compiled server |
| `npm run server:inspect` | Open the MCP Inspector |

## Adding snippets

Add the file anywhere in the snippets repo and register it in the root `snippets.json`. `path` is relative to the repo root:

```json
{
  "Buttons": {
    "simple-button": {
      "category": "Buttons",
      "description": "Simple, lightweight button with onClick only",
      "path": "./components/buttons/simple-button.tsx"
    }
  }
}
```

Restart the server to pick up changes.
