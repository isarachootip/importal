import { PrismaClient, RoleCode } from "@prisma/client";

interface SeedUserDef {
  email: string;
  name: string;
  thaiName: string;
  nickname: string;
  isHeadImport?: boolean;
  roles: RoleCode[];
}

const USERS: SeedUserDef[] = [
  { email: "thiranun@chg.co.th", name: "Thiranun", thaiName: "K.หมู (Thiranun)", nickname: "K.หมู", isHeadImport: true, roles: ["IMPORT"] },
  { email: "kawaree@chg.co.th", name: "Kawaree", thaiName: "K.กุ้ยลี่ (Kawaree)", nickname: "K.กุ้ยลี่", isHeadImport: true, roles: ["IMPORT"] },
  { email: "naparat@chg.co.th", name: "Naparat", thaiName: "K.กิ่ง (Naparat)", nickname: "K.กิ่ง", isHeadImport: true, roles: ["IMPORT"] },
  { email: "dusit@chg.co.th", name: "Dusit", thaiName: "K.เบิ้ล (Dusit)", nickname: "K.เบิ้ล", isHeadImport: true, roles: ["IMPORT", "GM"] },
  { email: "mer@chg.co.th", name: "Merchandiser", thaiName: "K.เมย์ (MER)", nickname: "MER", roles: ["MER"] },
  { email: "gd@chg.co.th", name: "Graphic Design", thaiName: "ทีม Graphic Design", nickname: "GD", roles: ["GD"] },
  { email: "gm@chg.co.th", name: "GM Merchandising", thaiName: "GM Merchandising", nickname: "GM", roles: ["GM"] },
  { email: "vp@chg.co.th", name: "VP Merchandising", thaiName: "VP Merchandising", nickname: "VP", roles: ["VP"] },
  { email: "BhChodok@chg.co.th", name: "Chodok", thaiName: "K.Chodok (EVP)", nickname: "K.Chodok", roles: ["EVP", "VP"] },
  { email: "UaWarunee@chg.co.th", name: "Warunee", thaiName: "K.Warunee (EVP)", nickname: "K.Warunee", roles: ["EVP", "VP"] },
  { email: "vendor@factory.cn", name: "Ningbo Homeware Rep", thaiName: "Vendor โรงงาน", nickname: "Vendor", roles: ["VENDOR"] },
  { email: "ops@forwarder.co.th", name: "Siam Freight Ops", thaiName: "Forwarder", nickname: "Forwarder", roles: ["FORWARDER"] },
  { email: "admin@chg.co.th", name: "System Admin", thaiName: "ผู้ดูแลระบบ", nickname: "Admin", roles: ["ADMIN", "IMPORT"] },
];

const BRAND_GROUPS: Array<{ ownerEmail: string | null; groupName: string; brands: string[] }> = [
  { ownerEmail: "thiranun@chg.co.th", groupName: "House Brand", brands: ["Kassa", "Luzio", "Italuce"] },
  {
    ownerEmail: "kawaree@chg.co.th",
    groupName: "House Brand",
    brands: ["Workon", "Gianttech", "Giant Kingkong", "Giant Kingkong Pro", "Calina", "Fonte", "Karten", "Verezzo"],
  },
  {
    ownerEmail: "naparat@chg.co.th",
    groupName: "House Brand",
    brands: ["Kassa Home", "Kassa Hotel", "Murano", "Fugo", "Wippy", "Cuna", "Zagio"],
  },
  { ownerEmail: null, groupName: "Power Buy", brands: ["Mamaru", "Smart", "Krafte", "One Best"] },
];

const SUBCLASSES = [
  { code: "SC-01", nameTh: "ถังขยะและอุปกรณ์ทำความสะอาด", nameEn: "Bins & Cleaning" },
  { code: "SC-02", nameTh: "โคมไฟและแสงสว่าง", nameEn: "Lighting" },
  { code: "SC-03", nameTh: "เครื่องมือช่างและฮาร์ดแวร์", nameEn: "Tools & Hardware" },
  { code: "SC-04", nameTh: "เครื่องใช้ไฟฟ้าขนาดเล็ก", nameEn: "Small Appliances" },
  { code: "SC-05", nameTh: "อุปกรณ์จัดเก็บและแขวน", nameEn: "Storage & Organizers" },
  { code: "SC-06", nameTh: "เครื่องครัวและโต๊ะอาหาร", nameEn: "Kitchen & Dining" },
];

const VENDORS = [
  { code: "VND-NBH", name: "Ningbo Homeware Co., Ltd.", country: "CN", brandNames: ["Kassa Home", "Fugo", "Karten"] },
  { code: "VND-SZL", name: "Shenzhen Lumina Lighting Ltd.", country: "CN", brandNames: ["Luzio", "Italuce"] },
  { code: "VND-HZP", name: "Hangzhou ProTools Industrial Co.", country: "CN", brandNames: ["Workon", "Gianttech", "Giant Kingkong"] },
  { code: "VND-FSC", name: "Foshan Ceramic Craft Co., Ltd.", country: "CN", brandNames: ["Murano", "Calina", "Kassa"] },
  { code: "VND-GDA", name: "Guangdong Smart Appliance Co.", country: "CN", brandNames: ["Smart", "Mamaru"] },
];

function slugifyCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export async function seedUsersAndBrands(prisma: PrismaClient) {
  const userByEmail = new Map<string, string>();

  for (const u of USERS) {
    const record = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, thaiName: u.thaiName, nickname: u.nickname, isHeadImport: Boolean(u.isHeadImport) },
      create: { email: u.email, name: u.name, thaiName: u.thaiName, nickname: u.nickname, isHeadImport: Boolean(u.isHeadImport) },
    });
    userByEmail.set(u.email, record.id);

    for (const role of u.roles) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: record.id, role } },
        update: {},
        create: { userId: record.id, role },
      });
    }
  }

  const brandByName = new Map<string, string>();
  for (const group of BRAND_GROUPS) {
    const ownerId = group.ownerEmail ? (userByEmail.get(group.ownerEmail) ?? null) : null;
    for (const brandName of group.brands) {
      const brand = await prisma.brand.upsert({
        where: { name: brandName },
        update: { groupName: group.groupName, ownerId },
        create: { code: slugifyCode(brandName), name: brandName, groupName: group.groupName, ownerId },
      });
      brandByName.set(brandName, brand.id);
    }
  }

  const subclassByCode = new Map<string, string>();
  for (const sc of SUBCLASSES) {
    const rec = await prisma.productSubclass.upsert({
      where: { code: sc.code },
      update: { nameTh: sc.nameTh, nameEn: sc.nameEn },
      create: sc,
    });
    subclassByCode.set(sc.code, rec.id);
  }

  const vendorByCode = new Map<string, string>();
  for (const v of VENDORS) {
    const vendor = await prisma.vendorFactory.upsert({
      where: { code: v.code },
      update: { name: v.name, country: v.country },
      create: { code: v.code, name: v.name, country: v.country },
    });
    vendorByCode.set(v.code, vendor.id);

    for (const bName of v.brandNames) {
      const brandId = brandByName.get(bName);
      if (brandId) {
        await prisma.brandVendor.upsert({
          where: { brandId_vendorId: { brandId, vendorId: vendor.id } },
          update: {},
          create: { brandId, vendorId: vendor.id },
        });
      }
    }
  }

  return { userByEmail, brandByName, subclassByCode, vendorByCode };
}
