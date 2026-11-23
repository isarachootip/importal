import { PrismaClient } from "@prisma/client";

// ประกาศ ที่ HRP-2606 เรื่อง วันหยุดตามประเพณี ประจำปี 2570 (ค.ศ. 2027) สำหรับพนักงานสำนักงาน (14 วัน)
const HOLIDAYS_2570: Array<{ date: string; nameTh: string; isSubstitute?: boolean }> = [
  { date: "2027-01-01", nameTh: "วันขึ้นปีใหม่" },
  { date: "2027-04-06", nameTh: "วันจักรี" },
  { date: "2027-04-13", nameTh: "วันสงกรานต์" },
  { date: "2027-04-14", nameTh: "วันสงกรานต์" },
  { date: "2027-05-03", nameTh: "ชดเชยวันแรงงานแห่งชาติ (วันเสาร์ที่ 1 พฤษภาคม 2570)", isSubstitute: true },
  { date: "2027-05-04", nameTh: "วันฉัตรมงคล" },
  { date: "2027-05-20", nameTh: "วันวิสาขบูชา" },
  { date: "2027-06-03", nameTh: "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดา พัชรสุธาพิมลลักษณ พระบรมราชินี" },
  { date: "2027-07-28", nameTh: "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว" },
  { date: "2027-08-12", nameTh: "วันคล้ายวันพระราชสมภพสมเด็จพระนางเจ้าสิริกิติ์ฯ และวันแม่แห่งชาติ" },
  { date: "2027-10-13", nameTh: "วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศรฯ" },
  { date: "2027-10-25", nameTh: "ชดเชยวันปิยมหาราช (วันเสาร์ที่ 23 ตุลาคม 2570)", isSubstitute: true },
  { date: "2027-12-06", nameTh: "ชดเชยวันชาติและวันพ่อแห่งชาติ (วันอาทิตย์ที่ 5 ธันวาคม 2570)", isSubstitute: true },
  { date: "2027-12-31", nameTh: "วันสิ้นปี" },
];

export async function seedHolidays(prisma: PrismaClient) {
  for (const h of HOLIDAYS_2570) {
    const dt = new Date(`${h.date}T00:00:00.000Z`);
    await prisma.companyHoliday.upsert({
      where: { date: dt },
      update: {
        yearBE: 2570,
        nameTh: h.nameTh,
        isSubstitute: Boolean(h.isSubstitute),
        announcementRef: "HRP-2606",
      },
      create: {
        date: dt,
        yearBE: 2570,
        nameTh: h.nameTh,
        isSubstitute: Boolean(h.isSubstitute),
        announcementRef: "HRP-2606",
      },
    });
  }
}
