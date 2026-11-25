---
title: 安装与故障排查
description: 从源代码安装 AI Mode Exporter，并排查继续按钮不显示或 Gemini、ChatGPT 草稿为空的问题。
---

## 从源代码安装

请使用桌面版 Chrome、Node.js 22.23.4 或更高版本，以及 pnpm 10.13.1。克隆 [AI Mode Exporter 仓库](https://github.com/RonkTsang/ai-mode-exporter)，并在仓库根目录运行：

```sh
pnpm install
pnpm build
```

打开 `chrome://extensions`，启用**开发者模式**，然后点击**加载已解压的扩展程序**。选择生成的 `.output/chrome-mv3` 文件夹。重新加载已打开的 Google AI 模式标签页。

## 看不到“继续对话”按钮

- 请在桌面版 Chrome 中打开 [Google AI 模式](https://www.google.com/search?udm=50)。此按钮仅在 `www.google.com` 上的 AI 模式中显示，普通搜索结果中的 AI 概览属于另一种页面。
- 提问并等待回答完成，然后在输入框上方查找**继续对话…**。
- 请确认 AI Mode Exporter 已在 `chrome://extensions` 中启用。安装、更新或重新加载扩展后，重新加载 AI 模式标签页再试一次。

## 目标平台打开后草稿为空

打开 [Gemini](https://gemini.google.com/) 或 [ChatGPT](https://chatgpt.com/)，并在需要时登录，确认可以新建对话。回到原来的 AI 模式标签页，再次开始传输。输入文字前请等待草稿载入。Gemini 会显示 Markdown 附件，ChatGPT 通常会在输入框中显示文字，较长内容也可能变成附件。


如果问题仍未解决，请前往[联系支持](/zh-cn/support/)。
