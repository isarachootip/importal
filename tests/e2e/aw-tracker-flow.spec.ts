import path from "node:path";
import { expect, test } from "@playwright/test";

const ARTIFACT_DIR = process.env.AW_SCREENSHOT_DIR ?? "";

async function maybeShot(page: import("@playwright/test").Page, filename: string) {
  if (!ARTIFACT_DIR) return;
  await page.screenshot({ path: path.join(ARTIFACT_DIR, filename), fullPage: true });
}

test.describe("AW Packaging Tracker — Full E2E Verification", () => {
  test("All 7 menus, Excel 5-sheet export, Save Draft, and Full PI Lifecycle (Create -> Goods Received)", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. My Tasks (/)
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "งานของฉัน" })).toBeVisible();
    await expect(page.getByText("AW Packaging Tracker")).toBeVisible();
    await maybeShot(page, "01-my-tasks.png");

    // 2. All Jobs (/jobs) + 5-Sheet Excel Export API
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "รายการงานทั้งหมด" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Export Excel/ })).toBeVisible();
    await maybeShot(page, "02-all-jobs.png");

    const exportRes = await request.get("/api/jobs/export");
    expect(exportRes.status()).toBe(200);
    expect(exportRes.headers()["content-type"]).toContain("spreadsheetml.sheet");

    // 3. Create Job (/create) + Save Draft in PostgreSQL + Submit New PI
    await page.goto("/create");
    await expect(page.getByRole("heading", { name: "แจ้งงานออกแบบ Packaging" })).toBeVisible();
    const uniquePi = `PI-E2E-${Date.now().toString().slice(-5)}`;
    await page.getByPlaceholder("เช่น PI-2611-065").fill(uniquePi);
    const sdeptInput = page.getByLabel("Sdept & Sdept Name 1");
    await sdeptInput.click();
    await sdeptInput.fill("102");
    await page.getByRole("option", { name: /102 Door Material/ }).click();
    await page.getByText("Y · นัดประชุม Brief").click();
    await page.getByPlaceholder("https://… (ตั้งชื่อ Folder เป็นเลขที่ PI)").fill(`https://drive.example.com/${uniquePi}`);

    // Save Draft & verify persistence across reload
    await page.getByRole("button", { name: /บันทึกร่าง/ }).click();
    await expect(page.getByText(/บันทึกร่างแล้ว/)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/เปิดจากร่างที่บันทึกไว้/)).toBeVisible();
    await maybeShot(page, "03-create-job.png");

    // Submit Create Job -> Navigates to Job Detail in Info Checking
    await page.getByRole("button", { name: /Send · แจ้งงานออกแบบ/ }).click();
    await expect(page).toHaveURL(/\/jobs\//);
    await expect(page.getByRole("heading", { name: uniquePi })).toBeVisible();

    // 4. Designer: Info Checking -> Confirm Info Complete -> Drafting -> Send Draft
    await page.locator("#roleSel").selectOption("designer");
    await expect(page.getByRole("button", { name: "บันทึกผลตรวจ" })).toBeVisible();
    await page.getByRole("button", { name: "บันทึกผลตรวจ" }).click();
    await expect(page.getByRole("button", { name: "ส่ง Draft ให้ Import ตรวจ" })).toBeVisible();
    await page.getByPlaceholder("https://…").fill(`https://drive.example.com/${uniquePi}/draft1`);
    await page.getByRole("button", { name: "ส่ง Draft ให้ Import ตรวจ" }).click();

    // 5. Import: Import Review -> Pass -> MDSG Review
    await page.locator("#roleSel").selectOption("import");
    await expect(page.getByRole("button", { name: /บันทึกผล Import/ })).toBeVisible();
    await page.getByLabel("Link Share Folder").fill(`https://drive.example.com/${uniquePi}/imp-ok`);
    await page.getByRole("button", { name: /บันทึกผล Import/ }).click();

    // 6. MDSG: Verify real Sdept 102 Buyer/GM/VP names appear -> Pass -> Present AW
    await page.locator("#roleSel").selectOption("mdsg");
    const mainArea = page.locator("main");
    await expect(mainArea.getByText(/คุณกฤต/)).toBeVisible();
    await expect(mainArea.getByText(/คุณโจ้/)).toBeVisible();
    await expect(mainArea.getByText(/คุณหมวย/)).toBeVisible();
    await maybeShot(page, "04-job-detail-mdsg.png");
    await mainArea.getByRole("button", { name: /บันทึกผล MDSG/ }).click();

    // 7. Designer: Present AW -> EVP Review -> Final AW -> Send to Factory -> Goods Received
    await page.locator("#roleSel").selectOption("designer");
    await page.getByRole("button", { name: "ส่งให้ EVP พิจารณา" }).click();

    await page.locator("#roleSel").selectOption("evp");
    await page.getByRole("button", { name: "บันทึกผล" }).click();

    await page.locator("#roleSel").selectOption("designer");
    await page.getByRole("button", { name: "Submit Final AW" }).click();

    await page.locator("#roleSel").selectOption("import");
    await page.getByPlaceholder("เช่น PO-2026-001").fill("PO-E2E-777");
    await page.getByRole("button", { name: "ใช้ SKU ตัวอย่าง (Demo)" }).click();
    await expect(mainArea.getByText(/อ่านได้/)).toBeVisible();
    await mainArea.getByRole("button", { name: "บันทึก", exact: true }).click();

    await expect(mainArea.getByRole("button", { name: /จำลองเรียก API Goods Received/ })).toBeVisible();
    await mainArea.getByRole("button", { name: /จำลองเรียก API Goods Received/ }).click();
    await expect(mainArea.getByText(/สินค้าเข้าแล้วเมื่อ/)).toBeVisible();

    // 8. Dashboard (3 Sections), Workflow, Rules, Email Notifications
    await page.goto("/dashboard");
    await expect(page.getByText("ภาพรวมทุกส่วนงาน")).toBeVisible();
    await expect(page.getByText("ภาพรวมงาน Designer และ Photographer")).toBeVisible();
    await expect(page.getByText(/มุมมอง Improvement/)).toBeVisible();
    await maybeShot(page, "05-dashboard.png");

    await page.goto("/workflow");
    await expect(page.getByText("Workflow การทำงาน (Swimlane)")).toBeVisible();
    await maybeShot(page, "06-workflow.png");

    await page.goto("/rules");
    await expect(page.getByText("เกณฑ์การวัดที่ใช้ใน Dashboard")).toBeVisible();
    await maybeShot(page, "07-rules.png");

    await page.goto("/notifications");
    await expect(page.getByText("ประวัติอีเมลที่ระบบส่ง (บันทึกในฐานข้อมูล)")).toBeVisible();
    await expect(page.getByText(new RegExp(uniquePi)).first()).toBeVisible();
    await maybeShot(page, "08-notifications.png");
  });
});
