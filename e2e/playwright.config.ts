import { devices } from "@playwright/test";
import { AuthFile, defineFoundryConfig } from "@crowdstrike/foundry-playwright";

export default defineFoundryConfig({
	retries: 2,
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
			use: {
				headless: false,
			},
		},
		{
			name: "chromium",
			testMatch: /registry\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
				storageState: AuthFile,
			},
			dependencies: ["setup"],
		},
	],
});