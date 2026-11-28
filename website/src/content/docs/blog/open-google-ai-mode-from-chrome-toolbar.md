---
title: How to open Google AI Mode from the Chrome toolbar
description: Pin AI Mode Exporter in Chrome to ask Google AI Mode from any tab, write multi-line prompts, or continue an open AI Mode chat.
---

AI Mode Exporter adds a quick search box to your Chrome toolbar so you can start a Google Search AI Mode conversation from any webpage without losing your place. Your question opens in a new AI Mode tab while your current tab stays untouched.

## Pin the extension to the Chrome toolbar

Chrome hides newly installed extensions in the **Extensions** menu by default. Pinning AI Mode Exporter keeps it one click away:

1. [Install AI Mode Exporter in desktop Chrome](/guide/install-and-troubleshoot/#install-from-source) if you have not already.
2. Click Chrome’s **Extensions** icon (the puzzle piece) in the top-right corner of the toolbar.
3. Click the pin icon next to **AI Mode Exporter** so its icon stays visible on your toolbar.

## Ask Google AI Mode from any page

1. Click the pinned **AI Mode Exporter** icon in the toolbar. The **Ask AI Mode** input focuses automatically so you can start typing right away.
2. Type your question—for example, *“What can I do on a rainy weekend in Taipei without a car?”*
3. Press **Enter** or click the search icon to open your question in a new Google AI Mode tab.

![The pinned AI Mode Exporter icon opens a popup with an Ask AI Mode search field](/images/toolbar-popup.webp)

:::tip[Writing multi-line questions]
Press **Cmd + Enter** on macOS or **Ctrl + Enter** on Windows and Linux to add a new line without submitting. The input expands automatically as you type.
:::

## Continue or save an open AI Mode chat from the popup

When you are already on a Google AI Mode tab, opening the toolbar popup also reveals a **Continue this chat…** button below the search box.

![On an AI Mode tab, the extension popup shows the Continue this chat option](/images/toolbar-popup-continue.webp)

Wait for the answer to finish, click **Continue this chat…**, and the selection dialog opens so you can:

- [Continue the selected turns in Gemini](/blog/continue-google-ai-mode-in-gemini/) or [ChatGPT](/blog/continue-google-ai-mode-in-chatgpt/).
- [Save the conversation as Markdown or PDF](/blog/save-google-ai-mode-conversation/), or copy it to your clipboard.

:::note[Built-in backup if the in-page button disappears]
Google occasionally updates the AI Mode page layout, which can temporarily hide the in-page **Continue in…** button. Whenever that happens, you can use **Continue this chat…** in the toolbar popup to open the exact same dialog.
:::

## Troubleshooting

- **AI Mode does not load from the toolbar:** Try opening [Google AI Mode directly](https://www.google.com/search?udm=50) in the same Chrome profile and complete any Google sign-in or verification prompts.
- **Continue this chat… does not appear:** Make sure you are on an active Google AI Mode tab (`www.google.com`) and reload the tab after installing, updating, or re-enabling the extension.

If AI Mode opens directly but the toolbar popup still does not work, check the [installation and troubleshooting guide](/guide/install-and-troubleshoot/) or [contact the developer](/support/).
