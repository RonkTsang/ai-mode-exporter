---
title: Installation und Fehlerbehebung
description: AI Mode Exporter aus dem Quellcode installieren und Probleme mit einer fehlenden Schaltfläche „Weiter mit…“ oder einem leeren Gemini- oder ChatGPT-Entwurf beheben.
---

## Installation aus dem Quellcode

Verwende Chrome auf dem Desktop, Node.js 22.23.4 oder neuer sowie pnpm 10.13.1. Klone das [AI Mode Exporter-Repository](https://github.com/RonkTsang/ai-mode-exporter) und führe die folgenden Befehle im Stammverzeichnis aus:

```sh
pnpm install
pnpm build
```

Öffne `chrome://extensions`, aktiviere den **Entwicklermodus** und klicke auf **Entpackte Erweiterung laden**. Wähle den erzeugten Ordner `.output/chrome-mv3` aus. Lade bereits geöffnete Google-AI-Mode-Tabs neu.

## Die Schaltfläche „Weiter mit…“ fehlt

- Öffne [Google AI Mode](https://www.google.com/search?udm=50) in Chrome auf dem Desktop. Die Schaltfläche ist im AI Mode auf `www.google.com` verfügbar. Eine normale Suchergebnisseite mit AI Overview ist eine andere Ansicht.
- Stelle eine Frage und warte, bis die Antwort fertig ist. Anschließend erscheint **Weiter mit…** über dem Eingabefeld.
- Prüfe unter `chrome://extensions`, ob AI Mode Exporter aktiviert ist. Lade den AI-Mode-Tab nach der Installation, Aktualisierung oder dem Neuladen der Erweiterung neu und versuche es erneut.

## Das Ziel wird mit einem leeren Entwurf geöffnet

Öffne [Gemini](https://gemini.google.com/) oder [ChatGPT](https://chatgpt.com/), melde dich bei Bedarf an und prüfe, ob sich ein neuer Chat öffnen lässt. Wechsle zum ursprünglichen AI-Mode-Tab zurück und starte die Übertragung erneut. Warte, bis der Entwurf geladen ist, bevor du etwas eingibst. Gemini zeigt einen Markdown-Anhang. ChatGPT zeigt den Text üblicherweise im Eingabebereich an und kann längere Texte in einen Anhang umwandeln.

Wenn das Problem weiterhin besteht, [kontaktiere den Entwickler](/de/support/).
