import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ partId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { partId } = await params;
    const id = parseInt(partId);
    const { name, unit } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "부품명을 입력하세요." }, { status: 400 });
    }
    const conflict = await prisma.part.findFirst({
      where: { name: name.trim(), NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "이미 존재하는 부품명입니다." }, { status: 409 });
    }
    const updated = await prisma.part.update({
      where: { id },
      data: { name: name.trim(), ...(unit ? { unit: unit.trim() } : {}) },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "부품 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { partId } = await params;
    const id = parseInt(partId);
    await prisma.$transaction(async (tx) => {
      await tx.partTransaction.deleteMany({ where: { partId: id } });
      await tx.partStock.deleteMany({ where: { partId: id } });
      await tx.part.delete({ where: { id } });
    });
    return NextResponse.json({ deleted: id });
  } catch {
    return NextResponse.json({ error: "부품 삭제 실패" }, { status: 500 });
  }
}
