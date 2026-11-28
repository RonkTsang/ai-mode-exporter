const siteOrigin = 'https://ai-mode-exporter.ronktsang.com'

export const featureRequestUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeDMHsb5Og3zEBS-oK-bQLgAxXciuvqeYEuw05sLHFMjFCy3w/viewform'

function getSiteLocalePath(uiLanguage: string): string {
  const locale = new Intl.Locale(uiLanguage.replaceAll('_', '-'))
  const { language } = locale
  let localePath = ''

  if (language === 'zh') {
    localePath = locale.maximize().script === 'Hant' ? '/zh-tw' : '/zh-cn'
  } else if (language === 'pt') {
    localePath = '/pt-br'
  } else if (['de', 'es', 'fr', 'ja', 'ko'].includes(language)) {
    localePath = `/${language}`
  }

  return localePath
}

export function getSupportUrl(uiLanguage: string): string {
  return `${siteOrigin}${getSiteLocalePath(uiLanguage)}/support/`
}

export function getQuickStartUrl(uiLanguage: string): string {
  return `${siteOrigin}${getSiteLocalePath(uiLanguage)}/guide/quick-start/`
}
