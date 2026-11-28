import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const docs = await getCollection('docs', ({ data }) => !data.draft);
  const docsById = new Map(docs.map((doc) => [doc.id, doc]));
  const home = docsById.get('index')!;
  const tutorials = docs
    .filter(({ id }) => id.startsWith('blog/'))
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const translatedHubs = docs
    .filter(({ id }) => /^[^/]+\/(guide\/quick-start|blog|support)$/.test(id))
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));

  const link = ({ id, data }: CollectionEntry<'docs'>) => {
    const url = new URL(id === 'index' ? '/' : `/${id}/`, site);
    return `- [${data.title}](${url}): ${data.description}`;
  };

  const lines = [
    `# ${home.data.title}`,
    '',
    `> ${home.data.description}`,
    '',
    'AI Mode Exporter is an independent Chrome extension for Google Search AI Mode.',
    '',
    '## Key capabilities',
    '',
    '- Continue selected Google AI Mode questions and answers in a new Gemini or ChatGPT draft (never auto-sent).',
    '- Save selected turns as Markdown (.md) or printable PDF, or copy them as Markdown to the clipboard.',
    '- Start a Google AI Mode search from any webpage using the Chrome toolbar popup, with multi-line prompt support.',
    '- Use the toolbar popup ("Continue this chat…") as a built-in backup if a Google page update hides the in-page button.',
    '',
    '## Getting started',
    '',
    link(home),
    link(docsById.get('guide/quick-start')!),
    link(docsById.get('guide/install-and-troubleshoot')!),
    '',
    '## Tutorials',
    '',
    link(docsById.get('blog')!),
    ...tutorials.map(link),
    '',
    '## Support',
    '',
    link(docsById.get('support')!),
    '- [Source code and issues](https://github.com/RonkTsang/ai-mode-exporter): Extension source and public feedback.',
    '',
    '## Optional',
    '',
    ...translatedHubs.map(link),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
