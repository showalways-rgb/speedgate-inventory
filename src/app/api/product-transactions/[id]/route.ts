import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      const oldTx = await tx.productTransaction.findUnique({ where: { id: Number(id) } });
      if (!oldTx) throw new Error("내역을 찾을 수 없습니다.");

      // 재고 원복
      const effect = oldTx.type === "IN" ? -oldTx.quantity : oldTx.quantity;
      const stock = await tx.productStock.findUnique({ where: { productId: oldTx.productId } });
      const updatedQty = Math.max(0, (stock?.quantity ?? 0) + effect);

      await tx.productStock.upsert({
        where: { productId: oldTx.productId },
        update: { quantity: updatedQty },
        create: { productId: oldTx.productId, quantity: updatedQty },
      });
      await tx.productTransaction.delete({ where: { id: Number(id) } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "삭제 실패";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { note, type, quantity, date } = await req.json();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const oldTx = await tx.productTransaction.findUnique({ where: { id: Number(id) } });
      if (!oldTx) throw new Error("내역을 찾을 수 없습니다.");

      // 재고 보정: 기존 효과 취소 후 새 효과 적용
      if (type !== undefined || quantity !== undefined) {
        const newType = type ?? oldTx.type;
        const newQty  = quantity !== undefined ? Number(quantity) : oldTx.quantity;
        const oldEffect = oldTx.type === "IN" ? oldTx.quantity : -oldTx.quantity;
        const newEffect = newType === "IN" ? newQty : -newQty;
        const delta = newEffect - oldEffect;

        const stock = await tx.productStock.findUnique({ where: { productId: oldTx.productId } });
        const currentQty = stock?.quantity ?? 0;
        const updatedQty = currentQty + delta;
        if (updatedQty < 0) throw new Error(`재고 부족: 수정 후 재고가 ${updatedQty}대가 됩니다.`);

        await tx.productStock.upsert({
          where: { productId: oldTx.productId },
          update: { quantity: updatedQty },
          create: { productId: oldTx.productId, quantity: updatedQty },
        });
      }

      return tx.productTransaction.update({
        where: { id: Number(id) },
        data: {
          ...(note !== undefined ? { note } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
          ...(date !== undefined ? { createdAt: new Date(date) } : {}),
        },
        include: { product: true },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "수정 실패";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
