# 프롬프트 1 — 데이터 + 견적 화면 (목표 14:30)

목적: @hackathon/SPEC.md 의 MVP를 만든다. 오늘은 1단계만.

1) @hackathon/spec/data-model.md 대로 `data/products.json` 가상 14종을 만들고, 만든 스크립트를 `scripts/`에 남겨 줘.
2) 상단에 세 화면 이동 메뉴(견적 `/` · 재고 `/stock` · 샘플 `/samples`). 아직 없는 화면은 "준비 중".
3) 견적 화면 `/`: 타일/벽돌 탭 → 품목 선택 → 면적(㎡) → 로스율. 계산은 @hackathon/spec/calc-rules.md 그대로.
   결과 카드에 필요 장수 · 포장 수(박스/파렛트) · 주문 장수 · 합계를 크게.
4) 계산 함수는 `lib/quote.ts`로 빼고 calc-rules.md의 테스트를 만들어 통과시켜 줘.
5) `npm run build` 통과 확인 후 커밋. 배포는 내가 확인하고 할게.
