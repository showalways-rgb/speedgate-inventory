import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.counter.deleteMany();
  await prisma.transaction.deleteMany();
  return NextResponse.json({ success: true });
}
