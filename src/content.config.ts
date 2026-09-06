// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

const blogLoader = glob({ pattern: '**/*.md', base: './src/content/BlogPosts' });

// Clear only the generated collection cache before reload, including an empty directory.
// Otherwise deleting the last post can leave stale articles in subsequent local builds.
// 3. Define your collection(s)
const blog = defineCollection({
    loader: { ...blogLoader, load: async context => { context.store.clear(); await blogLoader.load(context); } },
    schema: z.object({
        title: z.string(),
        language: z.enum(['zh', 'en']).default('zh'),
        date: z.preprocess(value => value instanceof Date ? value.toISOString().slice(0, 10) : value, z.string().refine(value => !Number.isNaN(Date.parse(value)), 'Invalid blog date')),
        excerpt: z.string(),
        tags: z.array(z.string()).optional(),
        featuredImage: z.string().optional(),
        files: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
        attachments: z.array(z.object({
            label: z.string(),
            file: z.string(),
        })).optional(),
        draft: z.boolean().optional().default(false),
    }),
});
// 4. Export a single `collections` object to register your collection(s)
export const collections = { blog };
