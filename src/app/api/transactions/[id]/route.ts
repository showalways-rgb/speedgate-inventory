import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const txId = Number(id);
  const body = await req.json();
  const { note, addon, spec, price, date } = body;

  const tx = await prisma.transaction.update({
    where: { id: txId },
    data: {
      ...(note !== undefined ? { note: note || null } : {}),
      ...(addon !== undefined ? { addon: addon || null } : {}),
      ...(spec !== undefined ? { spec: spec || null } : {}),
      ...(price !== undefined ? { price: price != null && price !== "" ? Number(price) : null } : {}),
      ...(date ? { date: new Date(date) } : {}),
    },
  });

  return NextResponse.json(tx);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const txId = Number(id);

  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  if (!tx) return NextResponse.json({ error: "거래 내역을 찾을 수 없습니다." }, { status: 404 });

  if (tx.type === "IN") {
    const shippedCount = await prisma.counter.count({
      where: { inTxId: txId, status: "SHIPPED" },
    });
    if (shippedCount > 0) {
      return NextResponse.json(
        { error: "이미 출고된 카운터가 포함되어 있어 삭제할 수 없습니다." },
        { status: 400 }
      );
    }
    await prisma.counter.deleteMany({ where: { inTxId: txId } });
  } else {
    await prisma.counter.updateMany({
      where: { outTxId: txId },
      data: { status: "IN_STOCK", outTxId: null },
    });
  }

  await prisma.transaction.delete({ where: { id: txId } });
  return NextResponse.json({ success: true });
}
