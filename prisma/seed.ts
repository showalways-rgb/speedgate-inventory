import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_DATA = [
  {
    category: "GATE",
    subcategories: [
      {
        name: "Turnstile",
        items: ["BT-400", "BT-400M", "BT-500", "BT-500 Dummy"],
      },
      {
        name: "Flap",
        items: [
          "BF-400 Master", "BF-400 Slave", "BF-400 Center", "BF-400M",
          "BF-500 Master", "BF-500 Slave", "BF-500 Center",
          "SBTL7000 Master", "SBTL7000 Slave", "SBTL7000 Center",
        ],
      },
      {
        name: "전신게이트",
        items: ["FHT2300D"],
      },
    ],
  },
  {
    category: "단말기",
    subcategories: [
      {
        name: "안면인식",
        items: [
          "SPEEDFACE-V3L", "SPEEDFACE-V3L-QR",
          "SPEEDFACE-V5L", "SPEEDFACE-V5L-MF", "SPEEDFACE-V5L-RFID", "SPEEDFACE-V5L-QR",
          "SenseFace 4A", "Ubio X Face SC [13.56Mhz]", "Ubio X Face Pro",
        ],
      },
      {
        name: "지문인식",
        items: [
          "AC-5000IK SC", "AC-2200 RF(125Khz)", "AC-2100 PLUS[13.56Mhz]",
          "AC-2100 SC", "AC-2200 SC", "AC-1100 RF", "AC-2200 RF",
        ],
      },
      {
        name: "RFID",
        items: [],
      },
    ],
  },
  {
    category: "쉼터",
    subcategories: [
      {
        name: "",
        items: ["구급상자", "냉장고", "접이식의자", "접이식테이블", "제세동기", "체온계", "혈압계", "헬스ID"],
      },
    ],
  },
];

const ADDON_OPTIONS = [
  { type: "ADDON", value: "케이블덕트(BT-400용_710mm)", order: 1 },
  { type: "ADDON", value: "케이블덕트(BT-500용_540mm)", order: 2 },
  { type: "ADDON", value: "케이블덕트(BF-400용_800mm)", order: 3 },
  { type: "ADDON", value: "이동식플레이트(BT-400M)", order: 4 },
  { type: "ADDON", value: "이동식플레이트(BF-400M)", order: 5 },
  { type: "ADDON", value: "Fence(SUS)", order: 6 },
];

async function main() {
  console.log("Seeding...");

  for (const { category, subcategories } of SEED_DATA) {
    const cat = await prisma.category.upsert({
      where: { name: category },
      update: {},
      create: { name: category },
    });

    for (const { name: subName, items } of subcategories) {
      const sub = await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: cat.id, name: subName } },
        update: {},
        create: { name: subName, categoryId: cat.id },
      });

      for (const itemName of items) {
        await prisma.item.upsert({
          where: { name: itemName },
          update: {},
          create: { name: itemName, unit: "EA", subcategoryId: sub.id },
        });
      }
    }
  }

  await prisma.addonOption.deleteMany({
    where: {
      type: "ADDON",
      OR: [{ value: "케이블 덕트" }, { value: "이동식플레이트" }],
    },
  });

  /** 구 단일 품목명 「이동식플레이트」만 삭제(BT/BF별 품목·옵션은 유지) */
  const orphanPlate = await prisma.item.findMany({
    where: { name: "이동식플레이트" },
    select: { id: true },
  });
  const orphanIds = orphanPlate.map((i) => i.id);
  if (orphanIds.length > 0) {
    await prisma.counter.deleteMany({ where: { itemId: { in: orphanIds } } });
    await prisma.transaction.deleteMany({ where: { itemId: { in: orphanIds } } });
    await prisma.item.deleteMany({ where: { id: { in: orphanIds } } });
    console.log(`Deleted legacy Item "이동식플레이트" (${orphanIds.length}) and counters/transactions.`);
  }

  for (const opt of ADDON_OPTIONS) {
    await prisma.addonOption.upsert({
      where: { type_value: { type: opt.type, value: opt.value } },
      update: { order: opt.order },
      create: opt,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
