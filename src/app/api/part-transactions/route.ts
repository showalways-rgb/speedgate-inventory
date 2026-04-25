import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const partId = searchParams.get("partId");
  const type = searchParams.get("type");
  const limit = searchParams.get("limit");

  try {
    const transactions = await prisma.partTransaction.findMany({
      where: {
        ...(partId ? { partId: parseInt(partId) } : {}),
        ...(type ? { type } : {}),
      },
      include: { part: true },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });
    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: "부품 거래 조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { partId, type, quantity, note, date, productTransactionId } = await request.json();

    if (!partId || !type || !quantity) {
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
      const existing = await tx.partStock.findUnique({ where: { partId } });
      const current = existing?.quantity ?? 0;

      if (type === "OUT" && current < qty) {
        throw new Error(`재고 부족: 현재 재고 ${current}${""}`);
      }

      const newQty = type === "IN" ? current + qty : current - qty;

      await tx.partStock.upsert({
        where: { partId },
        create: { partId, quantity: newQty },
        update: { quantity: newQty },
      });

      return tx.partTransaction.create({
        data: {
          partId, type, quantity: qty, note,
          ...(date ? { createdAt: new Date(date) } : {}),
          ...(productTransactionId ? { productTransactionId } : {}),
        },
        include: { part: true },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "처리 중 오류";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
