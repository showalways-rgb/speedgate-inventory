import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stocks = await prisma.productStock.findMany({
      include: { product: true },
      orderBy: [{ product: { modelName: "asc" } }, { product: { variant: "asc" } }],
    });
    return NextResponse.json(stocks);
  } catch {
    return NextResponse.json({ error: "제품 재고 조회 실패" }, { status: 500 });
  }
}
