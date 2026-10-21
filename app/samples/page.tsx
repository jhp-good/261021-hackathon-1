// 샘플 보드 — 서버에서 DB를 읽어 보드에 넘긴다 (노트북 · 휴대폰이 같은 상태를 본다)
import { db } from "@/lib/db";
import { toSample } from "@/lib/samples-db";
import Board from "./board";

export const dynamic = "force-dynamic";

// 연결 실패 원인을 한 줄로 — 주소 · 비밀번호는 화면에 내보내지 않는다
function reasonOf(e: unknown): string {
  const msg = String((e as Error)?.message ?? "");
  if (/Environment variable not found: DATABASE_URL/.test(msg)) return "DATABASE_URL 환경 변수가 없습니다 (Production에 넣고 Redeploy)";
  if (/must start with the protocol/.test(msg)) return "DATABASE_URL 값 모양이 틀렸습니다 — 앞뒤 따옴표나 'DATABASE_URL='까지 넣었는지 확인";
  if (/Authentication failed|28P01|P1000|password/i.test(msg)) return "비밀번호가 틀렸습니다 — [ ] 대괄호가 남아 있는지 확인";
  if (/P1001|Can't reach/i.test(msg)) return "DB 주소에 닿지 못했습니다 — 풀러 주소(6543)인지 확인";
  if (/Tenant or user not found/i.test(msg)) return "사용자 이름이 postgres.<프로젝트ref> 형태인지 확인";
  if (/P2021|does not exist/i.test(msg)) return "Sample 표가 없습니다 — npm run db:push";
  if (/Query engine|could not locate/i.test(msg)) return "Prisma 엔진을 찾지 못했습니다 — Redeploy (빌드 캐시 없이)";
  return (e as Error)?.name ?? "알 수 없는 오류";
}

export default async function SamplesPage() {
  try {
    const rows = await db().sample.findMany({ orderBy: { id: "asc" } });
    return <Board samples={rows.map(toSample)} />;
  } catch (e) {
    console.error("[samples] DB 연결 실패", e); // Vercel → Logs에서 전체 내용 확인
    return (
      <section className="db-error">
        <h2>샘플 DB에 연결하지 못했습니다</h2>
        <p className="reason">원인: {reasonOf(e)}</p>
        <p>
          로컬이면 <code>.env</code>의 DATABASE_URL · DIRECT_URL을 확인하고 <code>npm run doctor:db</code>를 실행해 주세요.
          배포 주소면 Vercel 환경 변수 DATABASE_URL을 넣은 뒤 Redeploy가 필요합니다.
        </p>
      </section>
    );
  }
}
