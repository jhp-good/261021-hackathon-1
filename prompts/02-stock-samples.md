# 프롬프트 2 — 재고 신호등 + 샘플 보드 (목표 15:15)

@hackathon/SPEC.md · @hackathon/spec/data-model.md · @hackathon/spec/calc-rules.md 기준으로:

1) `/stock` 재고 신호등: 색 규칙은 calc-rules.md. 맨 위에 "빨강 N개" 크게, 빨강이 위로 오게 정렬, 타일/벽돌 필터. 보기 전용(쓰기 없음).
2) `data/samples.json` 가상 15건 + `scripts/` 스크립트 (data-model.md 대로).
3) `/samples` 4칸 보드(포장 · 발송 · 도착 · 피드백). 카드마다 '다음 단계' 단추 → 한 칸 이동, 상태는 localStorage. '처음으로 되돌리기' 단추. 7일 지연 카드는 노란 테두리.
4) `npm run build` 통과 확인 후 커밋.
