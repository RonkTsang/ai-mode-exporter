---
title: Installation et dépannage
description: Installer AI Mode Exporter depuis les sources et résoudre l’absence du bouton « Continuer avec… » ou d’un brouillon Gemini ou ChatGPT vide.
---

## Installer depuis les sources

Utilisez Chrome sur ordinateur, Node.js 22.23.4 ou version ultérieure et pnpm 10.13.1. Clonez le [dépôt AI Mode Exporter](https://github.com/RonkTsang/ai-mode-exporter), puis exécutez les commandes suivantes à la racine du dépôt :

```sh
pnpm install
pnpm build
```

Ouvrez `chrome://extensions`, activez le **mode développeur** et cliquez sur **Charger l’extension non empaquetée**. Sélectionnez le dossier `.output/chrome-mv3` généré. Actualisez les onglets Google AI Mode déjà ouverts.

## Le bouton « Continuer avec… » n’apparaît pas

- Ouvrez [Google AI Mode](https://www.google.com/search?udm=50) dans Chrome sur ordinateur. Le bouton est disponible dans le mode IA sur `www.google.com`. Une page de résultats de recherche classique avec un aperçu IA est différente.
- Posez une question et attendez la fin de la réponse. **Continuer avec…** apparaît ensuite au-dessus du champ de saisie.
- Vérifiez qu’AI Mode Exporter est activée sur `chrome://extensions`. Après l’installation, la mise à jour ou le rechargement de l’extension, actualisez l’onglet AI Mode et réessayez.

## La destination s’ouvre sur un brouillon vide

Ouvrez [Gemini](https://gemini.google.com/) ou [ChatGPT](https://chatgpt.com/), connectez-vous si nécessaire et vérifiez que vous pouvez démarrer une nouvelle conversation. Revenez à l’onglet AI Mode d’origine et relancez le transfert. Attendez le chargement du brouillon avant de saisir du texte. Gemini affiche une pièce jointe Markdown. ChatGPT affiche généralement le texte dans son éditeur et peut convertir les textes longs en pièce jointe.

Si le problème persiste, [contactez le développeur](/fr/support/).
