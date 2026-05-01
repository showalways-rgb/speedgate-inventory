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
  { type: "ADDON", value: "케이블 덕트", order: 1 },
  { type: "ADDON", value: "이동식플레이트(BT-400M)", order: 2 },
  { type: "ADDON", value: "이동식플레이트(BF-400M)", order: 3 },
  { type: "ADDON", value: "Fence(SUS)", order: 4 },
];

const SPEC_OPTIONS = [
  { type: "SPEC", value: "540mm", order: 1 },
  { type: "SPEC", value: "710mm", order: 2 },
  { type: "SPEC", value: "800mm", order: 3 },
  { type: "SPEC", value: "400mm", order: 4 },
  { type: "SPEC", value: "베이스 플레이트, 상판, 방부목 Ass'y", order: 5 },
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
    where: { type: "ADDON", value: "이동식플레이트" },
  });

  for (const opt of [...ADDON_OPTIONS, ...SPEC_OPTIONS]) {
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
