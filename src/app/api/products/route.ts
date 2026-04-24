import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ modelName: "asc" }, { variant: "asc" }],
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "제품 목록 조회 실패" },
      { status: 500 }
    );
  }
}
