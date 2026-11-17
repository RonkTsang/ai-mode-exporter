# AI Mode Enchance

An independent browser extension project for Google Search AI Mode, with a WXT
and React extension and an Astro Starlight documentation site.

## Develop locally

Use Node.js 22.23.4 or newer and the version of pnpm pinned in `package.json`.

```sh
pnpm install
pnpm dev
```

In Chrome, open `chrome://extensions`, enable Developer mode, and load
`.output/chrome-mv3-dev` as an unpacked extension. Open its toolbar popup to
check the Chakra UI mount.

In a second terminal, run `pnpm dev:website` and open
[localhost:4321](http://localhost:4321/). The development extension mounts a
small preview on the page so you can inspect the Shadow DOM, theme, and styles.
WXT serves the extension in watch mode. The browser is launched separately,
as configured by `web-ext.config.ts`.

| Command | Purpose |
| --- | --- |
| `pnpm dev:firefox` | Watch the Firefox extension build for loading via `about:debugging` |
| `pnpm compile` | Type-check the extension |
| `pnpm test:run` | Run the Vitest suite |
| `pnpm check:i18n` | Check locale keys against English |
| `pnpm build` / `pnpm build:firefox` | Build the extension into `.output/` |
| `pnpm zip` / `pnpm zip:firefox` | Package the extension |
| `pnpm dev:website` | Start the bilingual documentation site |
| `pnpm build:website` | Build the site into `website/dist/` |

## Structure

- `src/entrypoints/` contains WXT entrypoints for the extension.
- `src/components/ui/` contains the Shadow DOM provider, Chakra theme system,
  and reusable UI components.
- `src/locales/` supplies WXT i18n dictionaries, with English as the source.
- `website/` is the Astro Starlight workspace package. Its English and
  Simplified Chinese documentation lives under `website/src/content/docs/`.
- [AGENTS.md](AGENTS.md) and [website/AGENTS.md](website/AGENTS.md) describe
  repository conventions.
