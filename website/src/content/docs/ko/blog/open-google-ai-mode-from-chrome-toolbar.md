---
title: Chrome 툴바에서 Google AI 모드를 여는 방법
description: 데스크톱 Chrome에서 AI Mode Exporter를 툴바에 고정해 어느 웹페이지에서나 Google AI 모드에 질문하고, 여러 줄 프롬프트를 작성하거나, 툴바 팝업에서 열려 있는 AI 모드 채팅을 이어가세요.
---

AI Mode Exporter는 Chrome 툴바에 빠른 검색창을 추가해 주어, 보고 있던 페이지를 벗어나지 않고도 어느 웹페이지에서나 Google 검색 AI 모드 대화를 시작할 수 있습니다. 질문은 새 AI 모드 탭에서 열리며 현재 탭은 그대로 유지됩니다.

## Chrome 툴바에 확장 프로그램 고정하기

Chrome은 새로 설치한 확장 프로그램을 기본적으로 **확장 프로그램** 메뉴 안에 숨겨 둡니다. AI Mode Exporter를 고정해 두면 클릭 한 번으로 바로 열 수 있습니다:

1. 아직 설치하지 않았다면 먼저 [데스크톱 Chrome에 AI Mode Exporter를 설치](/ko/guide/install-and-troubleshoot/#소스에서-설치)합니다.
2. 툴바 오른쪽 상단에 있는 Chrome **확장 프로그램** 아이콘(퍼즐 조각 모양)을 클릭합니다.
3. **AI Mode Exporter** 옆의 고정 아이콘을 클릭해 툴바에 아이콘이 계속 표시되도록 합니다.

## 어느 페이지에서나 Google AI 모드에 질문하기

1. 툴바에 고정된 **AI Mode Exporter** 아이콘을 클릭합니다. **AI Mode에 질문하기** 입력창에 자동으로 포커스가 맞춰져 바로 입력을 시작할 수 있습니다.
2. 질문을 입력합니다. 예를 들어 *“타이베이에서 비 오는 날 차 없이 즐길 만한 주말 활동은?”*처럼 입력해 보세요.
3. **Enter** 키를 누르거나 검색 아이콘을 클릭하면 새 Google AI 모드 탭에서 질문이 열립니다.

![고정된 AI Mode Exporter 아이콘을 클릭하면 'AI Mode에 질문하기' 검색창이 있는 팝업이 열립니다](/images/toolbar-popup.webp)

:::tip[여러 줄로 질문 작성하기]
질문을 바로 전송하지 않고 줄을 바꾸려면 macOS에서는 **Cmd + Enter**, Windows 및 Linux에서는 **Ctrl + Enter**를 누르세요. 입력창은 입력하는 내용에 맞춰 자동으로 늘어납니다.
:::

## 팝업에서 열려 있는 AI 모드 채팅 이어가거나 저장하기

이미 Google AI 모드 탭에 있는 상태에서 툴바 팝업을 열면 검색창 아래에 **이 채팅 이어가기…** 버튼도 함께 표시됩니다.

![AI 모드 탭에서는 확장 프로그램 팝업에 '이 채팅 이어가기…' 옵션이 표시됩니다](/images/toolbar-popup-continue.webp)

답변이 완료될 때까지 기다린 뒤 **이 채팅 이어가기…**를 클릭하면 선택 대화상자가 열려 다음 작업을 할 수 있습니다:

- [선택한 대화를 Gemini](/ko/blog/continue-google-ai-mode-in-gemini/) 또는 [ChatGPT](/ko/blog/continue-google-ai-mode-in-chatgpt/)에서 이어가기.
- [대화를 Markdown 또는 PDF로 저장](/ko/blog/save-google-ai-mode-conversation/)하거나 클립보드에 복사하기.

:::note[페이지 내 버튼이 사라졌을 때를 위한 내장 백업 기능]
Google이 AI 모드 페이지 레이아웃을 가끔 변경하면서 페이지 안의 **계속하기…** 버튼이 일시적으로 보이지 않을 수 있습니다. 그런 경우에도 툴바 팝업의 **이 채팅 이어가기…**를 사용하면 완전히 동일한 대화상자를 열 수 있습니다.
:::

## 문제 해결

- **툴바에서 AI 모드가 열리지 않음:** 같은 Chrome 프로필에서 [Google AI 모드를 직접 열어](https://www.google.com/search?udm=50) Google 로그인이나 보안 확인 요청이 나타나면 완료하세요.
- **‘이 채팅 이어가기…’가 나타나지 않음:** 현재 활성화된 Google AI 모드 탭(`www.google.com`)에 있는지 확인하고, 확장 프로그램을 설치·업데이트·다시 활성화한 후에는 해당 탭을 새로고침하세요.

AI 모드를 직접 열었을 때는 정상 작동하지만 툴바 팝업이 여전히 작동하지 않는다면 [설치 및 문제 해결 가이드](/ko/guide/install-and-troubleshoot/)를 확인하거나 [개발자에게 문의](/ko/support/)해 주세요.
