import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itemId = Number(id);
  const txCount = await prisma.transaction.count({ where: { itemId } });
  if (txCount > 0) {
    return NextResponse.json({ error: "거래 내역이 있는 모델은 삭제할 수 없습니다." }, { status: 400 });
  }
  await prisma.item.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
