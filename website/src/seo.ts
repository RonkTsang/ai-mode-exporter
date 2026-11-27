import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';

const saveMenuImage = {
  path: '/images/save-as.webp',
  alt: 'AI Mode Exporter Save as menu with Markdown and PDF options',
};
const exportTutorialImages = new Map([
  ['blog/save-google-ai-mode-conversation', saveMenuImage],
  ['blog/save-google-ai-mode-as-markdown', saveMenuImage],
  ['blog/save-google-ai-mode-as-pdf', {
    path: '/images/export-pdf.webp',
    alt: 'Local AI Mode Exporter preview with the Print / Save as PDF button',
  }],
]);

export const onRequest = defineRouteMiddleware(({ locals, site, url }) => {
  if (!site) return;

  const route = locals.starlightRoute;
  const { entry, head, id, lang, locale, siteTitle, siteTitleHref } = route;

  if (id === '404') {
    route.head = head.filter(({ attrs }) =>
      attrs?.rel !== 'canonical' && !attrs?.hreflang && attrs?.property !== 'og:url'
    );
    route.head.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex' } });
    return;
  }

  const { title, description } = entry.data;
  const slug = locale ? id.slice(locale.length + 1) : id;
  const canonical = new URL(url.pathname, site).href;
  const exportImage = exportTutorialImages.get(slug);
  const image = new URL(exportImage?.path ?? '/images/onboarding-selection.png', site).href;
  const imageAlt = exportImage?.alt ?? 'AI Mode Exporter dialog for choosing questions and answers to continue in Gemini or ChatGPT';
  const isPost = slug.startsWith('blog/');

  const openGraphType = head.find(({ attrs }) => attrs?.property === 'og:type');
  if (openGraphType?.attrs) openGraphType.attrs.content = isPost ? 'article' : 'website';

  head.push(
    { tag: 'meta', attrs: { property: 'og:image', content: image } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: imageAlt } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
    { tag: 'meta', attrs: { name: 'twitter:image:alt', content: imageAlt } },
  );

  const website = {
    '@type': 'WebSite',
    name: siteTitle,
    url: new URL(siteTitleHref, site).href,
    inLanguage: lang,
  };

  if (slug === '') {
    const pageTitle = head.find(({ tag }) => tag === 'title');
    if (pageTitle) pageTitle.content = title;
    head.push(structuredDataTag({ ...website, description }));
  } else if (isPost) {
    head.push(structuredDataTag({
      '@type': 'BlogPosting',
      headline: title,
      description,
      url: canonical,
      inLanguage: lang,
      mainEntityOfPage: canonical,
      isPartOf: website,
      ...(exportImage || slug === 'blog/continue-google-ai-mode-in-gemini' ? { image } : {}),
    }));
  } else if (slug === 'support') {
    head.push(structuredDataTag({
      '@type': 'ContactPage',
      name: title,
      description,
      url: canonical,
      inLanguage: lang,
      isPartOf: website,
    }));
  }
});

function structuredDataTag(data: Record<string, unknown>): StarlightRouteData['head'][number] {
  return {
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    content: JSON.stringify({ '@context': 'https://schema.org', ...data }).replaceAll('<', '\\u003c'),
  };
}
