# Project Instructions

## CI / Pre-commit

- 커밋 전, push 전, PR 생성 전에 반드시 `npm run pc`를 실행하여 lint/format 검사를 통과시킨다.
- `npm run pc`는 `pre-commit run --all-files`를 실행한다.
- 포매터가 파일을 수정하면 해당 변경을 함께 커밋한다.

## Scripts

- `npm run format` — Prettier 포매팅
- `npm run lint` — ESLint 검사 및 자동 수정
- `npm run pc` — pre-commit 전체 실행 (CI와 동일)
