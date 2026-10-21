# 데이터 모양 (전부 가상)

## data/products.json — 14종 (타일 8, 벽돌 6)
| 칸 | 타입 | 설명 |
| --- | --- | --- |
| code | string | 품번, 예 `T-601`, `B-201` |
| category | "tile" \| "brick" | 종류 |
| name | string | 품명 (가상) |
| size | string | mm. 타일 `"600x600"`, 벽돌 `"190x90x57"` |
| pricePerPiece | number | 장당 단가(원, VAT 포함, **가상 값**) |
| piecesPerSqm | number \| null | 벽돌만 직접 값(예 75). 타일은 null → 규격으로 계산 |
| packUnit | "박스" \| "파렛트" | 타일=박스, 벽돌=파렛트 |
| piecesPerPack | number | 박스·파렛트당 장수 |
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
| stage | "포장" \| "발송" \| "도착" \| "피드백" | 현재 단계 |
| note | string | 메모 |

데모용: 발송 후 7일 넘게 도착 안 된 카드가 2건 있게 만든다.

데이터를 만든 스크립트는 `scripts/`에 남긴다.
