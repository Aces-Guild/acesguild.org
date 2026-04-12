import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(['planned', 'in-progress', 'completed', 'on-hold']),
    phase: z.string(),
    startDate: z.coerce.date(),
    tags: z.array(z.string()),
    members: z.array(z.string()),
    heroImage: z.string(),
    gallery: z.array(z.string()),
    repo: z.string().url().optional(),
    externalLinks: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .default([]),
    featured: z.boolean(),
    draft: z.boolean(),
  }),
});

export const collections = { projects };
