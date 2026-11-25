import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				home: z.object({
					preview: z.object({
						sourceLabel: z.string(),
						continueLabel: z.string(),
					}),
					destinationsHeading: z.string(),
					destinationsIntro: z.string(),
					geminiDescription: z.string(),
					geminiLink: z.string(),
					chatgptDescription: z.string(),
					chatgptLink: z.string(),
				}).optional(),
			}),
		}),
	}),
};
