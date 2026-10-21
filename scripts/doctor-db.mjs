// DB 연결 점검 — 실행: npm run doctor:db
// .env의 주소 모양을 먼저 보고, 실제로 접속해 Sample 표와 건수까지 확인한다. 비밀번호는 화면에 찍지 않는다.
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const ok = (m) => console.log("  ✔", m);
const bad = (m) => console.log("  ✘", m);
const tip = (m) => console.log("    →", m);
let problems = 0;

console.log("\n[1] .env 파일");
if (!existsSync(".env")) {
  bad(".env가 없습니다 (localhost:5432로 접속하려다 실패하는 원인)");
  tip(".env.example을 복사해 .env를 만들고 Supabase 주소를 넣어 주세요.");
  process.exit(1);
}
process.loadEnvFile(".env");
ok(".env 있음");

const mask = (u) => u.replace(/:\/\/([^:]+):[^@]*@/, "://$1:****@");
const check = (name, port) => {
  const url = process.env[name];
  if (!url) return bad(`${name} 없음`), problems++;
  console.log(`    ${name} = ${mask(url)}`);
  if (/\[YOUR-PASSWORD\]|<[^>]+>/i.test(url)) bad(`${name}에 <비밀번호> 같은 자리표시가 그대로 있습니다`), problems++;
  else if (/:\/\/[^:]+:\[[^\]]*\]@/.test(url)) bad(`${name} 비밀번호가 [ ]로 감싸져 있습니다 — [YOUR-PASSWORD]의 대괄호까지 지워야 합니다`), problems++;
  if (!url.includes(`:${port}/`)) bad(`${name}의 포트가 ${port}가 아닙니다`), problems++;
  else ok(`${name} 포트 ${port}`);
  return url;
};

console.log("\n[2] 주소 모양");
const pooled = check("DATABASE_URL", 6543);
check("DIRECT_URL", 5432);
if (pooled && !pooled.includes("pooler.supabase.com")) bad("DATABASE_URL이 풀러 주소(…pooler.supabase.com)가 아닙니다 (P1001 원인)"), problems++;
if (pooled && !pooled.includes("pgbouncer=true")) bad("DATABASE_URL 끝에 ?pgbouncer=true 가 없습니다 (prepared statement 오류 원인)"), problems++;

console.log("\n[3] 실제 접속");
const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1`;
  ok("접속 성공");
  try {
    ok(`Sample 표 ${await prisma.sample.count()}건`);
  } catch {
    bad("Sample 표가 없습니다"), problems++;
    tip("npm run db:push 를 먼저 실행하세요. (데이터 손실 질문이 나오면 N)");
  }
} catch (e) {
  problems++;
  const msg = String(e.message);
  bad(`접속 실패 ${e.errorCode ?? e.code ?? ""}`);
  if (/28P01|P1000|password authentication|Authentication failed|valid database credentials/i.test(msg)) tip("28P01: 비밀번호가 틀렸습니다. Supabase → Database → Reset password 후 .env 두 줄 모두 고치세요.");
  else if (/P1001|Can't reach/i.test(msg)) tip("P1001: 주소에 닿지 못했습니다. Connect → ORM(Prisma)의 풀러 주소(6543)를 그대로 복사했는지 확인하세요.");
  else if (/Tenant or user not found/i.test(msg)) tip("사용자 이름이 postgres.<프로젝트ref> 형태인지 확인하세요.");
  else tip(msg.split("\n").slice(-2).join(" "));
} finally {
  await prisma.$disconnect();
}

console.log(problems ? `\n문제 ${problems}개 — 위 → 안내를 따라 고친 뒤 다시 실행하세요.\n` : "\n모두 정상입니다.\n");
process.exitCode = problems ? 1 : 0;
