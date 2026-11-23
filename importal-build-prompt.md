# Prompt: Build Importal — ระบบ Import + Packaging Design Workflow

คุณคือ senior full-stack engineer ช่วยสร้างเว็บแอป **Importal** สำหรับทีม Import ของบริษัทค้าปลีก (นำเข้าสินค้า House Brand จากจีน → ไทย) ให้ใช้งานได้จริงบน production ทำงานเป็นเฟส ทุกเฟสต้องรันได้ มี test และ seed data ก่อนไปเฟสถัดไป

ต้นแบบ UI/flow ที่ผ่านการคุยแล้ว: https://claude.ai/artifact/HoVeZVb5YvckNn9hMWvYnK (ใช้เป็น reference เรื่องหน้าจอและ flow ไม่ต้อง copy โค้ด)

---

## 1. Tech stack (แก้ได้ถ้าทีมมีมาตรฐานอื่น)
- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma (migration + seed)
- Auth: login ด้วย email บริษัท (@chg.co.th) ผ่าน Microsoft Entra ID / Google SSO; มีโหมด dev login เลือก role ได้
- File storage: S3-compatible (MinIO ตอน dev)
- Background jobs: แจ้งเตือนอีเมล + เช็คงานเลยกำหนดทุกเช้า 08:00 (Asia/Bangkok)
- UI ภาษาไทยเป็นหลัก ฟอนต์ IBM Plex Sans Thai, วันที่แสดง dd/mm/yy, timezone Asia/Bangkok
- Docker Compose สำหรับ dev (app + postgres + minio + mailpit)

## 2. บทบาทผู้ใช้ (Roles)
| Role | หน้าที่ |
|---|---|
| Import | เจ้าของ case: สร้าง case, ลงทะเบียน PI, กรอกข้อมูลสินค้า, ตรวจ Proof, ตรวจรับสินค้า |
| MER (Merchandiser) | ตรวจ Proof แต่ละ Draft |
| GD (Graphic Design) | รับ Brief, ทำ Artwork, แก้งาน, ส่งขออนุมัติ |
| GM | อนุมัติ offer, อนุมัติ PO, ตรวจ Proof, ตรวจงานแก้ของ GD, อนุมัติ Final |
| VP (K.Chodok) | ตรวจ Proof, อนุมัติแบบ Final |
| Vendor | ส่ง quotation, ยืนยัน PO, อัปเดตการผลิต (ระยะแรกให้ Import กรอกแทนได้) |
| Forwarder | อัปเดตข้อมูลขนส่ง (ระยะแรกให้ Import กรอกแทนได้) |
| Admin | จัดการ master data, ผู้ใช้, วันหยุด |

ผู้ใช้หนึ่งคนมีได้หลาย role, Import แต่ละคนผูกกับ Brand ที่รับผิดชอบ

## 3. Workflow หลักของ Import Case (state machine)
แต่ละ case เดิน 5 ขั้น + ปิดงาน ทุกการเปลี่ยนสถานะต้องเช็คสิทธิ์ role และบันทึก event log

1. **Sourcing & Offer** (แผน 10 วันปฏิทิน): Draft → RFQ Sent → Quote Received → Negotiating → Offer Selected → [GM อนุมัติ offer | ให้เจรจาต่อ → กลับ Negotiating]
   - ตารางเปรียบเทียบ quotation: vendor, ราคา/หน่วย, สกุลเงิน, MOQ, lead time, Incoterm; ต้องเลือก 1 รายการก่อนขออนุมัติ
2. **PI & Packaging Design**: ดูข้อ 4 (แผนตาม Case, นับวันทำการ)
3. **Purchase Order** (5 วัน): PO Draft → [GM อนุมัติ PO | ตีกลับ] → PO Sent → [Vendor ยืนยัน | ขอแก้ → กลับ PO Draft]
4. **Production (MTO)** (55 วัน): PO Accepted → Deposit Paid → Material Prep → In Production → QC Inspection → [Import: QC ผ่าน | QC ไม่ผ่าน → กลับ In Production] → Ready to Ship
5. **Inspection & Logistic** (20 วัน): Booked → Export Cleared (CN) → Departed → Arrived TH → Customs Cleared (TH) → Delivered to WH → [Import ตรวจรับครบ → ปิด case | ของไม่ครบ/เสียหาย]
   - ฟิลด์: รูปแบบขนส่ง, forwarder, B/L/AWB, เลขตู้, ETD, ETA; แนบเอกสาร CI, PL, B/L, Form E, ใบขนสินค้าขาเข้า

ขั้น 3–5 นับวันปฏิทิน, แผนแต่ละขั้นเริ่มจากวันจบจริงของขั้นก่อน (ถ้ายังไม่จบใช้วันตามแผน)

## 4. Packaging Design Workflow (หัวใจของระบบ)

### 4.1 ขั้นย่อยและลำดับผู้อนุมัติ
| Key | ขั้น | ลำดับผู้ทำ/อนุมัติ (ต้องเรียงตามลำดับ) | ปุ่มขอแก้ |
|---|---|---|---|
| info | ลงทะเบียน PI & ข้อมูลสินค้า | Import | – |
| brief | Brief Design & กำหนดประเภทงาน | Import (ยืนยัน Brief) → GD (รับงาน/ดาวน์โหลดไฟล์) | – |
| aw | GD จัดทำ Artwork (Draft 1) | GD (ส่ง Draft 1) | – |
| p1/p2/p3 | Proof Draft N | Import → MER → GM → VP | ทุกคนในลำดับ → ไป rN |
| r1/r2/r3 | GD Revise Draft N | GD (ส่งงานแก้) → GM (ตรวจผ่าน) | GM → กลับ GD |
| final | Final Approved | GD (ส่งขออนุมัติ) → GM → VP K.Chodok | GM/VP → ไป rfinal |
| rfinal | Revise Final | GD → กลับ final ที่ GM | – |

การเปลี่ยนขั้น:
- info → brief: ต้องมีเลข PI และติ๊ก checklist ครบ 9 ข้อ (ข้อ 4.4)
- brief → aw (หรือ → final ถ้าเป็น Case 1 No Change AW): ต้องเลือกรูปแบบ Packaging ≥ 1
- aw → p1
- pN อนุมัติครบทุกคน → final (ข้ามได้เลย ไม่ต้องรอ Draft ถัดไป)
- pN ถูกขอแก้ → rN → (N<3 ? p(N+1) : final)
- final อนุมัติครบ → จบขั้น Packaging, ไปขั้น PO
- ทุก Draft แนบไฟล์ Artwork (PDF/AI/JPG) เป็นเวอร์ชัน, ผู้ตรวจคอมเมนต์ได้ และต้องใส่เหตุผลเมื่อกดขอแก้

### 4.2 Timeline Status (แสดงบน Packaging Board)
Pending (GD) [info, brief] → On Process [aw] → Sent Draft 1 [p1, r1] → Sent Draft 2 [p2, r2] → Sent Draft 3 [p3, r3] → Done (GM & VP) [final, rfinal] → Approved Final (EVP) [จบแล้ว]

### 4.3 ประเภทงาน (Case) และการคำนวณแผน — **นับวันทำการ** (หักเสาร์-อาทิตย์ + วันหยุดบริษัท)
| Case | Pattern | รายละเอียด | ส่ง Info (วัน) | ออกแบบ Draft 1–Final (วัน) |
|---|---|---|---|---|
| 1 | Approval Pattern | No Change AW — SKU เก่า & Pattern ที่ผ่านแล้ว | 2 | 0 |
| 2 | Approval Pattern | Old SKUs & Use approval Pattern | 4 | 15 |
| 3 | Approval Pattern | New SKUs & Use approval Pattern | 9 | 15 |
| 4 | New Pattern | Old SKUs & Design New Pattern | 4 | 25 |
| 5 | New Pattern | New SKUs & Design New Pattern | 9 | 25 |
| 6 | New Pattern | New Pattern Design (ออกแบบใหม่ทั้งหมด) | 14 | 30 |

สูตร:
- `info = ส่ง Info ตาม Case + floor(SKUs/30)×7 + (ถ่ายรูปสินค้าใหม่ ? 7 : 0)`
- `brief = 1`, `final = 1`, `rfinal = 1` (บัฟเฟอร์ ไม่รวมในแผนหลัก)
- วันออกแบบ − 2 กระจายลง aw, p1, r1, p2, r2, p3, r3 ตามน้ำหนัก 7:2:3:2:3:2:3 (ปัดลง ขั้นต่ำ 1 วัน เศษที่เหลือเติมตามลำดับ aw, r1, r2, r3, p1, p2, p3)
- Case 1: path = info → brief → final
- แผนคิดแบบเต็ม 3 Draft (worst case); แสดงทั้งแผนและวันจริงทุกขั้นย่อย
- เก็บค่าทั้งหมดนี้เป็น config ใน DB ให้ Admin แก้ได้ ห้าม hard-code

คำเตือน (แสดงในหน้า case ไม่รวมในแผน): มอก./TISI (> 90 วัน), อย. (> 60 วัน), กระเบื้องจากอินเดีย/จีน (Inspec+Logistic บวกเพิ่ม), New Brand/New Logo ต้องอนุมัติก่อนอนุมัติ PI

กฎ Repeat Order: ถ้าแก้ AW เล็กน้อย (ขยับ font, เพิ่ม drawing dimension, ปรับ icon) ให้ติ๊ก "Minor change" แล้วใช้ Case 1 ได้ ไม่ต้องให้ VP ดูซ้ำ (ให้ Admin เปิด/ปิดกฎนี้ได้)

### 4.4 Checklist ข้อมูลส่ง GD (ต้องครบก่อนออกจาก info)
1. Die-cut AW: ประเภท Packaging / ฝาปิดแบบไหน
2. Pattern ที่ต้องการ (แนบรูปแบบเก่าด้วย)
3. ชื่อสินค้า 2 ภาษา: ไทย, Eng
4. icon 2 ภาษา: ไทย, Eng
5. คุณสมบัติสินค้า / รายละเอียด 2 ภาษา
6. สคบ.: ชื่อ/รุ่น/ขนาด/SKU/Barcode ถูกต้อง
7. Drawing & Dimension
8. Product Photos & Inspiration Images (ตรงกับสินค้าจริง)
9. ชื่อ Series ที่ GM / VP / Head of MDSG อนุมัติแล้ว

ไฟล์แนบขั้น info: File Die-cut, รูปสินค้า, File Dimension, SKU & Barcode (บังคับ), รูปสินค้าจริง (บังคับ)

## 5. Master data (seed จากข้อมูลจริง)
**Brand → ผู้รับผิดชอบ (Import)**
- K.หมู (Thiranun): Kassa, Luzio, Italuce
- K.กุ้ยลี่ (Kawaree): Workon, Gianttech, Giant Kingkong, Giant Kingkong Pro, Calina, Fonte, Karten, Verezzo
- K.กิ่ง (Naparat): Kassa Home, Kassa Hotel, Murano, Fugo, Wippy, Cuna, Zagio
- Power Buy (ยังไม่ระบุผู้ดูแล): Mamaru, Smart, Krafte, One Best
- Head Import: K.หมู, K.กุ้ยลี่, K.กิ่ง, K.เบิ้ล (Dusit)

**รูปแบบ Packaging (เลือกได้หลายรายการ)**: Box (กล่องสี), Box (กล่องขาว), Box (กล่องน้ำตาล), Bag (ถุง), Insert Card, Sticker Label, Washing Label (ป้ายผ้า), Hang Tag, Header Card, Sticker QR TISI งานมอก., Sticker (Products & Inspiration), Edit Text, Edit Color, Edit Text & Color, Laser, Screen, Manual (คู่มือ), ใบรับประกันสินค้า (Warranty)

**ผู้อนุมัติ Final**: BhChodok@chg.co.th, UaWarunee@chg.co.th

**วันหยุดบริษัท 2570** (ประกาศ HRP-2606): 1 ม.ค., 6 เม.ย., 13–14 เม.ย., 3 พ.ค. (ชดเชย), 4 พ.ค., 20 พ.ค., 3 มิ.ย., 28 ก.ค., 12 ส.ค., 13 ต.ค., 25 ต.ค. (ชดเชย), 6 ธ.ค. (ชดเชย), 31 ธ.ค. — Admin เพิ่ม/ลบ/นำเข้าจาก CSV ได้

**Contact โรงงานตาม Brand**: สร้างตาราง vendor/factory ผูกกับ Brand (ข้อมูลยังว่าง)

## 6. หน้าจอ
1. **Dashboard**: KPI (case เปิดอยู่, รอฉันดำเนินการ, ล่าช้า, อยู่ระหว่างออกแบบ Packaging), pipeline kanban ตาม 6 ขั้น, ตาราง "งานที่รอฉัน" และ "ล่าช้ากว่าแผน"
2. **Import Cases**: ตาราง ค้นหา/กรอง (brand, ผู้ดูแล, ขั้น, ล่าช้า), export CSV/Excel
3. **Case detail**: rail 5 ขั้นพร้อมแผน/จริง, แท็บรายขั้น, panel การกระทำตาม role ปัจจุบัน, event log + ช่องบันทึก, แสดงวันถึงคลังตามแผนและ lead time รวม
4. **Packaging panel** (ในหน้า case): ลำดับผู้อนุมัติขั้นปัจจุบัน (ใครเซ็นแล้ว/รอใคร), ตารางขั้นย่อยพร้อมจำนวนวัน แผน จริง และป้ายล่าช้า, ฟอร์ม PI (เลข PI, วันที่, brand → ผู้ดูแลอัตโนมัติ, SKUs, vendor, flag รูปใหม่/มอก./อย./กระเบื้อง), เลือก Case + รูปแบบ Packaging, checklist 9 ข้อ, ไฟล์ Artwork ทุกเวอร์ชันพร้อมคอมเมนต์
5. **Packaging Board**: kanban ตาม Timeline Status 7 คอลัมน์ กรองตามผู้ดูแล/brand
6. **Master Data** (Admin): ประเภทงาน + จำนวนวัน, brand/ผู้ดูแล, รูปแบบ Packaging, checklist, วันหยุด, ผู้อนุมัติ, ผู้ใช้และ role

## 7. ข้อกำหนดทั่วไป
- **สิทธิ์**: ปุ่มการกระทำแสดงเฉพาะ role ที่ถึงคิว และตรวจซ้ำฝั่ง server ทุกครั้ง
- **Audit log**: append-only ทุก event (ใคร, role, เวลา, ขั้น, การกระทำ, ค่าก่อน/หลัง, เหตุผล)
- **แจ้งเตือน**: อีเมล + in-app เมื่อถึงคิวตัวเอง, เมื่อถูกขอแก้, และสรุปงานเลยกำหนดทุกเช้า
- **รหัส case**: IP-YYYY-NNN, PI ซ้ำไม่ได้
- **Responsive**: ใช้บนมือถือได้ (ผู้บริหารอนุมัติผ่านมือถือ)
- **Test**: unit test ฟังก์ชันคำนวณวันทำการและแผนแต่ละ Case (เทียบตัวอย่าง: Case 5, 6 SKUs, ถ่ายรูปใหม่ → info 16 วัน, ออกแบบรวม 23 วันกระจาย 8/2/3/2/3/2/3), test state machine ครบทุกทาง (อนุมัติ, ขอแก้, Case 1, Revise Final), e2e (Playwright) flow หลัก 1 case ตั้งแต่สร้างจนปิด
- **Seed**: case ตัวอย่างอย่างน้อย 8 case กระจายทุกขั้น ทุก Timeline Status

## 8. แผนงานเป็นเฟส
1. Setup โปรเจกต์, schema, auth + role, master data + seed
2. Engine คำนวณวันทำการ/แผน + state machine Packaging + test
3. หน้า Case detail + Packaging panel + upload Artwork + event log
4. Dashboard, Packaging Board, Cases list
5. ขั้น Sourcing, PO, Production, Logistic
6. แจ้งเตือน, export, หน้า Master Data, e2e test, Docker สำหรับ deploy

## 9. คำถามที่ยังไม่มีคำตอบ (ทำเป็น config ไว้ก่อน แล้วถามผมเมื่อถึงเฟสที่เกี่ยว)
- Brand กลุ่ม Power Buy และ K.เบิ้ล (Dusit) ใครดูแลอะไร
- อนุมัติ Final โดย VP K.Chodok หรือ EVP
- วันหยุดบริษัทปี 2569
- วงเงินอนุมัติ PO แต่ละระดับ, Incoterm หลัก, Vendor ใช้ portal เองหรือไม่, โหมดขนส่งหลัก

เริ่มจากเฟส 1: เสนอ schema (Prisma) และโครงสร้างโฟลเดอร์ให้ผมดูก่อนเขียนโค้ดต่อ
