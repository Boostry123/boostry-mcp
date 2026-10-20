import z from "zod";

export const Snippet = z.object({
  category: z.string(),
  description: z.string(),
  path: z.string(),
});

export type SnippetType = z.infer<typeof Snippet>;
