// 샘플 보드 — 서버에서 DB를 읽어 보드에 넘긴다 (노트북 · 휴대폰이 같은 상태를 본다)
import { db } from "@/lib/db";
import { toSample } from "@/lib/samples-db";
import Board from "./board";

export const dynamic = "force-dynamic";

export default async function SamplesPage() {
  try {
    const rows = await db().sample.findMany({ orderBy: { id: "asc" } });
    return <Board samples={rows.map(toSample)} />;
  } catch (e) {
    const code = (e as { code?: string; errorCode?: string }).code ?? (e as { errorCode?: string }).errorCode;
    return (
      <section className="db-error">
        <h2>샘플 DB에 연결하지 못했습니다{code ? ` (${code})` : ""}</h2>
        <p>
          로컬이면 <code>.env</code>의 DATABASE_URL · DIRECT_URL을 확인하고 <code>npm run doctor:db</code>를 실행해 주세요.
          배포 주소면 Vercel 환경 변수 DATABASE_URL을 넣은 뒤 Redeploy가 필요합니다.
        </p>
      </section>
    );
  }
}
