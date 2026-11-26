import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const quran = JSON.parse(
  await readFile(
    new URL("../../src/assets/quran.json", import.meta.url),
    "utf8",
  ),
) as {
  surah: number;
  ayah: number;
  text: string;
  surahName: string;
  juz: number;
}[];
async function seed(
  page: Page,
  options: {
    anchor?: string;
    pool?: string[];
    visibility?: string;
    partial?: boolean;
    count?: number;
  } = {},
) {
  const anchor = options.anchor || "8:52";
  const pool = (options.pool || ["8:52", "8:53", "8:54"]).map((k) =>
    quran.find((v) => v.surah + ":" + v.ayah === k)!,
  );
  await page.addInitScript(
    ({ options, anchor, pool }) => {
      if (sessionStorage.getItem("practice-test-seeded")) return;
      sessionStorage.setItem("practice-test-seeded", "yes");
      const [s, a] = anchor.split(":").map(Number);
      const end = pool.at(-1)!;
      const state = {
        mode: "custom",
        customConfig: {
          type: "exact",
          items: [],
          exact: {
            startSurah: s,
            startAyah: a,
            endSurah: end.surah,
            endAyah: end.ayah,
          },
        },
        randomVerse: pool.find((v) => v.surah === s && v.ayah === a),
        currentPool: pool,
        hasInteracted: true,
        partialMode: options.partial || false,
        partialWordCount: options.count || 1,
        previewMode: "text",
      };
      for (const [key, value] of Object.entries(state))
        sessionStorage.setItem(
          "ayahvault-memobuddy:" + key,
          JSON.stringify(value),
        );
      localStorage.setItem(
        "ayahvault-mushaf-visibility",
        options.visibility || "others",
      );
      Math.random = () => 0.99;
    },
    { options, anchor, pool },
  );
  await page.goto("/memobuddy");
  await page.getByRole("link", { name: "Open in Mushaf", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "In-mushaf MemoBuddy" }),
  ).toBeVisible();
  await expect(
    page.locator(".reading-page:not([inert]) .mushaf-fitted-image"),
  ).toBeVisible();
}
const selected = (page: Page, verse: string) =>
  page
    .locator(".reading-page:not([inert])")
    .getByRole("button", { name: "Select ayah " + verse, exact: true });
async function ink(page: Page) {
  const screenshot = await page
    .locator(".reading-page:not([inert]) .mushaf-fitted-image")
    .screenshot({ scale: "css" });
  return page.evaluate(async (image) => {
    const img = new Image();
    img.src = "data:image/png;base64," + image;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let dark = 0;
    for (let i = 0; i < data.length; i += 4)
      if (data[i] < 150 && data[i + 1] < 150 && data[i + 2] < 150) dark++;
    return dark;
  }, screenshot.toString("base64"));
}
test("concealment persists through page turns, reveals cross-page continuations, and shares new questions with MemoBuddy", async ({
  page,
}) => {
  await seed(page);
  await expect(selected(page, "8:52")).toBeVisible();
  await expect(selected(page, "8:51")).toHaveCount(0);
  await page.screenshot({ path: "test-results/practice-only-prompt.png" });
  const frame = await page.locator(".reader-frame").boundingBox();
  await page.getByLabel("Mushaf page").selectOption("184");
  await page.screenshot({ path: "test-results/practice-hidden-page.png" });
  await expect.poll(() => ink(page)).toBeLessThan(15);
  await expect(selected(page, "8:53")).toHaveCount(0);
  await page.getByRole("button", { name: "Reveal Next", exact: true }).click();
  await expect(selected(page, "8:53")).toBeVisible();
  await expect(selected(page, "8:54")).toHaveCount(0);
  expect(await page.locator(".reader-frame").boundingBox()).toEqual(frame);
  await page.screenshot({ path: "test-results/practice-revealed-next.png" });
  await page.getByRole("button", { name: "MemoBuddy", exact: true }).click();
  await page.getByRole("button", { name: "Reveal All", exact: true }).click();
  await expect(selected(page, "8:54")).toBeVisible();
  await page.getByRole("button", { name: "Hide again", exact: true }).click();
  await expect(selected(page, "8:53")).toBeVisible();
  await expect(selected(page, "8:54")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Mushaf page")).toHaveValue("184");
  await expect(selected(page, "8:53")).toBeVisible();
  await page.evaluate(() => {
    Math.random = () => 0.99;
  });
  await page.getByRole("button", { name: "New Ayah", exact: true }).click();
  await expect(selected(page, "8:54")).toBeVisible();
  await expect(selected(page, "8:53")).toHaveCount(0);
  await page.getByRole("link", { name: "Back to MemoBuddy" }).click();
  await expect(page.locator(".verse-reference")).toContainText("Ayah 54");
  await page.getByRole("link", { name: "Open in Mushaf", exact: true }).click();
  await page.getByRole("button", { name: "MemoBuddy", exact: true }).click();
  await page.getByRole("button", { name: "End Practice", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "In-mushaf MemoBuddy" }),
  ).toHaveCount(0);
  expect(await page.locator(".reader-frame").boundingBox()).toEqual(frame);
  await expect(selected(page, "8:53")).toBeVisible();
  await page.goto("/mushaf?page=3");
  await expect(selected(page, "2:6")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "In-mushaf MemoBuddy" }),
  ).toHaveCount(0);
});
test("a partial prompt stays in place, and Reveal Prompt precedes Reveal Next", async ({
  page,
}) => {
  await seed(page, { partial: true, count: 1 });
  const frame = await page.locator(".reader-frame").boundingBox();
  const initialInk = await ink(page);
  const prompt = selected(page, "8:52");
  await expect(prompt).toBeVisible();
  await page.screenshot({ path: "test-results/practice-partial-prompt.png" });
  await page
    .getByRole("button", { name: "Reveal Prompt", exact: true })
    .click();
  await expect.poll(() => ink(page)).toBeGreaterThan(initialInk * 3);
  expect(await page.locator(".reader-frame").boundingBox()).toEqual(frame);
  await expect(
    page.getByRole("button", { name: "Reveal Next", exact: true }),
  ).toBeVisible();
});
test("settings apply deliberately, reset keeps the page stable, and disjoint ranges never skip a gap", async ({
  page,
}) => {
  await seed(page, { pool: ["8:52", "8:54"], visibility: "following" });
  await expect(
    page.getByRole("button", { name: "End of Range", exact: true }),
  ).toBeDisabled();
  await expect(selected(page, "8:51")).toBeVisible();
  const frame = await page.locator(".reader-frame").boundingBox();
  await page.getByRole("button", { name: "MemoBuddy", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "MemoBuddy", exact: true });
  await expect(dialog.getByLabel('Start surah',{exact:true})).toHaveValue('8');
  await expect(dialog.getByLabel('Start ayah',{exact:true})).toHaveValue('52');
  await expect(dialog.getByLabel('End ayah',{exact:true})).toHaveValue('54');
  await page.screenshot({ path: "test-results/practice-settings-phone.png" });
  await dialog
    .getByLabel("Mushaf Visibility", { exact: true })
    .selectOption("others");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(selected(page, "8:51")).toBeVisible();
  await page.getByRole("button", { name: "MemoBuddy", exact: true }).click();
  await dialog
    .getByLabel("Mushaf Visibility", { exact: true })
    .selectOption("others");
  await dialog
    .getByRole("button", { name: "Apply Settings", exact: true })
    .click();
  await expect(selected(page, "8:51")).toHaveCount(0);
  expect(await page.locator(".reader-frame").boundingBox()).toEqual(frame);
});
test("an unsupported partial boundary never exposes the full prompt implicitly", async ({
  page,
}) => {
  await seed(page, { anchor: "95:1", pool: ["95:1", "95:2"], partial: true });
  await expect(selected(page, "95:1")).toHaveCount(0);
  await page.getByRole("button", { name: "MemoBuddy", exact: true }).click();
  await expect(
    page.getByText("This ayah’s word boundaries differ between editions.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Reveal Prompt", exact: true })
    .click();
  await expect(selected(page, "95:1")).toBeVisible();
});
