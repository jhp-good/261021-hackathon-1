// data/samples.json → Supabase Sample 표. 실행: npm run db:seed (두 번 돌려도 15건)
import { PrismaClient } from "@prisma/client";
import { seedSamples } from "../lib/samples-db";

const prisma = new PrismaClient();

seedSamples(prisma)
  .then(async (n) => console.log(`샘플 ${n}건 넣음 (DB에는 ${await prisma.sample.count()}건)`))
  .catch((e) => {
    console.error("seed 실패:", e.code ?? "", e.message.split("\n").slice(-2).join(" "));
    console.error("→ npm run doctor:db 로 연결을 점검해 주세요.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
