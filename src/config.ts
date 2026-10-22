import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

export const EnvSchema = z.object({
  SNIPPETS_BASE_URL: z
    .url()
    .transform((url) => (url.endsWith("/") ? url : `${url}/`)),
  SNIPPETS_LIST_PATH: z.string().trim().min(1).default("snippets.json"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid .env configuration (see env.example): ${z.prettifyError(parsed.error)}`,
  );
}

export const config: EnvType = parsed.data;

export type EnvType = z.infer<typeof EnvSchema>;
