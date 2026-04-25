import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputePartStock, recomputeProductStock } from "@/lib/stock-recompute";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      const oldTx = await tx.productTransaction.findUnique({
        where: { id: Number(id) },
        include: { partTransactions: true },
      });
      if (!oldTx) throw new Error("내역을 찾을 수 없습니다.");

      const partIds = [...new Set(oldTx.partTransactions.map((p) => p.partId))];

      await tx.partTransaction.deleteMany({ where: { productTransactionId: Number(id) } });
      await tx.productTransaction.delete({ where: { id: Number(id) } });

      await recomputeProductStock(tx, oldTx.productId);
      for (const partId of partIds) await recomputePartStock(tx, partId);
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "삭제 실패";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { note, type, quantity, date, usedParts } = await req.json();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const oldTx = await tx.productTransaction.findUnique({ where: { id: Number(id) } });
      if (!oldTx) throw new Error("내역을 찾을 수 없습니다.");

      const updated = await tx.productTransaction.update({
        where: { id: Number(id) },
        data: {
          ...(note !== undefined ? { note } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
          ...(date !== undefined ? { createdAt: new Date(date) } : {}),
          ...(usedParts !== undefined
            ? { usedParts: typeof usedParts === "string" && usedParts.trim() ? usedParts.trim() : null }
            : {}),
        },
        include: { product: true, partTransactions: { include: { part: true } } },
      });

      await recomputeProductStock(tx, updated.productId);
      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "수정 실패";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
