import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getComputedProductQty, recomputeProductStock } from "@/lib/stock-recompute";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const type = searchParams.get("type");
  const limit = searchParams.get("limit");

  try {
    const where = {
      ...(productId ? { productId: parseInt(productId) } : {}),
      ...(type ? { type } : {}),
    };
    const paging = {
      ...(limit ? { take: parseInt(limit) } : {}),
    };

    const transactions = await prisma.productTransaction.findMany({
      where,
      include: { product: true, partTransactions: { include: { part: true } } },
      orderBy: { createdAt: "desc" },
      ...paging,
    });
    return NextResponse.json(transactions);
  } catch {
    // 구버전 DB(관계 컬럼 미반영)에서도 제품 현황은 조회되도록 폴백
    try {
      const where = {
        ...(productId ? { productId: parseInt(productId) } : {}),
        ...(type ? { type } : {}),
      };
      const paging = {
        ...(limit ? { take: parseInt(limit) } : {}),
      };
      const legacyTransactions = await prisma.productTransaction.findMany({
        where,
        include: { product: true },
        orderBy: { createdAt: "desc" },
        ...paging,
      });
      return NextResponse.json(
        legacyTransactions.map((tx) => ({ ...tx, partTransactions: [] }))
      );
    } catch {
      return NextResponse.json({ error: "제품 거래 조회 실패" }, { status: 500 });
    }
  }
}

export async function POST(request: Request) {
  try {
    const { productId, type, quantity, note, date, usedParts } = await request.json();

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    if (!["IN", "OUT"].includes(type)) {
      return NextResponse.json({ error: "type은 IN 또는 OUT" }, { status: 400 });
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "수량은 1 이상" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const current = await getComputedProductQty(tx, productId);

      if (type === "OUT" && current < qty) {
        throw new Error(`재고 부족: 현재 재고 ${current}대`);
      }

      const up = typeof usedParts === "string" && usedParts.trim() ? usedParts.trim() : null;
      const created = await tx.productTransaction.create({
        data: {
          productId, type, quantity: qty, note,
          ...(up != null ? { usedParts: up } : {}),
          ...(date ? { createdAt: new Date(date) } : {}),
        },
        include: { product: true, partTransactions: { include: { part: true } } },
      });

      await recomputeProductStock(tx, productId);
      return created;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "처리 중 오류";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
