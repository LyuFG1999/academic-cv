// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

// 3. Define your collection(s)
const blog = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/BlogPosts",
    }),
    schema: z.object({
        title: z.string(),
        language: z.enum(['zh', 'en']).default('zh'),
        date: z.string(),
        excerpt: z.string(),
        tags: z.array(z.string()).optional(),
        featuredImage: z.string().optional(),
        attachments: z.array(z.object({
            label: z.string(),
            file: z.string(),
        })).optional(),
        draft: z.boolean().optional().default(false),
    }),
});
// 4. Export a single `collections` object to register your collection(s)
export const collections = { blog };
