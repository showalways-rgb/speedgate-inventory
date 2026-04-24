import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const type = searchParams.get("type");
  const limit = searchParams.get("limit");

  try {
    const transactions = await prisma.productTransaction.findMany({
      where: {
        ...(productId ? { productId: parseInt(productId) } : {}),
        ...(type ? { type } : {}),
      },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });
    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: "제품 거래 조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { productId, type, quantity, note, date } = await request.json();

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
      const existing = await tx.productStock.findUnique({ where: { productId } });
      const current = existing?.quantity ?? 0;

      if (type === "OUT" && current < qty) {
        throw new Error(`재고 부족: 현재 재고 ${current}대`);
      }

      const newQty = type === "IN" ? current + qty : current - qty;

      await tx.productStock.upsert({
        where: { productId },
        create: { productId, quantity: newQty },
        update: { quantity: newQty },
      });

      return tx.productTransaction.create({
        data: {
          productId, type, quantity: qty, note,
          ...(date ? { createdAt: new Date(date) } : {}),
        },
        include: { product: true },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "처리 중 오류";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
