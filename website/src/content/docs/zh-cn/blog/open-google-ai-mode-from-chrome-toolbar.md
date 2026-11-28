---
title: 如何从 Chrome 工具栏打开 Google AI 模式
description: 在桌面版 Chrome 中固定 AI Mode Exporter，即可在任意网页向 Google AI 模式提问、输入多行提示词，或在工具栏弹窗中继续当前 AI 模式对话。
---

AI Mode Exporter 会在 Chrome 工具栏中添加一个快捷搜索框，让你在任意网页都能随时开启 Google 搜索 AI 模式对话，同时不打断当前浏览。提问会在新的 AI 模式标签页中打开，当前标签页保持不变。

## 将扩展程序固定到 Chrome 工具栏

Chrome 默认会将新安装的扩展程序收进**扩展程序**菜单中。将 AI Mode Exporter 固定到工具栏后，只需一次点击即可打开：

1. 如果尚未安装，请先[在桌面版 Chrome 中安装 AI Mode Exporter](/zh-cn/guide/install-and-troubleshoot/#从源代码安装)。
2. 点击工具栏右上角的 Chrome **扩展程序**图标（拼图形状）。
3. 点击 **AI Mode Exporter** 旁的图钉图标，让它的图标常驻显示在工具栏上。

## 在任意页面向 Google AI 模式提问

1. 点击工具栏中已固定的 **AI Mode Exporter** 图标。**询问 AI 模式**输入框会自动聚焦，你可以直接开始输入。
2. 输入你的问题——例如：*“台北下雨天有哪些不需要开车的周末活动？”*
3. 按 **Enter** 键或点击搜索图标，即可在新的 Google AI 模式标签页中打开你的提问。

![点击固定后的 AI Mode Exporter 图标，会打开包含「询问 AI 模式」搜索框的弹窗](/images/toolbar-popup.webp)

:::tip[输入多行问题]
在 macOS 上按 **Cmd + Enter**，或在 Windows 和 Linux 上按 **Ctrl + Enter**，即可换行而不提交。输入框会随你的输入自动扩展高度。
:::

## 从弹窗继续或保存当前 AI 模式对话

当你已经位于 Google AI 模式标签页时，打开工具栏弹窗，搜索框下方还会显示**继续此对话…**按钮。

![在 AI 模式标签页中，扩展弹窗会显示「继续此对话…」选项](/images/toolbar-popup-continue.webp)

等待回答生成完成后，点击**继续此对话…**，即可打开问答选择对话框，你可以：

- [将选中的问答转到 Gemini](/zh-cn/blog/continue-google-ai-mode-in-gemini/) 或 [ChatGPT](/zh-cn/blog/continue-google-ai-mode-in-chatgpt/) 中继续对话。
- [将对话保存为 Markdown 或 PDF](/zh-cn/blog/save-google-ai-mode-conversation/)，或将其复制到剪贴板。

:::note[页面内按钮消失时的内置备用方案]
Google 偶尔会调整 AI 模式页面布局，这可能会导致页面内的**继续对话…**按钮暂时无法显示。遇到这种情况时，你随时可以点击工具栏弹窗中的**继续此对话…**，打开完全相同的对话框。
:::

## 故障排查

- **无法从工具栏加载 AI 模式：** 请尝试在同一个 Chrome 个人资料中[直接打开 Google AI 模式](https://www.google.com/search?udm=50)，并按提示完成 Google 登录或验证。
- **没有显示「继续此对话…」：** 请确认当前处于有效的 Google AI 模式标签页（`www.google.com`），并在安装、更新或重新启用扩展程序后刷新该标签页。

如果直接打开 AI 模式正常，但工具栏弹窗仍然无法使用，请查看[安装与故障排查指南](/zh-cn/guide/install-and-troubleshoot/)或[联系开发者](/zh-cn/support/)。
