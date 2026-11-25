---
title: インストールとトラブルシューティング
description: AI Mode Exporter のソースからのインストール方法と、続行ボタンが表示されない場合や Gemini、ChatGPT の下書きが空の場合の対処法を紹介します。
---

## ソースからインストールする

デスクトップ版 Chrome、Node.js 22.23.4 以降、pnpm 10.13.1 を使用します。[AI Mode Exporter のリポジトリ](https://github.com/RonkTsang/ai-mode-exporter)をクローンし、リポジトリのルートで次のコマンドを実行します。

```sh
pnpm install
pnpm build
```

`chrome://extensions` を開き、**デベロッパー モード**をオンにして、**パッケージ化されていない拡張機能を読み込む**をクリックします。生成された `.output/chrome-mv3` フォルダを選択します。開いている Google AI モードのタブを再読み込みしてください。

## 「続ける…」ボタンが見つからない

- デスクトップ版 Chrome で [Google AI モード](https://www.google.com/search?udm=50)を開きます。このボタンは `www.google.com` の AI モードに表示されます。通常の検索結果ページに表示される AI による概要とは別の画面です。
- 質問を入力し、回答が完了するまで待ちます。入力欄の上に**続ける…**が表示されます。
- `chrome://extensions` で AI Mode Exporter が有効になっていることを確認します。インストール、更新、拡張機能の再読み込み後は、AI モードのタブを再読み込みしてからもう一度お試しください。

## 転送先を開いても下書きが空

[Gemini](https://gemini.google.com/) または [ChatGPT](https://chatgpt.com/)を開き、必要に応じてログインして、新しいチャットを開けることを確認します。元の AI モードのタブに戻り、もう一度転送します。入力を始める前に下書きの読み込みを待ってください。Gemini では Markdown 添付ファイルが表示されます。ChatGPT では通常、入力欄にテキストが表示され、長いテキストは添付ファイルになる場合があります。


解決しない場合は[サポートに問い合わせる](/ja/support/)をご覧ください。
