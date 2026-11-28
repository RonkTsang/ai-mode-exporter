---
title: 隐私政策
description: 了解 AI Mode Exporter 如何处理 Google AI 模式搜索、对话导出以及向 Gemini 或 ChatGPT 的内容迁移。
prev: false
next: false
---

最后更新于 2026 年 11 月 28 日。

AI Mode Exporter 是由 RonkTsang 开发的浏览器扩展。它会使用 Google 搜索 AI 模式对话内容，让您预览、导出或继续对话。扩展没有开发者运营的后端，不使用分析、广告或浏览记录追踪，也不会出售用户数据。

## 搜索、预览与导出

- **工具栏搜索。** 当您从工具栏提交问题时，扩展会打开一个包含该问题的 Google 搜索 AI 模式标签页。Google 会收到此问题，该网址也可能出现在浏览器历史记录中。
- **对话预览。** 扩展会读取 AI 模式页面中的问题和回答，包括可用的链接和图片，以便您选择要保留的轮次。这些内容在您的浏览器中处理。预览显示远程图片时，浏览器可能会向 Google 或图片所在的主机请求图片。
- **复制或保存。** 选择复制或保存内容时，扩展会将其写入剪贴板或创建 Markdown 文件。使用 PDF 导出时，扩展会打开本地打印预览，由浏览器处理打印或保存文件。

## 在 Gemini 或 ChatGPT 中继续

选择“继续对话”后，扩展会将您选中的轮次填入您选择服务的新草稿中。Gemini 会收到 Markdown 附件，ChatGPT 会收到草稿文字，较长的内容可能会作为文本附件插入。内容插入后，目标服务可能立即接收并处理草稿或附件。是否发送消息由您决定。Google 和 OpenAI 按照各自的隐私政策处理其服务上的数据。[Google 隐私政策](https://policies.google.com/privacy) · [OpenAI 隐私政策](https://openai.com/policies/privacy-policy/)

## 临时存储与删除

迁移内容时，扩展会在本地扩展存储中暂时保存您选择的内容。成功导入后，记录会被删除。未使用的记录会在 10 分钟后过期，并在下次启动浏览器、开始另一项迁移或访问过期记录时清理。PDF 预览数据保存在浏览器会话存储中，读取预览后即会清除；如未使用，则会在 5 分钟后过期。下一次 PDF 导出时或浏览器会话结束时会清理过期的 PDF 记录。

移除扩展会清除其本地存储。您可以删除保存的文件、清空剪贴板或浏览器历史记录，并在目标服务上管理已导入的草稿或对话。

卸载扩展时，浏览器可能会打开一份由 Google 表单托管的自愿问卷。只有在您提交后，我们才会收到答复。

## Chrome 应用商店有限使用政策

AI Mode Exporter 按照 Chrome 应用商店用户数据政策处理用户数据，包括其中的有限使用要求。[Chrome 应用商店有限使用政策](https://developer.chrome.com/docs/webstore/program-policies/limited-use)

## 联系方式

如有隐私相关问题，请发送电子邮件至 [ronktsang@gmail.com](mailto:ronktsang@gmail.com)。政策如有变更，将在此页面更新日期并公布。
