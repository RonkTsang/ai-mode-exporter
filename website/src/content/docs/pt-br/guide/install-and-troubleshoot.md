---
title: Instalação e solução de problemas
description: Instale o AI Mode Exporter a partir do código-fonte e resolva problemas com o botão Continuar ou rascunhos vazios no Gemini ou no ChatGPT.
---

## Instalar a partir do código-fonte

Você precisa do Chrome para computador, Node.js 22.23.4 ou mais recente e pnpm 10.13.1. Clone o [repositório do AI Mode Exporter](https://github.com/RonkTsang/ai-mode-exporter). Execute os comandos a seguir na pasta raiz do repositório.

```sh
pnpm install
pnpm build
```

Abra `chrome://extensions`, ative o **Modo do desenvolvedor** e clique em **Carregar sem compactação**. Escolha a pasta gerada `.output/chrome-mv3`. Recarregue qualquer guia do Modo IA do Google que já estava aberta.

## O botão Continuar não aparece

- Abra o [Modo IA do Google](https://www.google.com/search?udm=50) no Chrome para computador. O botão está disponível no Modo IA em `www.google.com`. Uma página comum de resultados com uma Visão geral criada por IA é outra tela.
- Faça uma pergunta e aguarde o fim da resposta. Depois, procure **Continuar em…** acima do campo de entrada.
- Confira se o AI Mode Exporter está ativado em `chrome://extensions`. Depois de instalar, atualizar ou recarregar a extensão, atualize a guia do Modo IA e tente novamente.

## O destino abre com um rascunho vazio

Abra o [Gemini](https://gemini.google.com/) ou o [ChatGPT](https://chatgpt.com/), faça login se solicitado e confira se consegue abrir uma conversa nova. Volte à guia original do Modo IA e inicie outra transferência. Aguarde o rascunho carregar antes de digitar. O Gemini mostra um arquivo anexo em Markdown. O ChatGPT normalmente mostra o texto no campo de entrada e pode transformar textos mais longos em um arquivo anexo.

Se o problema continuar, [entre em contato com o desenvolvedor](/pt-br/support/).
