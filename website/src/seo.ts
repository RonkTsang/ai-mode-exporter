import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';

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
  const image = new URL('/images/onboarding-selection.png', site).href;
  const imageAlt = 'AI Mode Exporter dialog for choosing questions and answers to continue in Gemini or ChatGPT';
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
      ...(slug === 'blog/continue-google-ai-mode-in-gemini' ? { image } : {}),
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
