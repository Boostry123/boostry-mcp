# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this project is

**Boostry-MCP** is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets agents fetch **ready-made, vetted code snippets** instead of guessing or writing their own from scratch. An agent first lists the available snippets (optionally by category), then fetches the source of the one it needs and reuses it.

The snippets themselves do **not** live in this repo. They live in a separate Git repository and are fetched over HTTP at runtime:

- Snippets repo: `https://github.com/Boostry123/boostry-snippets`
- Base URL (raw content): `https://raw.githubusercontent.com/Boostry123/boostry-snippets/main/`
- Index file: `snippets.json` at the root of that repo
- Currently the only snippet is `components/buttons/simple-button.tsx` (category `Buttons`, key `simple-button`)

## Tech stack

- Node.js, ESM (`"type": "module"`), TypeScript (strict, `module`/`moduleResolution: NodeNext`)
- `@modelcontextprotocol/sdk` — `McpServer` + `StdioServerTransport` (stdio transport)
- `zod` — input schemas and validation of the remote snippets index
- `dotenv` — loads `SNIPPETS_BASE_URL` from `.env`
- `tsx` for dev, `tsc` for build, `@modelcontextprotocol/inspector` for manual testing

## Layout

```
src/
  server.ts                  # Creates McpServer, registers tools, connects stdio transport
  Tools/
    register-all-tools.ts    # Calls every tool's register function — add new tools here
    list-snippets.ts         # Tool: list-snippets
    fetch-snippet.ts         # Tool: fetch-snippet
  helpers/
    fileFetch.ts             # HTTP fetch helpers built on SNIPPETS_BASE_URL
  types/
    snippet-type.ts          # zod schemas + inferred types for the snippets index
dist/                        # tsc output (gitignored); what .mcp.json actually runs
.mcp.json                    # Registers the server as "boostries-mcp" (runs `npm run server:start`)
.env / .env.example          # SNIPPETS_BASE_URL
```

## MCP tools

| Tool | Input | Behavior |
|---|---|---|
| `list-snippets` | `category?: string` | Returns the whole index, or just one category. Unknown category → `isError` with the list of valid categories. |
| `fetch-snippet` | `path: string` | Resolves `path` against `SNIPPETS_BASE_URL` and returns the raw file text. Use the `path` value from `list-snippets`. |

Intended agent flow: `list-snippets` → pick an entry → `fetch-snippet` with its `path`.

## Snippets index format (`snippets.json` in the snippets repo)

Validated by `SnippetList` in `src/types/snippet-type.ts`: a record of category → record of snippet key → snippet.

```json
{
  "Buttons": {
    "simple-button": {
      "category": "Buttons",
      "description": "This is a simple and light weight button with only onClick functionality",
      "path": "./components/buttons/simple-button.tsx"
    }
  }
}
```

`path` is relative to the snippets repo root and is resolved with `new URL(path, SNIPPETS_BASE_URL)` — so `SNIPPETS_BASE_URL` **must end with a trailing slash**, otherwise the last path segment (`main`) gets dropped.

**Adding a snippet** is done in the snippets repo, not here: commit the file and add an entry to `snippets.json`. No change to this server is needed.

## Commands

```bash
npm install
npm run server:dev       # run from source with tsx
npm run server:build     # tsc → dist/
npm run server:start     # node dist/server.js (what .mcp.json uses)
npm run server:inspect   # MCP Inspector against server:dev
```

- `.mcp.json` runs the **built** output, so run `npm run server:build` after changing `src/` before the change is visible to MCP clients (Claude Code etc.).
- `server:inspect` uses `set VAR=...`, which is Windows `cmd` syntax; it won't set the variable on POSIX shells.
- There are no tests or linter configured; `npm run server:build` (strict tsc) is the correctness check.

## Configuration

Copy `.env.example` to `.env`:

```
SNIPPETS_BASE_URL="https://raw.githubusercontent.com/Boostry123/boostry-snippets/main/"
```

Never commit `.env`.

## Conventions

- **Adding a tool:** create `src/Tools/<tool-name>.ts` exporting a default `function (server: McpServer)` that calls `server.registerTool(...)`, then call it from `register-all-tools.ts`. Tool names are kebab-case; set `annotations` (`readOnlyHint`, `destructiveHint`).
- Return errors to the agent as `{ isError: true, content: [{ type: "text", text }] }` rather than throwing, when the agent can act on the message.
- Relative imports must use the `.js` extension (NodeNext ESM), e.g. `import x from "./foo.js"`.
- Validate remote data with zod schemas in `src/types/` and export the inferred types alongside them.
- tsconfig is strict, including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`/`noUnusedParameters` — code must compile cleanly under these.

## Gotchas / known issues

- **stdout is the protocol channel.** With the stdio transport, anything written to stdout corrupts MCP messages. Log with `console.error`, never `console.log`. (`server.ts` currently has a `console.log("Boostry-MCP server started!")` that should become `console.error`.)
- `list-snippets.ts` fetches `snippets.json` with a **top-level await at module load**. The index is cached for the lifetime of the process — changes in the snippets repo need a server restart — and if the fetch fails the server fails to start.
- `FetchSnippetsList` calls `response.json()` before checking `response.ok`, so a 404 surfaces as a JSON parse error instead of the intended message.
- `fetch-snippet` returns `JSON.stringify(snippet)`, so the source arrives as an escaped JSON string (`\n`, `\"`) rather than plain text.
- `fetch-snippet` doesn't catch fetch errors; a bad `path` throws instead of returning `isError`.
- `fetch-snippet.ts` passes `z.object(...)` as `inputSchema` while `list-snippets.ts` passes a raw shape; its `annotations.title` is a copy-paste leftover ("List snippets"); and it imports `@modelcontextprotocol/sdk/server/mcp` without `.js`.
- `FileFetchRawText` in `helpers/fileFetch.ts` reads local files and is currently unused (left over from before snippets moved to Git).

## Roadmap (from commit history)

1. ~~Local snippets + list/fetch tools~~
2. ~~Snippets index served from the Git repo~~
3. ~~Fetch snippet content from the Git repo by path~~
4. Move all remaining snippets into the snippets repo and grow the catalog.
