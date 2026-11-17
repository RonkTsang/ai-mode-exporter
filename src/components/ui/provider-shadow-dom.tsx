import { ChakraProvider, EnvironmentProvider } from '@chakra-ui/react'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { useMemo, useState, useSyncExternalStore, type ComponentProps } from 'react'
import root from 'react-shadow'
import { system } from './system'

// react-shadow creates a shadow host for any tag accessed through its proxy.
const ShadowHost = root.div!
// Keep react-shadow's attachment effect stable across provider renders.
const shadowStyleSheets: CSSStyleSheet[] = []
const darkColorScheme = '(prefers-color-scheme: dark)'

function subscribeToColorScheme(onChange: () => void): () => void {
  const media = window.matchMedia(darkColorScheme)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function isDarkColorScheme(): boolean {
  return window.matchMedia(darkColorScheme).matches
}

type ProviderProps = Pick<ComponentProps<'div'>, 'children' | 'style'>

export function Provider({ children, style }: ProviderProps) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const shadowRoot = host?.shadowRoot
  const cache = useMemo(() => (
    shadowRoot ? createCache({ key: 'ame', container: shadowRoot }) : null
  ), [shadowRoot])
  const theme = useSyncExternalStore(subscribeToColorScheme, isDarkColorScheme) ? 'dark' : 'light'

  return (
    <ShadowHost ref={setHost} className={theme} data-theme={theme} style={style} styleSheets={shadowStyleSheets}>
      {cache && shadowRoot && (
        <EnvironmentProvider value={shadowRoot}>
          <CacheProvider value={cache}>
            <ChakraProvider value={system}>{children}</ChakraProvider>
          </CacheProvider>
        </EnvironmentProvider>
      )}
    </ShadowHost>
  )
}
