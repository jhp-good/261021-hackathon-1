# 데이터 모양 (재고 · 샘플 · 거래처는 가상)

## data/products.json — 제품명 × 사이즈 한 줄씩 (점토벽돌 22종 98개, 타일 6종 12개)
벽돌 제품명 · 사진은 삼정세라믹 점토벽돌(제공자 본인 자료). 규격 · 파렛트당 장수는 업계 표 기준, 재고는 가상. 단가는 넣지 않는다.

- 벽돌 사이즈: 변색 · 환원(진) · 환원(연)은 190x90x57만, 나머지는 190x90x57 · 230x90x57 · 290x90x57 · 230x90x76 · 300x90x76
- 파렛트당 장수: 190×57 1,300 · 230×57 1,105 · 290×57 884 · 230×76 864 · 300×76 612 (화이트 계열 엔젤화이트 · 블랑쉬100/200 · 버클리화이트는 480)

| 칸 | 타입 | 설명 |
| --- | --- | --- |
| code | string | 품번, 예 `B01-190x57`(제품 번호-길이x높이), `T01-230x76` |
| category | "tile" \| "brick" | 종류 (tile = 벽돌 타일) |
| name | string | 제품명, 예 `코넬`, `환원(진)`, 타일 `화이트 투톤` |
| image | string \| null | 제품 사진 경로 `/images/bricks/….webp` (public/ 기준). 타일은 null |
| size | string | mm `"길이x폭x높이"`. 벽돌 `"190x90x57"`, 타일 `"230x20x76"`(가운데는 두께) |
| piecesPerSqm | number \| null | 보통 null → 규격 + 줄눈 12mm로 계산. 직접 값이 있으면 우선 |
| packUnit | "파렛트" | 포장 단위 |
| piecesPerPack | number | 파렛트당 장수 |
| stock | number | 현재 재고(장) |
| reorderPoint | number | 기준 재고(장) |

데모용: 재고 빨강 3개, 노랑 3개가 되도록 값을 맞춘다.

## data/samples.json — 15건
| 칸 | 타입 | 설명 |
| --- | --- | --- |
| id | string | `S-01` … |
| productCode | string | products.json의 code |
| customer | string | 가상 이름 `○○건설`, `△△인테리어` |
| sentDate | string | `YYYY-MM-DD` |
| stage | "발송 준비" \| "발송" \| "도착" \| "확인완료" | 현재 단계 |
| note | string | 메모. 발송 준비 단계에서 적음 |
| feedback | string | 거래처 피드백. 확인완료 단계에서 적음 (화면에서 고친 값은 localStorage에) |

데모용: 발송 후 7일 넘게 도착 안 된 카드가 2건 있게 만든다.

데이터를 만든 스크립트는 `scripts/`에 남긴다.
