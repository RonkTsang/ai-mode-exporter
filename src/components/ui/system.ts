import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const host = ':host'

const config = defineConfig({
  cssVarsRoot: host,
  conditions: {
    light: `${host}(.light) &, .light &`,
    dark: `${host}(.dark) &, .dark &`,
  },
  preflight: { scope: host },
  globalCss: {
    [host]: defaultConfig.globalCss?.html ?? {},
  },
})

export const system = createSystem(defaultConfig, config)
