# AGENTS.md

AI Mode Exporter is an independent browser extension for Google Search AI Mode.
The extension uses WXT, React, TypeScript, and Chakra UI v3. The
`website/` workspace package uses Astro and Starlight.

## Commands

- Install both workspace packages with `pnpm install`. The postinstall runs
  `wxt prepare` to generate types under `.wxt/`.
- Start extension watch mode with `pnpm dev` or `pnpm dev:firefox`.
- Type-check with `pnpm compile` and run Vitest with `pnpm test:run`.
- Build with `pnpm build` or `pnpm build:firefox`. Package with `pnpm zip`
  or `pnpm zip:firefox`.
- Verify locale keys with `pnpm check:i18n`.
- Run the site with `pnpm dev:website` and build it with `pnpm build:website`.

## Extension architecture

- Keep WXT entrypoints under `src/entrypoints/`. WXT generates the manifest
  from `wxt.config.ts` and the entrypoints.
- Prefer `browser` from `wxt/browser`. Keep browser-specific behavior
  isolated behind entrypoint filters or `import.meta.env.FIREFOX`.
- Register extension-wide listeners in `src/entrypoints/background.ts`.
  Give any background cache, queue, or timer a size limit, expiration, or
  cleanup path.
- `shadow-preview.content.tsx` exercises the page mounting lifecycle during
  watch mode. Add product content scripts as separate entrypoints.
- Scope website permissions and content-script matches to the behavior that
  needs them. Follow the [host DOM guide](docs/agent_guides/host-dom.md)
  when interacting with the search page, and register long-lived site features
  as `ContentService`s under their site host per the
  [content services guide](docs/agent_guides/content-services.md).

## Shadow DOM and Chakra UI

- Mount React UI through `Provider` in
  `src/components/ui/provider-shadow-dom.tsx`. Emotion styles and Chakra
  overlay portals stay inside the same Shadow DOM root.
- Use the Chakra system from `src/components/ui/system.ts`. Keep CSS
  variables and preflight scoped to `:host`.
- Give Chakra `asChild` triggers a DOM child or a component that forwards
  refs and trigger props to the underlying DOM element.
- Define animations with `keyframes` from `@emotion/react` and respect
  `prefers-reduced-motion` when adding motion.

## Code and localization

- Use descriptive names, English comments for non-obvious behavior, and
  explicit types on exported APIs. Prefer narrow changes and guard clauses.
- Use the WXT `#i18n` alias. Treat `src/locales/en.json` as the base and keep
  keys and placeholders aligned across locales. Delegate locale writing and
  review to the project `i18n-writer` agent.
- Tests use Vitest with happy-dom. Colocate tests with the code they cover.
- Follow Conventional Commits. Use branches named `<type>/<description>`.

For website work, follow [website/AGENTS.md](website/AGENTS.md).
