// Prisma 클라이언트 하나만 — 개발 서버가 다시 불러와도 연결이 쌓이지 않게 globalThis에 보관
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

export function db(): PrismaClient {
  return (g.prisma ??= new PrismaClient());
}
