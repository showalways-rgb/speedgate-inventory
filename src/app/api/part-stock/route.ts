import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stocks = await prisma.partStock.findMany({
      include: { part: true },
      orderBy: { part: { name: "asc" } },
    });
    return NextResponse.json(stocks);
  } catch {
    return NextResponse.json({ error: "부품 재고 조회 실패" }, { status: 500 });
  }
}
