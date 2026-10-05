import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, request, test as setup } from "@playwright/test";
import { AuthFile, baseURL } from "@crowdstrike/foundry-playwright";

setup("reuse session or authenticate through SSO", async ({ page }) => {
  if (existsSync(AuthFile)) {
    const savedSession = await request.newContext({
      baseURL,
      storageState: AuthFile,
    });

    try {
      const response = await savedSession.post("/api2/auth/verify", {
        data: { checks: [] },
      });
      if (response.ok()) return;
    } finally {
      await savedSession.dispose();
    }
  }

  await page.goto(baseURL);
  console.log("Complete Falcon SSO login in the opened browser, then resume the Playwright test.");
  await page.pause();

  const response = await page.request.post(`${baseURL}/api2/auth/verify`, {
    data: { checks: [] },
  });
  expect(response.ok(), "Falcon SSO session should be authenticated").toBe(true);

  await mkdir(dirname(AuthFile), { recursive: true });
  await page.context().storageState({ path: AuthFile });
});