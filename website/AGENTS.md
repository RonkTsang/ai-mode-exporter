# AGENTS.md (website)

The `website/` workspace package contains the AI Mode Power Kit documentation
site. It uses Astro and Starlight.

- Install dependencies from the repository root with `pnpm install`.
- Run `pnpm dev`, `pnpm build`, or `pnpm preview` inside this directory.
- Keep Markdown and MDX under `src/content/docs/`. The English site uses the
  root routes and Simplified Chinese uses `/zh-cn/`.
- Keep translated routes aligned with their English counterparts. Preserve
  frontmatter and update the Starlight sidebar in `astro.config.mjs` when
  adding a new navigable page.
- Put imported assets under `src/assets/` and files served as-is under
  `public/`. Put site-wide CSS in `src/styles/custom.css`.
- Edit source files and allow Astro to regenerate `.astro/` and `dist/`.
