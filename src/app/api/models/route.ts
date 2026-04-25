import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VARIANTS = ["Master", "Slave", "Center", "이동형"];

// 모델명 목록 조회 (중복 제거)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: { modelName: true },
      distinct: ["modelName"],
      orderBy: { modelName: "asc" },
    });
    return NextResponse.json(products.map((p) => p.modelName));
  } catch {
    return NextResponse.json({ error: "모델 목록 조회 실패" }, { status: 500 });
  }
}

// 모델 추가 (Master/Slave/Center 3개 제품 자동 생성)
export async function POST(request: Request) {
  try {
    const { modelName } = await request.json();
    if (!modelName?.trim()) {
      return NextResponse.json({ error: "모델명을 입력하세요." }, { status: 400 });
    }

    const trimmed = modelName.trim();

    const existing = await prisma.product.findFirst({
      where: { modelName: trimmed },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 존재하는 모델명입니다." }, { status: 409 });
    }

    await prisma.product.createMany({
      data: VARIANTS.map((variant) => ({ modelName: trimmed, variant })),
    });

    return NextResponse.json({ modelName: trimmed }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "모델 추가 실패" }, { status: 500 });
  }
}
