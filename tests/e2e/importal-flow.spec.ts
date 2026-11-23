import { expect, test } from "@playwright/test";

test.describe("Importal End-to-End Smoke & Workflow", () => {
  test("Dashboard, Packaging Board, Case Detail, Cases List & CSV Export load cleanly", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Importal Dashboard/ })).toBeVisible();
    await expect(page.getByText("รอฉันดำเนินการ")).toBeVisible();

    await page.goto("/packaging");
    await expect(page.getByRole("heading", { name: /Packaging Design Board/ })).toBeVisible();
    await expect(page.getByText("IP-2026-021")).toBeVisible();

    await page.goto("/cases/IP-2026-021");
    await expect(page.getByRole("heading", { name: /Timeline Packaging Design/ })).toBeVisible();
    await expect(page.getByText("ประวัติการตรวจและอนุมัติ")).toBeVisible();
    await expect(page.getByText("ขนาดบนหน้ากล่องต้องเป็น 21.5×18.5×30 ซม.")).toBeVisible();

    await page.goto("/cases");
    await expect(page.getByRole("heading", { name: /รายการ Import Cases ทั้งหมด/ })).toBeVisible();

    const csvRes = await request.get("/api/cases/export");
    expect(csvRes.status()).toBe(200);
    expect(csvRes.headers()["content-type"]).toContain("text/csv");
    const csvBody = await csvRes.text();
    expect(csvBody).toContain("IP-2026-021");
  });

  test("Sourcing & Logistic stage tabs render on Case Detail", async ({ page }) => {
    await page.goto("/cases/IP-2026-018");
    await expect(page.getByText("ขั้นตอนที่ 1: Sourcing & เปรียบเทียบใบเสนอราคา")).toBeVisible();
    await expect(page.getByText("Hangzhou Precision Tools Co., Ltd.")).toBeVisible();

    await page.goto("/cases/IP-2026-004");
    await expect(page.getByText("ขั้นตอนที่ 5: Inspection, Logistic & รับเข้าคลัง")).toBeVisible();
    await expect(page.locator('input[value="COSU6348192010"]')).toBeVisible();
  });

  test("Non-admin sees RBAC notice on /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น")).toBeVisible();
  });
});
