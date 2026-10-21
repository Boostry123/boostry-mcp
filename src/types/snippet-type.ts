import z from "zod";

export const Snippet = z.object({
  category: z.string(),
  description: z.string(),
  path: z.string(),
});
export const SnippetList = z.record(z.string(), z.record(z.string(), Snippet));

export type SnippetType = z.infer<typeof Snippet>;
export type SnippetListType = z.infer<typeof SnippetList>;
