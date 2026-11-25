---
title: 설치 및 문제 해결
description: 소스에서 AI Mode Exporter를 설치하고 계속 버튼이 보이지 않거나 Gemini 또는 ChatGPT 초안이 비어 있는 문제를 해결하세요.
---

## 소스에서 설치

데스크톱 Chrome, Node.js 22.23.4 이상, pnpm 10.13.1을 사용하세요. [AI Mode Exporter 저장소](https://github.com/RonkTsang/ai-mode-exporter)를 복제하고 저장소 루트에서 다음 명령어를 실행합니다.

```sh
pnpm install
pnpm build
```

`chrome://extensions`를 열고 **개발자 모드**를 켠 다음 **압축해제된 확장 프로그램을 로드합니다**를 클릭합니다. 생성된 `.output/chrome-mv3` 폴더를 선택합니다. 이미 열려 있는 Google AI 모드 탭을 새로고침하세요.

## 계속하기… 버튼이 보이지 않음

- 데스크톱 Chrome에서 [Google AI 모드](https://www.google.com/search?udm=50)를 여세요. 이 버튼은 `www.google.com`의 AI 모드에 표시됩니다. 일반 검색 결과 페이지의 AI 개요는 다른 화면입니다.
- 질문하고 답변이 완료될 때까지 기다린 다음 입력창 위에서 **계속하기…**를 찾으세요.
- `chrome://extensions`에서 AI Mode Exporter가 사용 설정되어 있는지 확인하세요. 설치, 업데이트 또는 확장 프로그램을 다시 불러온 뒤에는 AI 모드 탭을 새로고침하고 다시 시도하세요.

## 대상 서비스에서 초안이 비어 있음

[Gemini](https://gemini.google.com/) 또는 [ChatGPT](https://chatgpt.com/)를 열고 필요한 경우 로그인한 다음 새 채팅을 열 수 있는지 확인하세요. 원래 AI 모드 탭으로 돌아가 전송을 다시 시작하세요. 입력하기 전에 초안이 로드될 때까지 기다리세요. Gemini에는 Markdown 첨부 파일이 표시됩니다. ChatGPT는 보통 입력창에 텍스트를 표시하며 긴 내용은 첨부 파일로 바뀔 수 있습니다.


문제가 계속되면 [지원 문의](/ko/support/)를 이용하세요.
