# 프롬프트 4 — (선택) 샘플 보드를 Supabase DB로 (15:00까지 화면 3개가 배포됐을 때만)

목적: `/samples`의 단계 저장을 localStorage에서 Supabase(PostgreSQL)로 옮겨,
노트북에서 '다음 단계'를 누르면 휴대폰에서도 같은 상태가 보이게 한다. 5일차 방식 그대로.

1) `prisma/schema.prisma`에 `Sample` 모델 하나만 추가:
   id String @id, productCode String, customer String, sentDate DateTime,
   stage String, note String?, updatedAt DateTime @updatedAt
2) `data/samples.json`을 넣는 seed 스크립트(두 번 돌려도 15건).
3) `/samples`는 서버에서 `db().sample.findMany()`로 읽고,
   '다음 단계'는 서버 액션 하나에서 `db().sample.update()` (유일한 쓰기).
   '처음으로 되돌리기'는 seed 값으로 되돌리는 서버 액션.
4) 연결 주소는 `.env`의 DATABASE_URL(6543) · DIRECT_URL(5432). 비밀은 커밋하지 말 것.
   Vercel에는 DATABASE_URL만 환경 변수로 넣고 Redeploy가 필요하다고 알려 줘.
5) 내가 칠 명령을 순서대로 알려 줘 (`npm run db:push` → `npm run db:seed` 등). 막히면 `npm run doctor:db`.
6) `npm run build` 통과 확인 후 커밋.

막혔을 때: 28P01 비밀번호 · P1001 풀러 주소 · localhost:5432 .env 없음 · db push 데이터 손실 질문은 N.
15:30 코드 프리즈 전에 안 끝나면 되돌리고(localStorage 버전), SPEC '다음 단계'에만 적는다.
