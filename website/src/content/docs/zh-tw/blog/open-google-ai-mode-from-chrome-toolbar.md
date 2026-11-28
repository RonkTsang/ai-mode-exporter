---
title: 如何從 Chrome 工具列開啟 Google AI 模式
description: 在桌面版 Chrome 釘選 AI Mode Exporter，即可從任何網頁向 Google AI 模式提問、輸入多行提示詞，或在工具列彈出視窗中繼續目前的 AI 模式對話。
---

AI Mode Exporter 會在 Chrome 工具列中加入一個快速搜尋框，讓你從任何網頁都能隨時開啟 Google 搜尋 AI 模式對話，同時保留原本正在瀏覽的頁面。你的問題會在新的 AI 模式分頁中開啟，目前分頁不會受到影響。

## 將擴充功能釘選到 Chrome 工具列

Chrome 預設會將新安裝的擴充功能收納在**擴充功能**選單中。把 AI Mode Exporter 釘選起來後，點一下就能馬上使用：

1. 如果尚未安裝，請先[在桌面版 Chrome 安裝 AI Mode Exporter](/zh-tw/guide/install-and-troubleshoot/#從原始碼安裝)。
2. 點選工具列右上角的 Chrome **擴充功能**圖示（拼圖圖案）。
3. 點選 **AI Mode Exporter** 旁的圖釘圖示，讓它的圖示固定顯示在工具列上。

## 從任何頁面詢問 Google AI 模式

1. 點選工具列上已釘選的 **AI Mode Exporter** 圖示。**詢問 AI 模式**輸入框會自動取得焦點，你可以直接開始輸入。
2. 輸入你的問題——例如：*「台北下雨天有哪些不必開車的週末活動？」*
3. 按 **Enter** 鍵或點選搜尋圖示，即可在新的 Google AI 模式分頁開啟你的提問。

![點選已釘選的 AI Mode Exporter 圖示會開啟包含「詢問 AI 模式」搜尋欄的彈出視窗](/images/toolbar-popup.webp)

:::tip[輸入多行問題]
在 macOS 上按 **Cmd + Enter**，或在 Windows 與 Linux 上按 **Ctrl + Enter**，即可換行而不送出。輸入框會隨著輸入內容自動擴展高度。
:::

## 從彈出視窗繼續或儲存目前的 AI 模式對話

當你已經在 Google AI 模式分頁時，開啟工具列彈出視窗，搜尋框下方還會顯示**繼續這段對話…**按鈕。

![在 AI 模式分頁中，擴充功能彈出視窗會顯示「繼續這段對話…」選項](/images/toolbar-popup-continue.webp)

等候回答完成後，點選**繼續這段對話…**即可開啟選取對話方塊，接著你可以：

- [將選取的問答帶到 Gemini](/zh-tw/blog/continue-google-ai-mode-in-gemini/) 或 [ChatGPT](/zh-tw/blog/continue-google-ai-mode-in-chatgpt/) 繼續對話。
- [將對話另存為 Markdown 或 PDF](/zh-tw/blog/save-google-ai-mode-conversation/)，或複製到剪貼簿。

:::note[頁面內按鈕消失時的內建備用方案]
Google 偶爾會調整 AI 模式的頁面版面，可能會讓頁面內的**繼續對話…**按鈕暫時無法顯示。遇到這種情況時，隨時都能改用工具列彈出視窗中的**繼續這段對話…**，開啟完全相同的對話方塊。
:::

## 疑難排解

- **無法從工具列載入 AI 模式：** 請嘗試在同一個 Chrome 個人資料中[直接開啟 Google AI 模式](https://www.google.com/search?udm=50)，並完成任何 Google 登入或驗證提示。
- **沒有出現「繼續這段對話…」：** 請確認目前正停留在有效的 Google AI 模式分頁（`www.google.com`），並在安裝、更新或重新啟用擴充功能後重新整理該分頁。

如果直接開啟 AI 模式正常，但工具列彈出視窗依然無法運作，請參考[安裝與疑難排解指南](/zh-tw/guide/install-and-troubleshoot/)或[聯絡開發者](/zh-tw/support/)。
