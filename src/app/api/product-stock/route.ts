import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** 입출고 내역 합계로 현재고를 계산해 반환한다(ProductStock 테이블과 불일치해도 화면은 항상 내역과 일치). */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ modelName: "asc" }, { variant: "asc" }],
    });

    const grouped = await prisma.productTransaction.groupBy({
      by: ["productId", "type"],
      _sum: { quantity: true },
    });

    const sums = new Map<number, { in: number; out: number }>();
    for (const g of grouped) {
      const cur = sums.get(g.productId) ?? { in: 0, out: 0 };
      if (g.type === "IN") cur.in += g._sum.quantity ?? 0;
      else if (g.type === "OUT") cur.out += g._sum.quantity ?? 0;
      sums.set(g.productId, cur);
    }

    const stocks = products.map((p) => {
      const s = sums.get(p.id);
      const qty = Math.max(0, (s?.in ?? 0) - (s?.out ?? 0));
      return { productId: p.id, quantity: qty, product: p };
    });

    return NextResponse.json(stocks);
  } catch {
    return NextResponse.json({ error: "제품 재고 조회 실패" }, { status: 500 });
  }
}
