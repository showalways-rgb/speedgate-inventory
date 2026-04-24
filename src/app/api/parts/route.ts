import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(parts);
  } catch {
    return NextResponse.json({ error: "부품 목록 조회 실패" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, unit } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "부품명을 입력하세요." }, { status: 400 });
    }
    const existing = await prisma.part.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: "이미 존재하는 부품명입니다." }, { status: 409 });
    }
    const part = await prisma.part.create({
      data: { name: name.trim(), unit: unit?.trim() || "EA" },
    });
    return NextResponse.json(part, { status: 201 });
  } catch {
    return NextResponse.json({ error: "부품 추가 실패" }, { status: 500 });
  }
}
