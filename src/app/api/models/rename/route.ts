import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 모델명 변경 (해당 모델의 모든 Product.modelName 일괄 업데이트)
export async function POST(request: Request) {
  try {
    const { oldName, newName } = await request.json();

    if (!oldName?.trim() || !newName?.trim()) {
      return NextResponse.json(
        { error: "기존 모델명과 새 모델명을 모두 입력하세요." },
        { status: 400 }
      );
    }

    const trimmedNew = newName.trim();

    const existing = await prisma.product.findFirst({
      where: { modelName: trimmedNew },
    });
    if (existing && trimmedNew !== oldName.trim()) {
      return NextResponse.json(
        { error: "이미 존재하는 모델명입니다." },
        { status: 409 }
      );
    }

    await prisma.product.updateMany({
      where: { modelName: oldName.trim() },
      data: { modelName: trimmedNew },
    });

    return NextResponse.json({ oldName, newName: trimmedNew });
  } catch {
    return NextResponse.json({ error: "모델명 변경 실패" }, { status: 500 });
  }
}
