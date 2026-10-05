import { test, expect } from "@playwright/test";
import { AppCatalogPage } from "@crowdstrike/foundry-playwright";

const appName = process.env.APP_NAME ?? "Container Registry";

test("opens image details and paginates without syncing credentials", async ({ page }) => {
  const appCatalog = new AppCatalogPage(page);
  await appCatalog.navigateToInstalledApp(appName);

  const appFrame = page.frameLocator("iframe");
  await expect(appFrame.getByRole("heading", { name: "Container Registry" })).toBeVisible();
  await expect(appFrame.getByRole("heading", { name: "Images", level: 1 })).toBeVisible();
  await expect(appFrame.getByText("Last sync was")).toBeVisible();

  const imageList = appFrame.getByRole("list", { name: "Container registry images" });
  const firstImage = imageList.getByRole("listitem").first();
  await expect(firstImage).toBeVisible();
  await firstImage.getByRole("button", { name: "Details" }).click();

  const multiCloudHeading = firstImage.getByRole("heading", { name: "Multi-cloud registry" });
  const cloudSpecificHeading = firstImage.getByRole("heading", { name: "Cloud-specific registry" });
  const hasMultiCloud = (await multiCloudHeading.count()) > 0;
  const hasCloudSpecific = (await cloudSpecificHeading.count()) > 0;
  expect(hasMultiCloud || hasCloudSpecific).toBe(true);

  if (hasMultiCloud && hasCloudSpecific) {
    await expect(
      multiCloudHeading.locator("xpath=..").getByText("Image path", { exact: true })
    ).toBeVisible();
    await expect(
      cloudSpecificHeading.locator("xpath=..").getByText("Image path", { exact: true })
    ).toBeVisible();
  }

  await expect(appFrame.getByRole("columnheader", { name: "Tag" })).toBeVisible();
  await expect(appFrame.getByRole("columnheader", { name: "Architectures" })).toBeVisible();
  await expect(appFrame.getByRole("columnheader", { name: "Build date" })).toBeVisible();
  await expect(appFrame.getByRole("columnheader", { name: "Digest" })).toBeVisible();

  const nextPage = appFrame.getByRole("button", { name: "Go to next page" });
  if (await nextPage.isEnabled()) {
    await nextPage.click();
    await expect(appFrame.getByRole("button", { name: /11 - 20 of \d+/ })).toBeVisible();
  }
});