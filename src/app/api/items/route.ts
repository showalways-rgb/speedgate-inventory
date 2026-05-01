import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subcategoryId = Number(searchParams.get("subcategoryId"));
  if (!subcategoryId) return NextResponse.json([]);
  const items = await prisma.item.findMany({
    where: { subcategoryId },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { name, subcategoryId } = await req.json();
  if (!name || !subcategoryId) {
    return NextResponse.json({ error: "name, subcategoryId 필수" }, { status: 400 });
  }
  const item = await prisma.item.create({
    data: { name, unit: "EA", subcategoryId: Number(subcategoryId) },
  });
  return NextResponse.json(item, { status: 201 });
}
