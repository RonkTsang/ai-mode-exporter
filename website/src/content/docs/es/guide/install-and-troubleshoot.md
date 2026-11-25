---
title: Instalación y solución de problemas
description: Instala AI Mode Exporter desde el código fuente y soluciona problemas con el botón Continuar o con borradores vacíos de Gemini o ChatGPT.
---

## Instalar desde el código fuente

Necesitas Chrome para ordenador, Node.js 22.23.4 o posterior y pnpm 10.13.1. Clona el [repositorio de AI Mode Exporter](https://github.com/RonkTsang/ai-mode-exporter) y ejecuta estos comandos desde la carpeta raíz del repositorio.

```sh
pnpm install
pnpm build
```

Abre `chrome://extensions`, activa el **Modo de desarrollador** y haz clic en **Cargar descomprimida**. Selecciona la carpeta generada `.output/chrome-mv3`. Vuelve a cargar cualquier pestaña del Modo IA de Google que ya estuviera abierta.

## No aparece el botón Continuar

- Abre el [Modo IA de Google](https://www.google.com/search?udm=50) en Chrome para ordenador. El botón está disponible en el Modo IA de `www.google.com`. Una página normal de resultados con una descripción general creada por IA es una vista distinta.
- Haz una pregunta y espera a que termine la respuesta. Después, busca **Continuar en…** encima del cuadro de entrada.
- Comprueba que AI Mode Exporter esté habilitada en `chrome://extensions`. Después de instalar, actualizar o volver a cargar la extensión, recarga la pestaña del Modo IA e inténtalo de nuevo.

## El destino se abre con un borrador vacío

Abre [Gemini](https://gemini.google.com/) o [ChatGPT](https://chatgpt.com/), inicia sesión si te lo piden y comprueba que puedes abrir un chat nuevo. Vuelve a la pestaña original del Modo IA e inicia una transferencia nueva. Espera a que se cargue el borrador antes de escribir. Gemini muestra un archivo adjunto en formato Markdown. ChatGPT suele mostrar el texto en el cuadro de entrada y puede convertir los textos más largos en un archivo adjunto.

Si el problema continúa, [contacta con el desarrollador](/es/support/).
