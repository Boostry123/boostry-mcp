# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this project is

**Boostry-MCP** is a [Model Context Protocol](https://modelcontextprotocol.io) server that lets agents fetch **ready-made, vetted code snippets** instead of guessing or writing their own from scratch. An agent first lists the available snippets (optionally by category), then fetches the source of the one it needs and reuses it.

No snippets live in this repo. Both the snippets index and the snippet files live in a separate Git repository and are fetched over HTTP at runtime. Every location is configurable, so **don't hardcode any of them** in code or docs:

- **Where the repo is** comes from `SNIPPETS_BASE_URL` (raw-content URL of the repo root).
- **Where the index is** comes from `SNIPPETS_LIST_PATH`, relative to the base URL.
- **Where each snippet is** comes from its `path` in the index, relative to the base URL. Snippet files can sit anywhere in the repo, and their paths can change at any time; the index is the only source of truth.

The default setup (`.env.example`) points at [`Boostry123/boostry-snippets`](https://github.com/Boostry123/boostry-snippets) with the index at `snippets.json` in the repo root. To see which snippets exist, call `list-snippets` (or read the index) instead of relying on a list written here. See the snippets repo's own `AGENTS.md` for its layout and how to add snippets.

## Tech stack

- Node.js, ESM (`"type": "module"`), TypeScript (strict, `module`/`moduleResolution: NodeNext`)
- `@modelcontextprotocol/sdk` — `McpServer` + `StdioServerTransport` (stdio transport)
- `zod` (v4) — tool input schemas, `.env` validation, and validation of the remote snippets index
- `dotenv` — loads `.env` (called once, from `src/config.ts`)
- `tsx` for dev, `tsc` for build, `@modelcontextprotocol/inspector` for manual testing

## Layout

```
src/
  server.ts                  # Imports config first, creates McpServer, registers tools, connects stdio transport
  config.ts                  # Loads .env, validates it with zod, exports the typed `config` object
  Tools/
    register-all-tools.ts    # Calls every tool's register function — add new tools here
    list-snippets.ts         # Tool: list-snippets
    fetch-snippet.ts         # Tool: fetch-snippet
  helpers/
    fileFetch.ts             # HTTP fetch helpers built on config.SNIPPETS_BASE_URL
  types/
    snippet-type.ts          # zod schemas + inferred types for the snippets index
dist/                        # tsc output (gitignored); what .mcp.json actually runs
.mcp.json                    # Registers the server as "boostries-mcp" (runs `node dist/server.js`)
.env / .env.example          # SNIPPETS_BASE_URL, SNIPPETS_LIST_PATH
```

## MCP tools

| Tool | Input | Behavior |
|---|---|---|
| `list-snippets` | `category?: string` | Fetches `snippets.json` on every call and returns the whole index, or just one category. Unknown category or failed fetch → `isError` with a message (valid categories / the underlying error). |
| `fetch-snippet` | `path: string` (trimmed, non-empty) | Resolves `path` against `SNIPPETS_BASE_URL` and returns the raw file text. Non-2xx or network failure → `isError` with the underlying error. Use the `path` value from `list-snippets`. |

Intended agent flow: `list-snippets` → pick an entry → `fetch-snippet` with its `path`.

## Snippets index format

The index is the file at `SNIPPETS_LIST_PATH` (default `snippets.json`) in the snippets repo. It's validated by `SnippetList` in `src/types/snippet-type.ts`: a record of category → record of snippet key → snippet. Example entry (the `path` is illustrative; real paths are whatever the index says):

```json
{
  "Buttons": {
    "simple-button": {
      "category": "Buttons",
      "description": "This is a simple and light weight button with only onClick functionality",
      "path": "snippets/react/components/buttons/simple-button.tsx"
    }
  }
}
```

`path` is relative to the snippets repo root and is resolved with `new URL(path, SNIPPETS_BASE_URL)`. `config.ts` appends a trailing `/` to `SNIPPETS_BASE_URL` if it's missing (without it, `main` would be dropped from the resolved URL).

**Adding, moving or renaming a snippet** is done in the snippets repo, not here: commit the file and add or update its entry in the index. No change or restart of this server is needed — the index is fetched per call. Moving the index itself, or switching to another snippets repo or branch, only needs a `.env` change and a server restart (no code change).

If an entry doesn't match the schema, `SnippetList.parse` throws a `ZodError`, which `list-snippets` returns as `isError`.

## Commands

```bash
npm install
npm run server:dev       # run from source with tsx
npm run server:build     # tsc → dist/
npm run server:start     # node dist/server.js
npm run server:inspect   # MCP Inspector against server:dev
```

- `.mcp.json` runs the **built** output, so run `npm run server:build` after changing `src/` before the change is visible to MCP clients (Claude Code etc.).
- `.mcp.json` calls `node` directly (not `npm run`) because npm prints its script banner to stdout, which corrupts the protocol stream.
- `server:inspect` uses `set VAR=...`, which is Windows `cmd` syntax; it won't set the variable on POSIX shells.
- There are no tests or linter configured; `npm run server:build` (strict tsc) is the correctness check.

## Configuration

Copy `.env.example` to `.env`:

```
SNIPPETS_BASE_URL="https://raw.githubusercontent.com/Boostry123/boostry-snippets/main/"
SNIPPETS_LIST_PATH="snippets.json"
```

| Variable | Required | Notes |
|---|---|---|
| `SNIPPETS_BASE_URL` | yes | Must be a valid URL. Trailing `/` is added if missing. No default. |
| `SNIPPETS_LIST_PATH` | no | Path of the index relative to the base URL. Defaults to `snippets.json`. |

How `src/config.ts` works:

- `.env` is resolved from `import.meta.url` (`../.env` relative to `src/` or `dist/`, i.e. the repo root), so it's found regardless of the process cwd. `quiet: true` suppresses dotenv's load message.
- `process.env` is validated with `EnvSchema.safeParse`. On failure it throws `Invalid .env configuration ...` at startup and the server exits — intentionally fail-fast.
- Read settings from the exported `config` object, **not** `process.env`. zod defaults and transforms only apply to `config`; `process.env` still holds the raw (possibly missing) values.
- `server.ts` imports `./config.js` as its first import, so `.env` is loaded before any other module runs.

Never commit `.env`.

## Conventions

- **Adding a tool:** create `src/Tools/<tool-name>.ts` exporting a default `function (server: McpServer)` that calls `server.registerTool(...)`, then call it from `register-all-tools.ts`. Tool names are kebab-case; pass `inputSchema` as a raw zod shape (`{ key: z.string() }`, not `z.object(...)`); set `annotations` (`title`, `readOnlyHint`, `destructiveHint`).
- **Errors:** wrap fetches in `try/catch` inside the tool handler and return `{ isError: true, content: [{ type: "text", text }] }` with the underlying `error.message`. `isError` goes on the **result object** — placed inside a `content` item it type-checks but the SDK strips it, so the failure looks like a success.
- Helpers in `src/helpers/` throw on failure (check `response.ok` before reading the body); tool handlers turn those throws into `isError` results.
- Tool input is validated by the SDK against `inputSchema` before the handler runs — don't re-check (e.g. re-`trim()`) inside the handler.
- Relative imports must use the `.js` extension (NodeNext ESM), e.g. `import x from "./foo.js"`.
- Validate remote data with zod schemas in `src/types/` and export the inferred types alongside them.
- tsconfig is strict, including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`/`noUnusedParameters` — code must compile cleanly under these.

## Gotchas

- **stdout is the protocol channel.** With the stdio transport, anything written to stdout corrupts MCP messages. Log with `console.error`, never `console.log`.
- **ESM import order:** all `import`s are evaluated before a module's body runs. Anything that must happen first (like loading `.env`) has to live in its own module imported first — see `config.ts`.
- `.mcp.json` uses the relative path `dist/server.js`, so the client must launch the server from the repo root (fine for a project-scoped server in Claude Code).
- `FileFetchRawText` in `helpers/fileFetch.ts` reads local files and is currently unused. It is **kept on purpose** for possible future use — don't remove it.

## Known limitations (deliberately deferred)

Error handling is intentionally basic for now; more robust handling is planned. Don't add these unless asked:

- `fetch-snippet` doesn't restrict `path` to the snippets repo — absolute URLs or `../` segments resolve elsewhere.
- Fetches have no timeout (`AbortSignal.timeout`); a hung request blocks the tool call.
- `snippets.json` is fetched on every `list-snippets` call (no caching).

## Roadmap

1. ~~Local snippets + list/fetch tools~~
2. ~~Snippets index served from the Git repo~~
3. ~~Fetch snippet content from the Git repo by path~~
4. ~~Validated config + basic exception handling in tools~~
5. ~~Move all snippets into the snippets repo~~
6. Grow the snippets catalog.
7. More robust exception handling (path restriction, timeouts, etc.).
