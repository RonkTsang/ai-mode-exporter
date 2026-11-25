---
title: 安裝與疑難排解
description: 從原始碼安裝 AI Mode Exporter，並排解繼續按鈕未顯示或 Gemini、ChatGPT 草稿空白的問題。
---

## 從原始碼安裝

請使用桌面版 Chrome、Node.js 22.23.4 或更新版本，以及 pnpm 10.13.1。複製 [AI Mode Exporter 儲存庫](https://github.com/RonkTsang/ai-mode-exporter)，並在儲存庫根目錄執行：

```sh
pnpm install
pnpm build
```

開啟 `chrome://extensions`，啟用**開發人員模式**，再點選**載入未封裝項目**。選取產生的 `.output/chrome-mv3` 資料夾。重新載入已開啟的 Google AI 模式分頁。

## 看不到「繼續對話…」按鈕

- 請在桌面版 Chrome 開啟 [Google AI 模式](https://www.google.com/search?udm=50)。此按鈕會出現在 `www.google.com` 的 AI 模式中。一般搜尋結果中的 AI 摘要是不同的頁面。
- 提出問題並等待回答完成，再到輸入框上方尋找**繼續對話…**。
- 確認 AI Mode Exporter 已在 `chrome://extensions` 啟用。安裝、更新或重新載入擴充功能後，請重新載入 AI 模式分頁再試一次。

## 開啟目標平台後，草稿是空的

開啟 [Gemini](https://gemini.google.com/) 或 [ChatGPT](https://chatgpt.com/)，並在需要時登入，確認可以建立新對話。回到原本的 AI 模式分頁，再次開始傳送。請等待草稿載入後再輸入文字。Gemini 會顯示 Markdown 附件。ChatGPT 通常會在輸入框顯示文字，較長的內容也可能轉成附件。


如果問題仍未解決，請前往[聯絡支援](/zh-tw/support/)。
