---
title: Installation and troubleshooting
description: Install AI Mode Exporter from source and troubleshoot a missing Continue button or an empty Gemini or ChatGPT draft.
---

## Install from source

Use desktop Chrome, Node.js 22.23.4 or newer, and pnpm 10.13.1. Clone the [AI Mode Exporter repository](https://github.com/RonkTsang/ai-mode-exporter). Run the following commands from the repository root.

```sh
pnpm install
pnpm build
```

Open `chrome://extensions`, turn on **Developer mode**, and click **Load unpacked**. Choose the generated `.output/chrome-mv3` folder. Reload any Google AI Mode tab you already have open.

## The Continue button is missing

- Open [Google AI Mode](https://www.google.com/search?udm=50) in desktop Chrome. The button is available in AI Mode on `www.google.com`. A regular search results page with an AI Overview is a different view.
- Ask a question and wait for the answer to finish. Then look for **Continue in…** above the input.
- Make sure AI Mode Exporter is enabled at `chrome://extensions`. Reload the AI Mode tab after installing, updating, or reloading the extension, then try again.

## The destination opens with an empty draft

Open [Gemini](https://gemini.google.com/) or [ChatGPT](https://chatgpt.com/), sign in if prompted, and make sure you can open a new chat. Return to the original AI Mode tab and start a fresh transfer. Wait for the draft to load before typing. Gemini shows a Markdown attachment. ChatGPT ordinarily shows the text in the composer and may turn longer text into an attachment.

If the issue persists, [contact the developer](/support/).
