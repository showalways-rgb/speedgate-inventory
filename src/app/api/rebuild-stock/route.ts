import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputePartStock, recomputeProductStock } from "@/lib/stock-recompute";

/** 모든 제품·부품 재고를 입출고 내역 합계와 일치시킨다. (기존 데이터 보정용) */
export async function POST() {
  try {
    const [products, parts] = await Promise.all([
      prisma.product.findMany({ select: { id: true } }),
      prisma.part.findMany({ select: { id: true } }),
    ]);

    await prisma.$transaction(async (tx) => {
      for (const p of products) await recomputeProductStock(tx, p.id);
      for (const p of parts) await recomputePartStock(tx, p.id);
    });

    return NextResponse.json({ ok: true, products: products.length, parts: parts.length });
  } catch {
    return NextResponse.json({ error: "재고 재계산 실패" }, { status: 500 });
  }
}
