import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = Number(searchParams.get("categoryId"));
  if (!categoryId) return NextResponse.json([]);
  const subs = await prisma.subcategory.findMany({
    where: { categoryId },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(subs);
}
