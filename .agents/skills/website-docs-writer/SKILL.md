---
name: website-docs-writer
description: >-
  Write, optimize, and localize documentation articles and tutorials for the AI Mode Exporter
  Astro/Starlight website (`website/src/content/docs/`). Use this skill whenever creating,
  rewriting, or polishing Quick Start guides, blog tutorials, or troubleshooting docs, including
  structuring content for beginners, placing screenshots, and coordinating multi-language translations.
---

# Website Docs Writer

Follow this workflow when authoring or optimizing documentation pages under `website/src/content/docs/`.

## 1. Ground the Draft in Code, Locales, and Visuals

Before writing a single paragraph:

1. **Read the real feature code** under `src/` (for example `src/entrypoints/popup/` or `src/entrypoints/ai-mode-continue/`) to capture accurate UX details—auto-focus, keyboard shortcuts (such as `Cmd + Enter` / `Ctrl + Enter` for newlines), fallback paths, and error states.
2. **Check exact UI labels** in `src/locales/en.json` (and target locale files in `src/locales/*.json`) so every bolded button, input, and menu name matches the extension UI verbatim.
3. **Visually verify screenshots** in `website/public/images/` using `read_file` before referencing them. Never trust filenames alone—confirm what annotations and UI state each image actually shows.
4. **Check site conventions** in `website/AGENTS.md` and `website/astro.config.mjs` (routes, sidebar slugs, and trailing slashes).

## 2. Writing Style (Beginner-Friendly & Smooth)

- **Orient before instructing**: Start with a 1-paragraph overview stating *what* the user will accomplish before any numbered steps. Never open directly with an untitled list.
- **One workflow per section, one action per step**: Keep setup (e.g., pinning), primary tasks, secondary features, and fallback troubleshooting in separate sections rather than cramming them into one numbered list.
- **Active, concrete, and reassuring**:
  - Use short, direct imperative sentences.
  - Include a concrete example prompt when showing how to ask a question.
  - Explicitly reassure beginners about non-obvious behavior (e.g., drafts are never sent automatically; the current tab stays open).
- **Bold exact UI elements**: Format clickable buttons, menus, and fields in bold (`**Continue in…**`, `**Ask AI Mode**`, `**Continue this chat…**`).
- **Idiomatic localization**: Write natural, native-sounding copy in every locale rather than stiff literal translations.

## 3. Article Structure Templates

### Guide / Quick Start (`.mdx`)

Use `.mdx` when Starlight components (`Steps`, `CardGrid`, `LinkCard`) improve scannability:

1. **Frontmatter**: Concise `title` and benefit-oriented `description`.
2. **Overview + Prerequisites**:
   - 1-paragraph summary of core capabilities.
   - `:::note[Before you begin]` callout with installation link and helpful prep (such as signing in to Gemini/ChatGPT).
3. **Core Workflow (`## ...`)**:
   - Use `<Steps>` with bold step titles (`1. **Action title**`), short explanation, and 1 screenshot per step.
   - Follow with a brief `:::tip[...]` explaining platform-specific expectations if helpful.
4. **Secondary Workflows (`## ...` / `### ...`)**:
   - Separate distinct capabilities (e.g., Save/Copy, Chrome toolbar popup) into their own H2/H3 headings so the Starlight Table of Contents mirrors the user journey.
   - Isolate fallback/recovery paths in a `:::tip[...]` or `:::note[...]` callout.
5. **Next Steps (`## Next steps`)**:
   - Use `<CardGrid>` with 2 `<LinkCard>` items pointing to tutorials (`/blog/`) and troubleshooting (`/guide/install-and-troubleshoot/`).

### Tutorial / Blog Post (`.md`)

Keep blog tutorials in standard `.md` using Starlight callouts (`:::tip[...]`, `:::note[...]`):

1. **Frontmatter**: Action-oriented `title` ("How to ...") and clear `description`.
2. **Opening paragraph**: State the user benefit and core behavior in 2–3 sentences.
3. **Setup (`## ...`)** *(when needed)*: Brief numbered steps (e.g., install and pin the extension).
4. **Primary Task (`## ...`)**: 3–4 clear numbered steps + screenshot + `:::tip[...]` for power-user shortcuts or nuances.
5. **Related Workflow / Built-in Backup (`## ...`)**: Explain secondary actions available in the same UI, link to sibling tutorials, and place fallback explanations in a `:::note[...]`.
6. **Troubleshooting (`## Troubleshooting`)**: Bullet list formatted as `- **Symptom:** concrete fix.`, ending with links to `/guide/install-and-troubleshoot/` and `/support/`.

## 4. Screenshot & Image Placement Logic

- **Verify visuals first**: Open every candidate image with `read_file` to ensure the image content and callout annotations match the surrounding text.
- **Follow the user journey**: Order screenshots chronologically—entry/trigger first, selection/action second, outcome/secondary view last (e.g., `toolbar-popup.webp` before `toolbar-popup-continue.webp`).
- **One visual per milestone**: Place a screenshot immediately after the step or paragraph it illustrates. Avoid stacking consecutive images without intervening text.
- **Localized, descriptive alt text**: Describe the visible UI state in the target language rather than repeating the filename.
- **Paths & format**: Store screenshots in `website/public/images/` as compressed **WebP** (`cwebp -q 85`, target < 200 KB each for fast LCP) and reference them as `/images/<filename>.webp`. Avoid committing multi-megabyte PNGs.

## 5. Technical SEO & GEO (`seo.ts` and `llms.txt.ts`)

When adding or substantially updating a guide or tutorial, also check these site-level SEO/GEO files:

- **Meta descriptions**: Keep English `description` ≤ 155 characters (CJK ≤ 80 characters) so search engines do not truncate it in SERPs.
- **Contextual internal links**: Link feature mentions (e.g., Markdown export, PDF export, Gemini, ChatGPT) directly to their dedicated localized tutorial routes rather than only linking to `/blog/`.
- **Social cards & JSON-LD (`website/src/seo.ts`)**:
  - Register a dedicated entry in `pageImages` when a page has its own hero screenshot so `og:image`, `twitter:image`, and JSON-LD `image` match the article topic.
  - Ensure `guide/*` pages emit `TechArticle` JSON-LD and `blog/*` pages emit `BlogPosting` JSON-LD with `author`, `publisher`, and `twitter:card: summary_large_image`.
- **AI Search / GEO (`website/src/pages/llms.txt.ts`)**:
  - Keep the `## Key capabilities` summary aligned with the extension's actual features whenever major capabilities change.

## 6. Multi-Language Translation Workflow

The site maintains 9 aligned locales: `en` (root), `zh-cn`, `zh-tw`, `ja`, `ko`, `de`, `es`, `fr`, `pt-br`.

1. **Draft and polish the English version first** as the single source of truth.
2. **Delegate the remaining 8 locales in parallel** using `flash` subagents (`invoke_subagent` with `Model: "flash"`), split into two batches for speed:
   - CJK batch: `zh-cn`, `zh-tw`, `ja`, `ko`
   - European batch: `de`, `es`, `fr`, `pt-br`
3. **Provide each subagent with clear constraints**:
   - Read the updated English file, each target locale's existing file (to preserve localized heading anchors such as `#从源代码安装`), and the corresponding `src/locales/<locale>.json` (for exact UI labels).
   - Preserve YAML frontmatter keys, heading hierarchy, Starlight callouts/MDX components, image paths/order, and `/<locale>/` prefixes on all internal links.

## 7. Verification Checklist

After all 9 locale files are updated:

1. **Validate structure, links, and images across all 9 locales** with a quick Node script:
   - Every `/images/...` path exists in `website/public/images/` and matches the English image count and order.
   - All `:::note` / `:::tip` directives and MDX tags (`<Steps>`, `<CardGrid>`) are balanced.
   - Every internal link in a localized file (excluding `/images/...`) starts with `/<locale>/`.
2. **Spot-read at least one translated file** (e.g., `zh-cn`) to confirm natural phrasing and accurate UI labels.
3. **Build the website** with `pnpm build:website` (requires Node.js `>=22.23.4`) when the environment supports it.
