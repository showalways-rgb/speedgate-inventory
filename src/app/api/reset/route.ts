import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DATABASE_RESET !== "true") {
    return NextResponse.json(
      { error: "운영 환경에서는 비활성화되었습니다. 필요 시 ALLOW_DATABASE_RESET=true 로 명시하세요." },
      { status: 403 }
    );
  }
  await prisma.counter.deleteMany();
  await prisma.transaction.deleteMany();
  return NextResponse.json({ success: true });
}
