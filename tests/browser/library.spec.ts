import { test, expect } from "@playwright/test";
test("three-ayah comparison survives reload, links to fixed mushaf, and restores from backup", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/library");
  await expect(page.getByText("No entries yet.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "New Entry", exact: true }).click();
  await expect(page.getByRole("button", { name: "Add Ayah", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Find an ayah/ })).toHaveCount(0);
  await page
    .locator(".entry-title-input input")
    .fill("Pharaoh — three passages");
  for (const verse of ["3:11", "8:52", "8:54"]) {
    await page.getByRole("button", { name: "Add Ayah", exact: true }).click();
    await page.getByRole("textbox", { name: "Find an ayah" }).fill(verse);
    await page.locator(".verse-picker-results button").first().click();
  }
  const first = page.locator(".comparison-passages article").first();
  await first.locator(".comparison-arabic button").nth(0).click();
  await first.locator(".comparison-arabic button").nth(5).click();
  await page.getByLabel("New mark", { exact: true }).fill("Shared opening");
  await page.getByRole("button", { name: "Create Mark", exact: true }).click();
  await page
    .locator(".comparison-passages article")
    .nth(1)
    .locator(".comparison-arabic button")
    .nth(0)
    .click();
  await page
    .locator(".comparison-passages article")
    .nth(1)
    .locator(".comparison-arabic button")
    .nth(5)
    .click();
  await page
    .getByRole("button", { name: "1. Shared opening", exact: true })
    .click();
  await expect(first.locator("textarea")).toHaveCount(0);
  await first.getByRole("button", { name: "Add ayah comment" }).click();
  await first.locator("textarea").fill("Remember the shorter ending here.");
  await page.getByRole("button", { name: "Add memory note" }).click();
  await page
    .locator(".entry-notes textarea")
    .fill("Compare the verb and ending before reciting.");
  await page.screenshot({
    path: "test-results/library-editor-phone.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save Entry", exact: true }).click();
  await expect(page).toHaveURL(/\/library\/[0-9a-f-]+$/);
  const entryURL = page.url();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Pharaoh — three passages",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".comparison-passages article")).toHaveCount(3);
  const highlights = page.locator(".marked-phrase");
  await expect(highlights).toHaveCount(2);
  expect((await highlights.first().innerText()).trim().split(/\s+/)).toHaveLength(6);
  await expect(
    page.getByText("Compare the verb and ending before reciting."),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/library-entry-phone.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Open Ali 'Imran 11 in mushaf", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Open Mutashabihat for 3:11",
      exact: true,
    }),
  ).toBeVisible();
  const frame = await page.locator(".reader-frame").boundingBox();
  await page
    .locator(".reading-page")
    .filter({
      has: page.getByRole("button", {
        name: "Open Mutashabihat for 3:11",
        exact: true,
      }),
    })
    .locator(".mushaf-page-image")
    .waitFor();
  const region = page.getByRole("button", {
    name: "Select ayah 3:11",
    exact: true,
  });
  const box = (await region.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(550);
  await page.mouse.up();
  await expect(page.locator(".ayah-action-bar")).toBeVisible();
  expect(await page.locator(".reader-frame").boundingBox()).toEqual(frame);
  await region.press("Escape");
  await page.getByRole("button", { name: "Open Mutashabihat for 3:11", exact: true }).tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("link", { name: /Pharaoh — three passages/ }).click();
  await expect(page).toHaveURL(entryURL);
  await page.getByRole("link", { name: "Library", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Backup" }).click();
  const file = await (await download).path();
  const other = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const restored = await other.newPage();
  await restored.goto("http://127.0.0.1:5187/library");
  await restored.locator("input[type=file]").setInputFiles(file!);
  await expect(
    restored.getByRole("heading", {
      name: "Pharaoh — three passages",
      exact: true,
    }),
  ).toBeVisible();
  await other.close();
  expect(errors).toEqual([]);
});
test("basic reading and MemoBuddy have no account gate", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByPlaceholder("Search surah or ayah")).toBeVisible();
  await page.goto("/memobuddy");
  await expect(
    page.getByRole("heading", { name: "MemoBuddy", exact: true }),
  ).toBeVisible();
  await page.goto("/library/account");
  await expect(
    page.getByRole("heading", { name: "Cloud sync isn’t connected yet" }),
  ).toBeVisible();
});

test("competing open editors keep both versions instead of overwriting", async ({
  page,
  context,
}) => {
  await page.goto("/library/new?ayah=3:11");
  await page.locator(".entry-title-input input").fill("Competing edits");
  await page.getByRole("button", { name: "Save Entry", exact: true }).click();
  await expect(page).toHaveURL(/\/library\/[0-9a-f-]+$/);
  const url = page.url();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Add memory note" }).click();
  await page.locator(".entry-notes textarea").fill("First editor draft");
  const other = await context.newPage();
  await other.goto(url + "/edit");
  await other.getByRole("button", { name: "Add memory note" }).click();
  await other.locator(".entry-notes textarea").fill("Second editor saved");
  await other.getByRole("button", { name: "Save Entry", exact: true }).click();
  await expect(other).toHaveURL(url);
  await page.getByRole("button", { name: "Save Entry", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("changed");
  await page.getByRole("button", { name: "Save Draft as New Entry" }).click();
  await expect(
    page.getByText("First editor draft", { exact: true }),
  ).toBeVisible();
  await other.reload();
  await expect(
    other.getByText("Second editor saved", { exact: true }),
  ).toBeVisible();
  await other.close();
});

test("discard clears a draft and selected entries can be deleted together", async ({ page }) => {
  await page.goto("/library/new?ayah=3:11");
  await page.locator(".entry-title-input input").fill("Discard this draft");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  for (const title of ["First saved entry", "Second saved entry", "Keep this entry"]) {
    await page.getByRole("link", { name: "New Entry", exact: true }).click();
    await expect(page.locator(".entry-title-input input")).toHaveValue("");
    await page.locator(".entry-title-input input").fill(title);
    await page.getByRole("button", { name: "Add Ayah", exact: true }).click();
    await page.getByRole("textbox", { name: "Find an ayah" }).fill("3:11");
    await page.locator(".verse-picker-results button").first().click();
    await page.getByRole("button", { name: "Save Entry", exact: true }).click();
    await page.getByRole("main").getByRole("link", { name: "Library", exact: true }).click();
  }
  await page.getByRole("button", { name: "Select entries" }).click();
  await page.getByText("First saved entry", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "First saved entry" })).toBeChecked();
  await page.getByRole("checkbox", { name: "Second saved entry" }).check();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Delete selected (2)" }).click();
  await expect(page.getByRole("heading", { name: "Keep this entry" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Keep this entry" })).toBeVisible();
  await expect(page.getByText("saved entry", { exact: false })).toHaveCount(0);
});
