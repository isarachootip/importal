export type TrackerRoleKey = "import" | "mdsg" | "evp" | "designer" | "photographer" | "mgmt";
export type OrgLevelCode = "DIV" | "DM" | "GM" | "VP" | "EVP" | "TEAM";

export interface StaffMemberDef {
  email: string;
  fullName: string;
  displayName: string;
  nickname: string;
  jobTitle: string;
  role: TrackerRoleKey;
  orgLevel: OrgLevelCode;
  groupName?: string;
  sdeptCodes: number[];
}

export interface SdeptDef {
  code: number;
  name: string;
  vpGroup: string;
  gmDivision: string;
}

export const DESIGNER_STAFF: StaffMemberDef[] = [
  { email: "SangtNarin@chg.co.th", fullName: "Narin Sangthai", displayName: "คุณพีท", nickname: "คุณพีท", jobTitle: "Design Manager (Designer GM)", role: "designer", orgLevel: "DIV", sdeptCodes: [] },
  { email: "PoTanya@chg.co.th", fullName: "Tanya Poorin", displayName: "คุณอ้อม", nickname: "คุณอ้อม", jobTitle: "Senior Packaging Designer", role: "designer", orgLevel: "DM", sdeptCodes: [] },
  { email: "tophonthep@chg.co.th", fullName: "Phonthep Tomon", displayName: "คุณเบนซ์ (Phonthep)", nickname: "คุณเบนซ์", jobTitle: "Packaging Designer", role: "designer", orgLevel: "DM", sdeptCodes: [] },
  { email: "PhKeerati@chg.co.th", fullName: "Keerati Phonprasert", displayName: "คุณปิงปอง", nickname: "คุณปิงปอง", jobTitle: "Packaging Designer", role: "designer", orgLevel: "DM", sdeptCodes: [] },
  { email: "thteedsanu@chg.co.th", fullName: "Teedsanu Thapanamahakun", displayName: "คุณเบนซ์ (Teedsanu)", nickname: "คุณเบนซ์", jobTitle: "Packaging Designer", role: "designer", orgLevel: "DM", sdeptCodes: [] },
];

export const IMPORT_STAFF: StaffMemberDef[] = [
  { email: "ChThiranun@chg.co.th", fullName: "Thiranun Chiammanchit", displayName: "คุณหมู", nickname: "คุณหมู", jobTitle: "Global Sourcing Sr.Manager (Construction and Home Solution)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "raamonwan@chg.co.th", fullName: "Amonwan Rakau", displayName: "คุณบีม", nickname: "คุณบีม", jobTitle: "Global Sourcing Team Leader (CE&Electrical)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "lenapapath@chg.co.th", fullName: "Napapath Lerdpakdeeporn", displayName: "คุณแคร์", nickname: "คุณแคร์", jobTitle: "Global Sourcing Team Leader (Bathware&Fitting)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "SoNatcha@chg.co.th", fullName: "Natcha Somsawang", displayName: "คุณเอิง", nickname: "คุณเอิง", jobTitle: "Global Sourcing Manager (Floor&Tile)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "SaParanee@chg.co.th", fullName: "Paranee Sakthanachanon", displayName: "คุณแพรว", nickname: "คุณแพรว", jobTitle: "Global Sourcing Manager (Lighting)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "koworrada@chg.co.th", fullName: "Worrada Kongsangbutr", displayName: "คุณองุ่น", nickname: "คุณองุ่น", jobTitle: "Global Sourcing Team Leader (Floor&Tile)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "tepatcharada@chg.co.th", fullName: "Patcharada Techajaruwit", displayName: "คุณพัชรดา (Patcharada)", nickname: "คุณพัชรดา", jobTitle: "Global Sourcing Manager (CE&Electrical)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "ViNaparat@chg.co.th", fullName: "Naparat Vichienprakarn", displayName: "คุณกิ่ง", nickname: "คุณกิ่ง", jobTitle: "Global Sourcing Sr.Manager (Household & Home Furnishing)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "kaarnakorn@chg.co.th", fullName: "Arnakorn Kantubtim", displayName: "คุณใหม่", nickname: "คุณใหม่", jobTitle: "Global Sourcing Manager (Fashion & Beauty, Home Dec.)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "ChuChidapha@chg.co.th", fullName: "Chidapha Chumsaeng", displayName: "คุณออย", nickname: "คุณออย", jobTitle: "Global Sourcing Team Leader (Home Dec., Toy, Sport)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "PoPattarapan@chg.co.th", fullName: "Pattarapan Potising", displayName: "คุณตาล", nickname: "คุณตาล", jobTitle: "Global Sourcing Manager (Houseware&Dining Ware)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "RoPiyaorn@chg.co.th", fullName: "Piyaorn Rojkitpanyakul", displayName: "คุณเก๋ (Piyaorn)", nickname: "คุณเก๋", jobTitle: "Global Sourcing Manager (Toy, Sport, Office supplies)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "BoSunisa@chg.co.th", fullName: "Sunisa Boriboon", displayName: "คุณตุ๊ก", nickname: "คุณตุ๊ก", jobTitle: "Global Sourcing Manager (Home Decorative & festive)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "chwarumporn@chg.co.th", fullName: "Warumporn Chanchamchoi", displayName: "คุณหวานเย็น", nickname: "คุณหวานเย็น", jobTitle: "Global Sourcing Team Leader (Houseware & Dining ware)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "ChKawaree@chg.co.th", fullName: "Kawaree Chaloenlap", displayName: "คุณเก๋ (Kawaree)", nickname: "คุณเก๋", jobTitle: "Global Sourcing Sr.Manager (Home Fur, Gardening & Hardware)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "TaKanitha@chg.co.th", fullName: "Kanitha Tangpongthiti", displayName: "คุณนิด", nickname: "คุณนิด", jobTitle: "Global Sourcing Manager (Tools)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "chkusuma@chg.co.th", fullName: "Kusuma Chanthawong", displayName: "คุณปุ้มปุ้ย", nickname: "คุณปุ้มปุ้ย", jobTitle: "Global Sourcing Team Leader (Furniture&Garden)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "prnutsinee@chg.co.th", fullName: "Nutsinee Preechasanongkit", displayName: "คุณเฟิร์น", nickname: "คุณเฟิร์น", jobTitle: "Global Sourcing Team Leader (Hardware&Tools)", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "SoPanrawee@chg.co.th", fullName: "Panrawee Songsuwan", displayName: "ชมพู่", nickname: "ชมพู่", jobTitle: "Global Sourcing Manager (Indoor Furniture)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "pothanyarin@chg.co.th", fullName: "Thanyarin Pornjiratikarn", displayName: "คุณอาร์ต", nickname: "คุณอาร์ต", jobTitle: "Global Sourcing Manager (Building Material)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "PiWaraporn@chg.co.th", fullName: "Waraporn Pitaktewa", displayName: "คุณแก้ว", nickname: "คุณแก้ว", jobTitle: "Global Sourcing Manager (Hardware)", role: "import", orgLevel: "DIV", sdeptCodes: [] },
  { email: "imp.aom@chg.co.th", fullName: "Import Aom", displayName: "คุณอ้อม (Import)", nickname: "คุณอ้อม", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.maybe@chg.co.th", fullName: "Import Maybe", displayName: "คุณเมบี", nickname: "คุณเมบี", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.koy@chg.co.th", fullName: "Import Koy", displayName: "คุณก้อย", nickname: "คุณก้อย", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.ben@chg.co.th", fullName: "Import Ben", displayName: "คุณเบญ", nickname: "คุณเบญ", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.dear@chg.co.th", fullName: "Import Dear", displayName: "คุณเดียร์", nickname: "คุณเดียร์", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.may@chg.co.th", fullName: "Import May", displayName: "คุณเมย์", nickname: "คุณเมย์", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.arm@chg.co.th", fullName: "Import Arm", displayName: "อาร์ม", nickname: "อาร์ม", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.bart@chg.co.th", fullName: "Import Bart", displayName: "คุณบาร์ท", nickname: "คุณบาร์ท", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "imp.baitong@chg.co.th", fullName: "Import Baitong", displayName: "คุณใบตอง", nickname: "คุณใบตอง", jobTitle: "Global Sourcing Officer", role: "import", orgLevel: "DM", sdeptCodes: [] },
  { email: "dusit@chg.co.th", fullName: "Dusit", displayName: "คุณเบิ้ล", nickname: "คุณเบิ้ล", jobTitle: "Global Sourcing Sr.Manager", role: "import", orgLevel: "DIV", sdeptCodes: [] },
];

export const SPECIAL_STAFF: StaffMemberDef[] = [
  { email: "BhChodok@chg.co.th", fullName: "Chodok (EVP MDSG)", displayName: "K.Chodok (EVP)", nickname: "คุณต้า", jobTitle: "EVP Merchandising", role: "evp", orgLevel: "EVP", sdeptCodes: [] },
  { email: "photo@chg.co.th", fullName: "Photo Studio Team", displayName: "Photo Team", nickname: "Photo Team", jobTitle: "Product Photographer", role: "photographer", orgLevel: "TEAM", sdeptCodes: [] },
  { email: "mgmt@chg.co.th", fullName: "Executive Management", displayName: "Management", nickname: "Management", jobTitle: "Executive Management", role: "mgmt", orgLevel: "EVP", sdeptCodes: [] },
];

export const SDEPT_MASTER: SdeptDef[] = [
  { code: 102, name: "Door Material", vpGroup: "Construction", gmDivision: "01 Building Décor" },
  { code: 116, name: "Floor & Wall Decorative Panel", vpGroup: "Construction", gmDivision: "01 Building Décor" },
  { code: 203, name: "Paint", vpGroup: "Construction", gmDivision: "01 Building Décor" },
  { code: 109, name: "Material", vpGroup: "Construction", gmDivision: "02 Building Foundation" },
  { code: 111, name: "Block", vpGroup: "Construction", gmDivision: "02 Building Foundation" },
  { code: 113, name: "Steel Material", vpGroup: "Construction", gmDivision: "02 Building Foundation" },
  { code: 101, name: "Sheet / Board", vpGroup: "Construction", gmDivision: "03 Roofing & Sheet Board" },
  { code: 108, name: "Roofing", vpGroup: "Construction", gmDivision: "03 Roofing & Sheet Board" },
  { code: 110, name: "Gypsum Insulation & Frame", vpGroup: "Construction", gmDivision: "03 Roofing & Sheet Board" },
  { code: 104, name: "Hardware", vpGroup: "System", gmDivision: "04 Hardware & Tools" },
  { code: 105, name: "Door Hardware", vpGroup: "System", gmDivision: "04 Hardware & Tools" },
  { code: 106, name: "Tools", vpGroup: "System", gmDivision: "04 Hardware & Tools" },
  { code: 107, name: "Automotive", vpGroup: "System", gmDivision: "05 Hardware & Tools" },
  { code: 201, name: "Lighting", vpGroup: "System", gmDivision: "05 Electrical & Lighting" },
  { code: 202, name: "Electrical", vpGroup: "System", gmDivision: "05 Electrical & Lighting" },
  { code: 408, name: "Air Conditioner", vpGroup: "Finishing", gmDivision: "06 Home CE" },
  { code: 411, name: "Fan", vpGroup: "Finishing", gmDivision: "06 Home CE" },
  { code: 409, name: "Small Appliances", vpGroup: "Finishing", gmDivision: "06 Home CE" },
  { code: 412, name: "Refrigerators", vpGroup: "Finishing", gmDivision: "06 Home CE" },
  { code: 413, name: "Washing Machine", vpGroup: "Finishing", gmDivision: "06 Home CE" },
  { code: 410, name: "AV", vpGroup: "Finishing", gmDivision: "06 Home CE" },
  { code: 114, name: "Pipe", vpGroup: "Finishing", gmDivision: "07 Plumbing & Agriculture" },
  { code: 406, name: "Agriculture", vpGroup: "Finishing", gmDivision: "07 Plumbing & Agriculture" },
  { code: 204, name: "Pump & Tank", vpGroup: "Finishing", gmDivision: "07 Plumbing & Agriculture" },
  { code: 205, name: "Water Heater / Water Purifier / Valve", vpGroup: "Finishing", gmDivision: "07 Plumbing & Agriculture" },
  { code: 401, name: "Furniture and Outdoor Recreation", vpGroup: "Finishing", gmDivision: "07 Plumbing & Agriculture" },
  { code: 301, name: "Bath Ware", vpGroup: "Projects", gmDivision: "09 Bath & Tile" },
  { code: 302, name: "Bath Fitting", vpGroup: "Projects", gmDivision: "09 Bath & Tile" },
  { code: 306, name: "Floor&Tile", vpGroup: "Projects", gmDivision: "09 Bath & Tile" },
  { code: 307, name: "Laminate/Solid Wood", vpGroup: "Projects", gmDivision: "09 Bath & Tile" },
  { code: 303, name: "Kitchen Appliances/Sinks", vpGroup: "Projects", gmDivision: "10 Kitchen App & Fur" },
  { code: 304, name: "Kitchen Furnitures", vpGroup: "Projects", gmDivision: "10 Kitchen App & Fur" },
  { code: 405, name: "Cleaning & Laundry", vpGroup: "Décor", gmDivision: "11 Houseware & Home Organization" },
  { code: 905, name: "Containers & Organizer", vpGroup: "Décor", gmDivision: "11 Houseware & Home Organization" },
  { code: 807, name: "Household Chemical", vpGroup: "Décor", gmDivision: "11 Houseware & Home Organization" },
  { code: 407, name: "Kitchenware", vpGroup: "Décor", gmDivision: "11 Houseware & Home Organization" },
  { code: 906, name: "Diningware", vpGroup: "Décor", gmDivision: "11 Houseware & Home Organization" },
  { code: 804, name: "Beverage", vpGroup: "Décor", gmDivision: "11 Houseware & Home Organization" },
  { code: 808, name: "OTOP & Community Products", vpGroup: "Décor", gmDivision: "11 Houseware & Home Organization" },
  { code: 402, name: "Bedding", vpGroup: "Décor", gmDivision: "12 Home Textiles & Decor" },
  { code: 902, name: "Bed Linen & Blanket", vpGroup: "Décor", gmDivision: "12 Home Textiles & Decor" },
  { code: 904, name: "Floor & Wall Decorative", vpGroup: "Décor", gmDivision: "12 Home Textiles & Decor" },
  { code: 903, name: "Towel", vpGroup: "Décor", gmDivision: "12 Home Textiles & Decor" },
  { code: 907, name: "Decorative & Gift", vpGroup: "Décor", gmDivision: "12 Home Textiles & Decor" },
];
