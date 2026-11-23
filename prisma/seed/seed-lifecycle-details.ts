import type { PrismaClient } from "@prisma/client";

export async function seedLifecycleDetails(prisma: PrismaClient) {
  const sourcingCase = await prisma.importCase.findUnique({
    where: { caseCode: "IP-2026-018" },
    include: { quotations: { select: { id: true } } },
  });

  if (sourcingCase && sourcingCase.quotations.length === 0) {
    await prisma.sourcingQuotation.createMany({
      data: [
        {
          caseId: sourcingCase.id,
          vendorName: "Hangzhou Precision Tools Co., Ltd.",
          unitPrice: 18.5,
          currency: "USD",
          moq: 500,
          leadTimeDays: 45,
          incoterm: "FOB",
          notes: "มอเตอร์ทองแดงแท้ 100%, รับประกัน 1 ปี, ผ่านมาตรฐาน มอก.",
          isSelected: true,
        },
        {
          caseId: sourcingCase.id,
          vendorName: "Foshan Industrial Fan Mfg.",
          unitPrice: 17.8,
          currency: "USD",
          moq: 1000,
          leadTimeDays: 55,
          incoterm: "FOB",
          notes: "ราคาต่ำสุดแต่ MOQ สูงและ Lead Time นานกว่า 10 วัน",
          isSelected: false,
        },
        {
          caseId: sourcingCase.id,
          vendorName: "Ningbo Electric Appliances Ltd.",
          unitPrice: 19.2,
          currency: "USD",
          moq: 300,
          leadTimeDays: 35,
          incoterm: "CIF",
          notes: "MOQ ต่ำ ส่งเร็ว แต่ราคาต่อหน่วยสูงกว่า",
          isSelected: false,
        },
      ],
    });
  }

  await prisma.importCase.updateMany({
    where: { caseCode: "IP-2026-015", poNumber: null },
    data: {
      poNumber: "PO-2026-SMT-015",
      poTotalAmount: 42500,
      poCurrency: "USD",
      incoterm: "FOB",
    },
  });

  await prisma.importCase.updateMany({
    where: { caseCode: "IP-2026-010", poNumber: null },
    data: {
      poNumber: "PO-2026-KRT-010",
      poTotalAmount: 18900,
      poCurrency: "USD",
      incoterm: "FOB",
      poActualEnd: new Date("2026-10-08T00:00:00.000Z"),
    },
  });

  await prisma.importCase.updateMany({
    where: { caseCode: "IP-2026-004", blOrAwbNumber: null },
    data: {
      poNumber: "PO-2026-KHT-004",
      poTotalAmount: 31200,
      poCurrency: "USD",
      incoterm: "FOB",
      shippingMode: "SEA_FCL",
      forwarderName: "COSCO Shipping Lines",
      blOrAwbNumber: "COSU6348192010",
      containerNumber: "CBHU8921045",
      etd: new Date("2026-11-15T00:00:00.000Z"),
      eta: new Date("2026-11-28T00:00:00.000Z"),
      poActualEnd: new Date("2026-09-02T00:00:00.000Z"),
      prodActualEnd: new Date("2026-11-05T00:00:00.000Z"),
    },
  });
}
