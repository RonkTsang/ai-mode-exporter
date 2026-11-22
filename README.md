# <img src="public/icon/128.png" width="32" height="32" align="absmiddle" alt=""> AI Mode Exporter

AI Mode Exporter is an independent Chrome extension that lets you start a
Google Search AI Mode conversation from the toolbar and continue it in Gemini
or ChatGPT.

## What you can do

- **Ask AI Mode from the toolbar.** Click the extension icon, type a question,
  and open the results in a new Google AI Mode tab.
- **Choose what to bring along.** In AI Mode, wait for the answer to finish,
  then click **Continue in…** and select the question-and-answer pairs you want.
- **Continue in Gemini or ChatGPT.** Your selection opens in a new draft. Gemini
  receives it as a Markdown attachment, and ChatGPT receives it in the composer.
  Review the draft, add your follow-up, and send it when you're ready.


## Install from source

Use Node.js 22.23.4 or newer and pnpm 10.13.1. From the repository root, run

```sh
pnpm install
pnpm build
```

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select `.output/chrome-mv3`.
3. Open the extension from the Chrome toolbar to ask your first question.

## Development

Run `pnpm dev` for watch mode and load `.output/chrome-mv3-dev` in Chrome.
Use `pnpm compile` to type-check, `pnpm test:run` to run tests, and
`pnpm dev:website` to preview the documentation site.

See [AGENTS.md](AGENTS.md) for more commands and repository conventions.

## License

[MIT](LICENSE)
